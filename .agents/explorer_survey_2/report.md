# Survey Report: Requirement R2 (Domain Logic, SRE & Data Isolation)

**Explorer Subagent**: `explorer_survey_2`  
**Working Directory**: `c:\projects\BodiedbyEsh\.agents\explorer_survey_2`  
**Timestamp**: 2026-08-28T19:58:00Z  
**Project**: Bodied by Esh (`c:\projects\BodiedbyEsh`)  
**Scope**: Requirement R2 (Phase 2 P1 Issues: Rate Limiting, Health/Step Auth Anti-Spoofing, Park Schedule Persistence, PII Logging Redaction)

---

## Executive Summary

This survey provides a comprehensive architectural and security audit of the Bodied by Esh platform for Requirement R2. Our investigation examined all API route handlers, data access layers, configuration files, and third-party integration boundaries across the repository.

### Key Audit Findings:
1. **Public Form Routes & Rate Limiting**: No rate limiting utilities exist anywhere in the application. Critical public endpoints (`/api/ghl-contact`, `/api/book-appointment`, `/api/scan-meal`, `/api/recommend-recipe`, `/api/create-checkout-session`) directly invoke paid external third-party services (Twilio SMS, Resend email, Google Gemini AI, Stripe, GoHighLevel). They are entirely unprotected against SMS bombing, email quota exhaustion, and denial-of-wallet attacks.
2. **Health Tracker & Step Logging User Authentication**: Endpoints `/api/sync/health`, `/api/coastal/steps`, `/api/coastal/devotionals`, and `/api/coastal/community` contain critical authentication fallback bypasses (`auth?.user?.id || body.userId || "guest-user"`). Any unauthenticated actor can spoof arbitrary user IDs, log falsified step metrics, manipulate leaderboards, or delete other users' step records.
3. **Park Schedule Configuration**: `/api/park-config` reads and writes to an ephemeral local JSON file (`data/park-config.json`). On Vercel serverless deployments, the filesystem is read-only/ephemeral, causing writes to fail or be discarded across instances. Administrative authorization on this route relies on a hardcoded PIN (`"0408"` / `"bodiedbyesh"`).
4. **Customer PII Standard Output Logging**: Multiple API routes (`/api/ghl-contact`, `/api/webhook/stripe`) and communication libraries (`src/lib/mail.ts`, `src/lib/sms.ts`) output unredacted customer emails, phone numbers, full names, and full notification HTML payloads directly to standard output via `console.log`.

---

## 1. Public Form Routes & Sliding-Window IP Rate Limiting (R2.1)

### 1.1 Current Architecture & Code Observations
An exhaustive grep search for `ratelimit`, `rate-limit`, and `@upstash` confirmed that no rate limiting library, middleware hook, or memory cache currently exists.

Public endpoints analyzed:
- **`src/app/api/ghl-contact/route.ts`** (Lines 15–181):
  - Ingress: Public unauthenticated `POST` accepting `{ name, email, phone, programChoice, trackGoal, source }`.
  - Downstream Actions:
    - Inserts lead record into Supabase `coaching_leads` (Lines 42–61).
    - Dispatches email alert to Coach Esh via `sendEmail()` (Lines 95–99).
    - Dispatches SMS alert to Coach Esh via `sendSMS()` (Lines 110–113).
    - Performs GoHighLevel contact upsert & opportunity creation (Lines 134–156).
  - Vulnerability: An automated attacker can script 1,000 requests per minute to flood Coach Esh's personal phone with SMS messages, exhaust Twilio and Resend API quotas, and pollute the database.
- **`src/app/api/book-appointment/route.ts`** (Lines 13–101):
  - Ingress: Public unauthenticated `POST` accepting `{ email, name, programName, slot }`.
  - Downstream Actions:
    - Dispatches confirmation email to client (Lines 56–60).
    - Dispatches email alert to Coach Esh (Lines 82–86).
    - Dispatches SMS alert to Coach Esh (Lines 88–91).
  - Vulnerability: Unrestricted endpoint allows sending arbitrary emails to arbitrary recipient addresses (`resolvedEmail`), exposing the platform as an open email relay and SMS bomber.
