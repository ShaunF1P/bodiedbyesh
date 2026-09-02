# Backend & Ingress Architecture Analysis: Digital Clinical Client Intake System

**Project**: Bodied by Esh (`c:\projects\BodiedbyEsh`)  
**Target Subsystem**: Digital Clinical Client Intake Forms, Ingress API, Database Persistence & Notification Pipeline  
**Author**: teamwork_preview_explorer (Backend & Ingress Architecture)  
**Date**: 2026-09-02  

---

## 1. Executive Summary & Problem Scope

The Bodied by Esh platform requires a robust clinical intake infrastructure supporting three distinct coaching tracks:
1. **Track A (Park-to-Peak Recomp)**: Local South Florida on-site training (Merrit Park, Delray Beach / Parkland / Boca), cohort schedules (Mon/Wed vs Tue/Thu), PAR-Q+ orthopedic joint audits (grass/turf tolerance), environmental heat/humidity readiness, and digital signature waivers.
2. **Track B (Executive Concierge)**: Remote high-performance coaching, wearable bio-telemetry onboarding (Oura, Whoop, Apple Watch, Garmin; resting HR, HRV, sleep, strain), sedentary desk ergonomics (cervical spine, anterior pelvic tilt, hip flexor tightness), travel/dining cadence, and dynamic recovery waivers.
3. **Track C (Nutrition & Metabolic Health)**: Anthropometric baselines (Mifflin-St Jeor variables, body fat %, AI mesh consent), high-performance protein targets (~2.2g/kg), GI/behavioral triggers, and AI Meal Plate Scanner onboarding.

To support these forms, the backend must provide:
- **Database Persistence**: Idempotent Supabase PostgreSQL table `public.client_intakes` with JSONB clinical payload, Row Level Security (RLS), performance indexes, and automatic timestamp updates.
- **Ingress Route (`POST /api/intake`)**: High-throughput public ingress protected by sliding-window rate limiting (`evaluateRateLimit` / `checkRateLimit`), runtime Zod validation (`validateRequestBody`), Supabase persistence, GoHighLevel (GHL) CRM contact/opportunity upsert, automated client confirmation emails, and Coach Esh SMS/Email alerts via the Dependency Injection Service Container (`container.ts`).
- **Administrative Query Route (`GET /api/intake`)**: Protected by `requireAdminSession`, supporting track filtering, status filtering (`new`, `reviewed`, `enrolled`, `archived`), full-text search across client names/emails/phones, and pagination.
- **Administrative Status Route (`PATCH /api/intake`)**: Protected by `requireAdminSession`, allowing Coach Esh to transition intake statuses and add clinical review notes.

---

## 2. Codebase Infrastructure Audit & Existing Conventions

A comprehensive inspection of the existing codebase revealed well-established architectural patterns:

### 2.1 Supabase Client & Database Conventions
- **Browser Client**: `src/lib/supabase/client.ts` uses `@supabase/ssr` `createBrowserClient(url, anonKey)` for client components.
- **Server Client**: `src/lib/supabase/server.ts` uses `@supabase/ssr` `createServerClient(url, anonKey, { cookies })` for Server Components, Server Actions, and API Route Handlers.
- **Elevated / Service Role Access**: Admin endpoints and background syncs instantiate `@supabase/supabase-js` `createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY)` when executing privileged cross-client queries, falling back gracefully if service role keys are missing.
- **SQL Migration Patterns**: Migrations are archived in `scratch/` (e.g. `scratch/database_setup.sql`, `scratch/phase2_setup.sql`, `scratch/park_config_setup.sql`, `scratch/coastal_3266_setup.sql`) with idempotent DDL (`CREATE TABLE IF NOT EXISTS`, `DROP POLICY IF EXISTS`, `CREATE POLICY`, `SECURITY DEFINER` trigger functions).

### 2.2 Sliding-Window Rate Limiting
- **Module**: `src/lib/rate-limit.ts`
- **Mechanism**: In-memory sliding-window bucket store `rateLimitStore = new Map<string, number[]>()` with automatic timestamp expiration.
- **Policy**: `RATE_LIMIT_POLICIES.form` enforces `windowMs: 60_000` (1 minute), `maxRequests: 5`, `keyPrefix: "rl:form"`.
- **Usage**:
  ```ts
  const rateLimit = checkRateLimit(request, "form");
  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit);
  }
  ```