- **`src/app/api/scan-meal/route.ts`** (Lines 56–119) & **`src/app/api/scan-menu/route.ts`**:
  - Ingress: Public `POST` taking base64 images.
  - Downstream Action: Calls Google Gemini Flash 3.5 API (`@google/generative-ai`).
  - Vulnerability: Unbounded API usage can rapidly exhaust Google Gemini API token quotas.
- **`src/app/api/create-checkout-session/route.ts`** (Lines 13–68):
  - Ingress: Public `POST` creating Stripe Checkout sessions.
  - Vulnerability: Susceptible to automated bot carding and Stripe session creation abuse.

### 1.2 Recommended Rate Limiter Design (`src/lib/rate-limit.ts`)
We recommend building a lightweight, zero-dependency sliding-window rate limiter with an in-memory ring-buffer/timestamp sliding window and optional Upstash Redis adapter fallback.

#### Architecture Specification:
```ts
// Rate limiter sliding-window bucket
interface RateLimitConfig {
  windowMs: number; // e.g., 60_000 (1 minute)
  maxRequests: number; // e.g., 5
  keyPrefix?: string;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in seconds
  retryAfterSeconds?: number;
}
```

#### IP Resolution Strategy:
```ts
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0].trim();
    if (firstIp) return firstIp;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  return "127.0.0.1";
}
```

#### Rate Limiting Policies:
| Policy Name | Window | Max Limit | Target Routes |
|---|---|---|---|
| `publicFormLimiter` | 60 seconds | 5 requests | `/api/ghl-contact`, `/api/book-appointment`, `/api/coastal/join`, `/api/logo-feedback` |
| `aiInferenceLimiter` | 60 seconds | 10 requests | `/api/scan-meal`, `/api/scan-menu`, `/api/recommend-recipe` |
| `checkoutLimiter` | 60 seconds | 10 requests | `/api/create-checkout-session`, `/api/checkout-session` |
| `authSyncLimiter` | 60 seconds | 30 requests | `/api/sync/health`, `/api/coastal/steps` |

#### Standard Response on Rate Exceeded:
When `!rateLimitResult.success`, routes return `429 Too Many Requests` with standard RFC headers:
```ts
return Response.json(
  {
    error: "Too many requests. Please slow down.",
    retryAfter: result.retryAfterSeconds,
  },
  {
    status: 429,
    headers: {
      "Retry-After": String(result.retryAfterSeconds),
      "X-RateLimit-Limit": String(result.limit),
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": String(result.reset),
    },
  }
);
```

---

## 2. Health Tracker & Step Logging User Authentication (R2.2)

### 2.1 Current Architecture & Vulnerabilities Found
In the existing implementation, multiple API handlers attempt to retrieve the user via `getAuthUser(request)` using `@supabase/ssr`, but fallback to untrusted client-supplied parameters:

#### Vulnerable Code Locations:
1. **`src/app/api/sync/health/route.ts`** (Lines 86–87):
   ```ts
   const auth = await getAuthUser(request);
   const userId = auth?.user?.id || body.userId || "guest-user";
   ```
   - **Vulnerability**: If an unauthenticated caller sends `{ provider: "apple_health", steps: 200000, userId: "<target_user_uuid>" }`, the server accepts and writes the steps under the victim's user ID.
2. **`src/app/api/coastal/steps/route.ts`**:
   - GET (Line 42): `const userId = auth?.user?.id || searchParams.get("userId") || "guest-user";`
   - POST (Line 88): `const userId = auth?.user?.id || body.userId || "guest-user";`
   - DELETE (Line 145): `const userId = auth?.user?.id || searchParams.get("userId") || "guest-user";`
   - **Vulnerability**: An attacker can read, create, or delete any user's step logs by providing their `userId` in query parameters or request body.
3. **`src/app/api/coastal/devotionals/route.ts`** (Line 116):
   ```ts
   const userId = auth?.user?.id || body.userId || "guest-user";
   ```
   - **Vulnerability**: Forges devotional reflections for other church members.
4. **`src/app/api/coastal/community/route.ts`** (Line 101):
   ```ts
   const userId = auth?.user?.id || body.userId || "guest-user";
   ```
   - **Vulnerability**: Forges community encouragement posts and reactions under spoofed user identities.