- **Response**: Standard HTTP 429 JSON response with `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` RFC headers.

### 2.3 Admin Authentication & Session RBAC
- **Module**: `src/lib/auth/admin.ts`
- **Mechanism**: `requireAdminSession(request?: NextRequest)`:
  - Calls `supabase.auth.getUser()`.
  - Verifies user exists and checks `user.app_metadata?.role === "admin"`.
  - Returns `{ user, error: null }` on success, or `{ user: null, error: Response }` (HTTP 401 Unauthorized or HTTP 403 Forbidden).
- **Navigation Integration**: `src/app/admin/layout.tsx` verifies admin status and manages sidebar navigation.

### 2.4 GoHighLevel (GHL) CRM Integration
- **Module**: `src/lib/ghl.ts` & `src/lib/adapters/GoHighLevelCRMService.ts`
- **Port Interface**: `src/lib/ports/ICRMService.ts` (`createOrUpdateContact`, `createOpportunity`, `updateOpportunityStage`).
- **Container**: `container.crmService` in `src/lib/container.ts`.
- **Resilience**: Gracefully handles missing API keys (`GHL_API_KEY` placeholder) without crashing the ingress endpoint, logging warnings and falling back cleanly.

### 2.5 Notification & Alert Utilities
- **Email**: `src/lib/mail.ts` uses Resend REST API (`https://api.resend.com/emails`) via native `fetchWithTimeout`, with simulated fallback in development.
- **SMS**: `src/lib/sms.ts` uses Twilio REST API (`https://api.twilio.com/2010-04-01/Accounts/...`) with simulated fallback in development.
- **Port Interface**: `src/lib/ports/ICommunicationService.ts` (`sendEmail`, `sendSMS`).
- **Container**: `container.communicationService` in `src/lib/container.ts`.
- **PII Redaction**: `src/lib/logger.ts` masks emails (`maskEmail`), phone numbers (`maskPhone`), and names (`maskName`), ensuring no raw PII leaks into production logs.

### 2.6 Validation & API Response Patterns
- **Validator**: `src/lib/validation/api-validator.ts` provides `validateRequestBody(request, schema)` and `validateQueryParams(searchParams, schema)`.
- **Schemas**: `src/lib/validation/schemas.ts` defines all Zod schemas with centralized type checking.

---

## 3. Database Schema & Migration Specification (`public.client_intakes`)

### 3.1 Schema Design
The table `public.client_intakes` must store all clinical intake submissions across all three tracks with full auditability and digital waiver verification.

| Column Name | PostgreSQL Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique intake submission identifier |
| `track` | `VARCHAR(50)` | `NOT NULL` | Coaching track: `'park-to-peak'`, `'executive-concierge'`, `'nutrition-metabolic'` |
| `client_name` | `TEXT` | `NOT NULL` | Full name of the client |
| `client_email` | `TEXT` | `NOT NULL` | Normalized lowercase email address |
| `client_phone` | `TEXT` | `NULLABLE` | Client contact phone number for SMS sync |
| `intake_data` | `JSONB` | `NOT NULL DEFAULT '{}'::jsonb` | Complete track-specific clinical questionnaire payload |
| `waiver_signed` | `BOOLEAN` | `NOT NULL DEFAULT false` | Acknowledgment & liability waiver agreement flag |
| `waiver_signature` | `TEXT` | `NULLABLE` | Typed legal digital signature representation |
| `waiver_signed_at` | `TIMESTAMPTZ` | `NULLABLE` | Timestamp when the digital waiver was signed |
| `status` | `VARCHAR(20)` | `NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'enrolled', 'archived'))` | Intake review lifecycle state |
| `coach_notes` | `TEXT` | `NULLABLE` | Internal administrative coaching notes |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT timezone('utc'::text, now())` | Submission timestamp (UTC) |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT timezone('utc'::text, now())` | Last status/intake update timestamp (UTC) |

### 3.2 SQL Migration Script (`scratch/client_intakes_setup.sql`)

```sql
-- ═════════════════════════════════════════════════════════════════════════════
-- Bodied by Esh — Digital Clinical Client Intake Persistence DDL & RLS Policies
-- Target Table: public.client_intakes
-- ═════════════════════════════════════════════════════════════════════════════

-- 1. Create client_intakes table
CREATE TABLE IF NOT EXISTS public.client_intakes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  track VARCHAR(50) NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  intake_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  waiver_signed BOOLEAN NOT NULL DEFAULT false,
  waiver_signature TEXT,
  waiver_signed_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'enrolled', 'archived')),
  coach_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_client_intakes_track ON public.client_intakes (track);
CREATE INDEX IF NOT EXISTS idx_client_intakes_status ON public.client_intakes (status);
CREATE INDEX IF NOT EXISTS idx_client_intakes_client_email ON public.client_intakes (LOWER(client_email));
CREATE INDEX IF NOT EXISTS idx_client_intakes_created_at ON public.client_intakes (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_intakes_intake_data ON public.client_intakes USING gin (intake_data);

-- 3. Automatic updated_at Trigger
CREATE OR REPLACE FUNCTION public.trg_set_updated_at_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_client_intakes_update ON public.client_intakes;
CREATE TRIGGER on_client_intakes_update
  BEFORE UPDATE ON public.client_intakes
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_set_updated_at_timestamp();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.client_intakes ENABLE ROW LEVEL SECURITY;

-- 4.1 Public Insert Policy: Allow public anonymous/client submissions from intake forms
DROP POLICY IF EXISTS "Allow public insert client intakes" ON public.client_intakes;
CREATE POLICY "Allow public insert client intakes" ON public.client_intakes
  FOR INSERT TO public
  WITH CHECK (true);

-- 4.2 Admin Read Policy: Allow authenticated users with admin role in app_metadata to read all intakes
DROP POLICY IF EXISTS "Allow admin read client intakes" ON public.client_intakes;
CREATE POLICY "Allow admin read client intakes" ON public.client_intakes
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 4.3 Admin Update Policy: Allow admins to update intake status & coach notes
DROP POLICY IF EXISTS "Allow admin update client intakes" ON public.client_intakes;
CREATE POLICY "Allow admin update client intakes" ON public.client_intakes
  FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 4.4 Admin Delete Policy: Allow admins to delete archived intakes
DROP POLICY IF EXISTS "Allow admin delete client intakes" ON public.client_intakes;
CREATE POLICY "Allow admin delete client intakes" ON public.client_intakes
  FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 4.5 Service Role Bypass Policy: Full access for server-side API routes
DROP POLICY IF EXISTS "Allow service role full access client intakes" ON public.client_intakes;
CREATE POLICY "Allow service role full access client intakes" ON public.client_intakes
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
```

---

## 4. Zod Schema Specifications (`src/lib/validation/schemas.ts`)

The schemas must validate track-specific clinical fields, common intake payloads, and admin query/update inputs:

```ts
import { z } from "zod";

export const ClientIntakeTrackEnum = z.enum([
  "park-to-peak",
  "executive-concierge",
  "nutrition-metabolic",
  "track_a",
  "track_b",
  "track_c",
]);

export const ClientIntakeStatusEnum = z.enum([
  "new",
  "reviewed",
  "enrolled",
  "archived",
]);

// ── Track A: Park-to-Peak Clinical Fields ──
export const ParkToPeakIntakeDataSchema = z.object({
  practiceCohort: z.enum(["mon_wed", "tue_thu", "flexible"]).default("mon_wed"),
  preferredLocation: z.string().default("Merrit Park (Delray Beach, FL)"),
  parqJointIssues: z.boolean().default(false),
  parqChestPain: z.boolean().default(false),
  parqDizziness: z.boolean().default(false),
  parqBloodPressure: z.boolean().default(false),
  parqDetails: z.string().max(1000).optional().nullable(),
  orthopedicAudit: z.object({
    knees: z.enum(["none", "mild", "moderate", "severe"]).default("none"),
    lowerBack: z.enum(["none", "mild", "moderate", "severe"]).default("none"),
    shoulders: z.enum(["none", "mild", "moderate", "severe"]).default("none"),
    anklesFeet: z.enum(["none", "mild", "moderate", "severe"]).default("none"),
    grassTurfTolerance: z.enum(["excellent", "moderate", "limited"]).default("excellent"),
  }).optional(),
  heatHumidityTolerance: z.enum(["high", "moderate", "low", "heat_sensitive"]).default("moderate"),
  hydrationHabits: z.string().max(500).optional(),
  emergencyContactName: z.string().min(1, "Emergency contact name is required").max(100),
  emergencyContactPhone: z.string().min(7, "Emergency contact phone is required").max(30),
  emergencyContactRelation: z.string().max(50).optional(),
  weatherPolicyAcknowledged: z.boolean().refine((val) => val === true, "Must acknowledge 24-hr/weather policy"),
  medicalConditions: z.string().max(1000).optional().nullable(),
  currentMedications: z.string().max(1000).optional().nullable(),
});

// ── Track B: Executive Concierge Clinical Fields ──
export const ExecutiveConciergeIntakeDataSchema = z.object({
  wearableDevices: z.array(z.string()).default([]), // ["Oura", "Whoop", "Apple Watch", "Garmin"]
  restingHeartRate: z.union([z.number().int().min(30).max(200), z.string()]).optional().nullable(),
  baselineHrv: z.union([z.number().min(0).max(300), z.string()]).optional().nullable(),
  averageSleepHours: z.union([z.number().min(1).max(24), z.string()]).optional().nullable(),
  averageSleepScore: z.union([z.number().int().min(0).max(100), z.string()]).optional().nullable(),
  dailyStrainTarget: z.union([z.number().min(0).max(25), z.string()]).optional().nullable(),
  deskErgonomics: z.object({
    cervicalSpineTension: z.enum(["none", "mild", "moderate", "severe"]).default("none"),
    anteriorPelvicTilt: z.enum(["none", "mild", "moderate", "severe"]).default("none"),
    hipFlexorTightness: z.enum(["none", "mild", "moderate", "severe"]).default("none"),
    dailySittingHours: z.union([z.number().min(0).max(24), z.string()]).default(8),
  }).optional(),
  travelCadence: z.enum(["rarely", "monthly", "biweekly", "weekly"]).default("monthly"),
  businessDinnersPerWeek: z.union([z.number().int().min(0).max(21), z.string()]).default(2),
  diningOutVsCooking: z.string().max(500).optional(),
  executiveStressLevel: z.enum(["low", "moderate", "high", "extreme"]).default("moderate"),
  dynamicRecoveryConsent: z.boolean().default(true),
});

// ── Track C: Nutrition & Metabolic Health Clinical Fields ──
export const NutritionMetabolicIntakeDataSchema = z.object({
  age: z.union([z.number().int().min(16).max(120), z.string()]).optional().nullable(),
  biologicalSex: z.enum(["male", "female", "prefer_not_to_say"]).default("female"),
  currentWeightLbs: z.union([z.number().min(50).max(800), z.string()]),
  targetWeightLbs: z.union([z.number().min(50).max(800), z.string()]).optional().nullable(),
  heightInches: z.union([z.number().min(36).max(96), z.string()]),
  estimatedBodyFatPercent: z.union([z.number().min(3).max(70), z.string()]).optional().nullable(),
  activityMultiplier: z.enum(["sedentary", "light", "moderate", "heavy", "athlete"]).default("moderate"),
  dailyProteinTargetGrams: z.union([z.number().min(0).max(500), z.string()]).optional().nullable(),
  dietaryRestrictions: z.array(z.string()).default([]), // ["Dairy-Free", "Gluten-Free", "Nut-Free", etc.]
  foodAllergies: z.string().max(1000).optional().nullable(),
  giBehavioralTriggers: z.object({
    bloatingFrequency: z.enum(["never", "occasional", "frequent", "daily"]).default("occasional"),
    acidReflux: z.boolean().default(false),
    emotionalEating: z.boolean().default(false),
    lateNightSnacking: z.boolean().default(false),
    caffeineDailyIntake: z.string().max(100).optional(),
  }).optional(),
  mealPrepHabits: z.enum(["cooks_daily", "meal_preps_weekly", "meal_service", "dining_out"]).default("cooks_daily"),
  aiMealPlateScannerConsent: z.boolean().default(true),
  aiMeshConsent: z.boolean().default(true),
});

// ── Universal Client Intake Submission Schema (POST /api/intake) ──
export const ClientIntakeSubmissionSchema = z.object({
  track: ClientIntakeTrackEnum,
  clientName: z.string().trim().min(1, "Full name is required").max(100),
  clientEmail: z.string().trim().email("Valid email address is required").toLowerCase(),
  clientPhone: z.string().trim().min(7, "Phone number is required").max(30),
  intakeData: z.record(z.string(), z.unknown()),
  waiverSigned: z.boolean().refine((val) => val === true, "Liability waiver must be accepted"),
  waiverSignature: z.string().trim().min(2, "Typed digital signature is required").max(100),
  waiverSignedAt: z.string().datetime().optional(),
});

// ── Admin Query Schema (GET /api/intake) ──
export const AdminIntakeQuerySchema = z.object({
  track: z.string().optional(),
  status: z.enum(["all", "new", "reviewed", "enrolled", "archived"]).optional().default("all"),
  search: z.string().optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(100)).optional().default(50),
  offset: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(0)).optional().default(0),
});

// ── Admin Patch Schema (PATCH /api/intake) ──
export const AdminIntakePatchSchema = z.object({
  id: z.string().uuid("Valid UUID is required"),
  status: ClientIntakeStatusEnum.optional(),
  coachNotes: z.string().max(2000).optional().nullable(),
});
```