5. **`src/app/api/coastal/join/route.ts`** (Line 40):
   ```ts
   const userId = auth?.user?.id || body.userId;
   ```
   - **Vulnerability**: Joins arbitrary user IDs into the group.

### 2.2 Recommended Remediation Design
1. **Eliminate All Fallbacks**: Remove `|| body.userId` and `|| searchParams.get("userId")` and `|| "guest-user"` across all mutating and private endpoints.
2. **Enforce Strict Session Authentication**:
   - Create a reusable session extractor `requireUserSession(request: NextRequest)` in `src/lib/supabase/server.ts`.
   - If `!user`: Immediately return HTTP `401 Unauthorized`:
     ```json
     { "success": false, "error": "Unauthorized: Active user session required" }
     ```
   - Set `userId = user.id` exclusively from `user.id`.
3. **Delete Operation Guard**: In DELETE `/api/coastal/steps`, verify `log_id` ownership:
   ```ts
   const { data: log } = await supabase.from("step_logs").select("user_id").eq("id", logId).single();
   if (!log || log.user_id !== user.id) {
     return NextResponse.json({ success: false, error: "Forbidden: Not your step log" }, { status: 403 });
   }
   ```

---

## 3. Park Schedule Configuration Persistence (R2.3)

### 3.1 Current Architecture & Issues
- **File System Dependency**: `src/app/api/park-config/route.ts` uses `fs/promises` to read and write `data/park-config.json` (Line 5):
  ```ts
  const CONFIG_PATH = path.join(process.cwd(), "data", "park-config.json");
  ```
- **Serverless Incompatibility**: Vercel Serverless Functions execute in a read-only container (except `/tmp`). Any `POST` request attempting `await fs.writeFile(CONFIG_PATH, ...)` throws an `EROFS` error in production or writes to an ephemeral container instance that is immediately destroyed.
- **Insecure Authorization**: Line 62 validates the legacy administrative PIN:
  ```ts
  if (body.pin !== adminPin && body.pin !== "bodiedbyesh")
  ```
- **Usage Across App**:
  - `src/app/admin/park/page.tsx` (Lines 65, 88): Admin editing interface.
  - `src/app/park/page.tsx` (Line 54): Public landing page fetching schedule and park information.

### 3.2 Recommended Supabase Architecture & Migration Plan

#### 1. Supabase PostgreSQL Table DDL (`scratch/park_config_setup.sql`):
```sql
-- Create park_config table
create table if not exists public.park_config (
  id text primary key default 'primary',
  active_park jsonb not null,
  schedule jsonb not null,
  what_to_bring jsonb not null,
  coach_notes text,
  is_accepting_new_clients boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Seed initial row from current data/park-config.json
insert into public.park_config (id, active_park, schedule, what_to_bring, coach_notes, is_accepting_new_clients, updated_at)
values (
  'primary',
  '{"name": "Merrit Park", "city": "Delray Beach, FL", "address": "601 N Congress Ave, Delray Beach, FL 33445", "meetingSpot": "Grassy area near the east pavilion by the playground", "googleMapsUrl": "https://maps.google.com/?q=Merrit+Park+Delray+Beach+FL"}'::jsonb,
  '[{"day": "Monday & Wednesday", "time": "6:15 PM", "duration": "60 min"}, {"day": "Tuesday & Thursday", "time": "6:15 PM", "duration": "60 min"}]'::jsonb,
  '["Personal training mat", "Water bottle (hydration is non-negotiable)", "Booty bands", "Training gloves (if needed)"]'::jsonb,
  'Limited spots available! Sessions start exactly 10 minutes after kids drop-off. Arrive 5 minutes early to warm up. Rain policy: if it is lightning, we reschedule via SMS within 1 hour.',
  true,
  now()
)
on conflict (id) do nothing;

-- Enable RLS
alter table public.park_config enable row level security;

-- Policies
create policy "Allow public read park config" on public.park_config
  for select using (true);

create policy "Allow admin write park config" on public.park_config
  for all using (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );

create policy "Allow service role full access park config" on public.park_config
  for all using (true);
```

#### 2. Refactored Route Handler (`src/app/api/park-config/route.ts`):
- **`GET`**: Query `supabase.from("park_config").select("*").eq("id", "primary").single()`.
  - Fallback: If DB query fails or table is empty, return static `DEFAULT_CONFIG` / `data/park-config.json`.