---

## 5. API Endpoints Architecture & Implementation Design

### 5.1 `POST /api/intake`
- **Location**: `src/app/api/intake/route.ts`
- **Security & Pipeline Execution**:
  1. **Sliding-Window Rate Limiter**:
     ```ts
     const rateLimit = checkRateLimit(request, "form");
     if (!rateLimit.success) return rateLimitResponse(rateLimit);
     ```
  2. **Zod Body Validation**:
     ```ts
     const validation = await validateRequestBody(request, ClientIntakeSubmissionSchema);
     if (!validation.success) return validation.response;
     ```
  3. **Database Insertion (`public.client_intakes`)**:
     ```ts
     const supabase = getSupabaseServiceClient();
     const { data: intakeRow, error: dbError } = await supabase
       .from("client_intakes")
       .insert({
         track,
         client_name: clientName,
         client_email: clientEmail,
         client_phone: clientPhone,
         intake_data: intakeData,
         waiver_signed: waiverSigned,
         waiver_signature: waiverSignature,
         waiver_signed_at: waiverSignedAt || new Date().toISOString(),
         status: "new",
       })
       .select("id")
       .single();
     ```
  4. **GoHighLevel (GHL) Contact Upsert & Opportunity Sync**:
     ```ts
     const trackTag = `intake:${track}`;
     const contact = await container.crmService.createOrUpdateContact({
       email: clientEmail,
       name: clientName,
       phone: clientPhone,
       tags: ["bodied-intake", trackTag, "status:new"],
     });
     ```
  5. **Notification Dispatch Pipeline via `container.communicationService`**:
     - **Coach Esh Email Alert**:
       - To: `process.env.COACH_NOTIFICATION_EMAIL || "BodiedByEsh@gmail.com"`
       - Subject: `New Clinical Intake: ${clientName} (${formatTrackName(track)})`
       - HTML: Obsidian Gold styled card detailing track, contact info, clinical red flags (PAR-Q+, joint audits), and link to `/admin/intakes`.
     - **Coach Esh SMS Alert**:
       - To: `process.env.COACH_NOTIFICATION_PHONE || "+17728774231"`
       - Body: `Bodied by Esh: New ${formatTrackName(track)} clinical intake submitted by ${clientName}. Review at bodiedbyesh.com/admin/intakes`
     - **Client Confirmation Email**:
       - To: `clientEmail`
       - Subject: `Clinical Intake Confirmed — Bodied by Esh (${formatTrackName(track)})`
       - HTML: Welcoming client, confirming their digital waiver was filed, and setting next kickoff expectations.
  6. **Response**: HTTP 201 Created `{ success: true, intakeId: intakeRow?.id, track }`.

### 5.2 `GET /api/intake`
- **Location**: `src/app/api/intake/route.ts`
- **Security & Authorization**:
  ```ts
  const { user, error: authError } = await requireAdminSession(request);
  if (authError) return authError;
  ```