- **`POST` / `PUT`**:
  - Authenticate admin session via Supabase Auth (`user.app_metadata?.role === 'admin'`).
  - Upsert to `public.park_config`.
  - In local dev environment, optionally sync to `data/park-config.json` as a secondary backup.

---

## 4. Customer PII Standard Output Logging & Redaction (R2.4)

### 4.1 Identified PII Log Leaks

| File | Line Numbers | Logged Data | Severity |
|---|---|---|---|
| `src/lib/mail.ts` | Line 33 | Raw recipient email address | High |
| `src/lib/mail.ts` | Lines 45–53 | Unredacted recipient email, subject, and full HTML payload containing customer name, phone, program track, and fitness goals | Critical |
| `src/lib/sms.ts` | Line 36 | Raw recipient phone number | High |
| `src/lib/sms.ts` | Lines 48–54 | Unredacted recipient phone number and SMS body containing client name and program choices | Critical |
| `src/app/api/ghl-contact/route.ts` | Line 142 | `console.log([GHL] Contact upserted: ${contact.id} (${email}))` | High |
| `src/app/api/webhook/stripe/route.ts` | Lines 56–58 | `console.log([stripe-webhook] [SUCCESS] Checkout completed — session ${session.id}, email: ${session.customer_email})` | High |
| `src/app/api/webhook/stripe/route.ts` | Line 81 | `console.log([stripe-webhook] Updated lead status in Supabase to active for ${cleanedEmail})` | Medium |

### 4.2 Recommended Redaction Utility & Structured Logger (`src/lib/logger.ts`)

Create a structured logger utility that automatically masks customer PII before sending output to stdout:

```ts
// src/lib/logger.ts

export function maskEmail(email?: string | null): string {
  if (!email) return "anonymous";
  const [user, domain] = email.trim().toLowerCase().split("@");
  if (!domain) return "***";
  const maskedUser = user.length <= 2 
    ? user[0] + "***" 
    : user[0] + "***" + user[user.length - 1];
  return `${maskedUser}@${domain}`;
}

export function maskPhone(phone?: string | null): string {
  if (!phone) return "not-provided";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  const last4 = digits.slice(-4);
  return `+1***${last4}`;
}

export function maskName(name?: string | null): string {
  if (!name) return "Client";
  const parts = name.trim().split(/\s+/);
  return parts.map((p) => (p.length > 1 ? `${p[0]}***` : p)).join(" ");
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    // Suppress verbose payload dumping in production
    if (process.env.NODE_ENV === "production" && meta?.suppressInProd) return;
    console.log(`[INFO] ${message}`, meta ? JSON.stringify(sanitizeMeta(meta)) : "");
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn(`[WARN] ${message}`, meta ? JSON.stringify(sanitizeMeta(meta)) : "");
  },
  error: (message: string, error?: unknown) => {
    console.error(`[ERROR] ${message}`, error instanceof Error ? error.message : error);
  },
};
```

---

## 5. Summary & Action Plan for Implementation Agents

1. **Step 1 (Rate Limiting)**: Create `src/lib/rate-limit.ts` with in-memory sliding-window token bucket. Wrap public form and AI endpoints (`/api/ghl-contact`, `/api/book-appointment`, `/api/scan-meal`, `/api/recommend-recipe`, `/api/create-checkout-session`).
2. **Step 2 (Session Authentication)**: Enforce strict `@supabase/ssr` user session authentication on `/api/sync/health`, `/api/coastal/steps`, `/api/coastal/devotionals`, `/api/coastal/community`, `/api/coastal/join`. Disallow client-provided `body.userId` overrides.
3. **Step 3 (Park Schedule Supabase Table)**: Create `scratch/park_config_setup.sql`, execute or seed table `public.park_config`, update `/api/park-config/route.ts` to query Supabase with fallback to JSON, and update admin panel authentication.
4. **Step 4 (PII Redaction)**: Create `src/lib/logger.ts`. Replace raw `console.log` / `console.error` calls across `mail.ts`, `sms.ts`, `ghl-contact/route.ts`, `stripe/route.ts`, and `log-meal/route.ts`.

---
*Report generated by Explorer Subagent `explorer_survey_2` for Bodied by Esh PRR Remediation.*