- **Query Processing**:
  - Validates search parameters via `validateQueryParams(request.nextUrl.searchParams, AdminIntakeQuerySchema)`.
  - Filters by `track` (`park-to-peak`, `executive-concierge`, `nutrition-metabolic`) if supplied.
  - Filters by `status` (`new`, `reviewed`, `enrolled`, `archived`) if not `'all'`.
  - Performs case-insensitive search (`or(`client_name.ilike.%${search}%,client_email.ilike.%${search}%,client_phone.ilike.%${search}%)`).
  - Orders by `created_at DESC` with pagination (`range(offset, offset + limit - 1)`).
- **Response**: HTTP 200 JSON `{ success: true, data: intakes, count: totalCount }`.

### 5.3 `PATCH /api/intake`
- **Location**: `src/app/api/intake/route.ts`
- **Security & Authorization**:
  ```ts
  const { error: authError } = await requireAdminSession(request);
  if (authError) return authError;
  ```
- **Update Execution**:
  - Validates body against `AdminIntakePatchSchema`.
  - Updates `status` and `coach_notes` in `public.client_intakes`.
- **Response**: HTTP 200 JSON `{ success: true, data: updatedRow }`.

---

## 6. Admin Portal Integration & Layout Compliance

1. **Sidebar Navigation Update (`src/app/admin/layout.tsx`)**:
   Add `{ href: "/admin/intakes", label: "Client Intakes", icon: ClipboardCheck }` directly to `NAV_ITEMS`.
2. **Admin Review Portal (`src/app/admin/intakes/page.tsx`)**:
   - Filter bar: Track dropdown (All, Park-to-Peak, Executive Concierge, Nutrition & Metabolic), Status tabs (All, New, Reviewed, Enrolled, Archived), real-time search input.
   - Intake Table: Client avatar, name, email, phone, track badge, submission date, status badge, waiver verification icon, and "Review Full Clinical Intake" modal/drawer trigger.
   - Clinical Drawer: Formatted view of PAR-Q+ questions, bio-telemetry, macro baselines, orthopedic joint audits, and digital waiver signature block.
   - Status actions: 1-click status transitions (`Mark Reviewed`, `Enroll Client`, `Archive`).

---

## 7. Downstream Implementation Checklist & File Map

| Component | Target File | Action Required |
|---|---|---|
| **SQL Migration** | `scratch/client_intakes_setup.sql` | Create idempotent table, indexes, RLS policies, trigger |
| **Validation Schemas** | `src/lib/validation/schemas.ts` | Export `ClientIntakeSubmissionSchema`, track schemas, admin schemas |
| **API Handlers** | `src/app/api/intake/route.ts` | Implement `POST`, `GET`, and `PATCH` with rate limiting, auth, GHL & notifications |
| **Admin Navigation** | `src/app/admin/layout.tsx` | Add "Client Intakes" item to `NAV_ITEMS` with Lucide icon |
| **Admin Portal Page** | `src/app/admin/intakes/page.tsx` | Build intake review table, search, filters, drawer, and status updater |
| **Intake Hub** | `src/app/intake/page.tsx` | Build unified hub with track cards & 1-click link copying |
| **Track A Route** | `src/app/intake/park-to-peak/page.tsx` | Build Track A clinical form with LocalStorage auto-save & waiver |
| **Track B Route** | `src/app/intake/executive-concierge/page.tsx` | Build Track B bio-telemetry form with LocalStorage auto-save & waiver |
| **Track C Route** | `src/app/intake/nutrition-metabolic/page.tsx` | Build Track C macro & metabolic form with LocalStorage auto-save & waiver |

---

## 8. Verification & Quality Gates

1. **Lint & Type Check**:
   ```bash
   npm.cmd run build
   ```
2. **Automated Security & Architecture Test Suites**:
   ```bash
   node scripts/run-m1-security-tests.mjs
   node scripts/run-m2-sre-tests.mjs
   node scripts/run-m3-architecture-tests.mjs
   node scripts/run-smoke-test.mjs
   node scripts/run-prr-audit-suite.mjs
   ```
3. **Database Verification**:
   Execute `scratch/client_intakes_setup.sql` in Supabase SQL Editor and test `POST /api/intake` with sample JSON payloads.
4. **Rate Limit Verification**:
   Send >5 requests within 60 seconds to `/api/intake` and verify HTTP 429 response.
5. **Admin Access Verification**:
   Verify unauthenticated `GET /api/intake` returns HTTP 401, non-admin session returns HTTP 403, and valid admin returns HTTP 200.
