# Requirement R1 Codebase Survey & Remediation Architecture Report
**Platform**: Bodied by Esh (`BodiedbyEsh.com`)  
**Scope**: Requirement R1 (Perimeter & Security Ingress Hardening)  
**Investigator**: Explorer Subagent (`explorer_survey_1`)  
**Date**: 2026-08-28  
**Status**: Complete  

---

## Executive Summary

An exhaustive security audit and static code analysis across the Bodied by Esh codebase (`c:\projects\BodiedbyEsh`) was conducted to evaluate the perimeter ingress, administrative authentication barriers, client data isolation, and payment session integrity.

Four critical vulnerability clusters were identified that allow unauthorized administrative access, client data exfiltration, database tampering, and arbitrary pricing manipulation:
1. **Hardcoded Administrative Fallback PINs & Client-Side Auto-Seeding**: Hardcoded PIN strings (`"0408"`, `"bodiedbyesh"`) and fallback conditionals allow unauthenticated bypasses. In `src/app/dashboard/page.tsx`, visiting `/dashboard?admin=true` or `/dashboard?viewAs=...` automatically seeds `sessionStorage.setItem("admin_pin", "0408")` and triggers service-role queries to dump the entire member roster, client contact details, workouts, and nutrition data.
2. **Insecure Administrative Route Authorization**: Administrative API routes (`/api/admin/*`, `/api/park-config`, `/api/logo-feedback`, `/api/chat`) authenticate via an unauthenticated `x-admin-pin` HTTP header rather than cryptographic, session-backed Supabase Auth metadata checks (`user.app_metadata.role === 'admin'`).
3. **Broken Object-Level Authorization (BOLA) in Meal Logging**: `/api/log-meal` uses the Supabase `service_role` client to query and write data. `GET /api/log-meal?email=...` allows any unauthenticated actor to scrape any user's complete food history and meal images, while `POST /api/log-meal` allows spoofed meal log injection into arbitrary accounts.
4. **Unvalidated Stripe Checkout Price IDs**: `/api/create-checkout-session` accepts arbitrary `priceId` strings from client JSON payloads without server-side validation against configured Stripe environment variables or program choice enums.

This report provides the exhaustive inventory of all affected files, line numbers, vulnerable logic, and complete production-ready remediation specifications.

---

## Section 1: Hardcoded Administrative Fallback PINs & Client Storage Auto-Seeding

### 1.1 Vulnerability Overview & Threat Model
- **CWE-798**: Use of Hard-coded Credentials
- **CWE-287**: Improper Authentication
- **CWE-522**: Insufficiently Protected Credentials
- **Risk Level**: **CRITICAL (CVSS 9.8)**

The platform relies on a static 4-digit PIN (`"0408"`) and a secondary static passphrase (`"bodiedbyesh"`) as the gatekeeper for administrative APIs and UI dashboards. Multiple endpoints fall back to `"0408"` when `process.env.ADMIN_PIN` is undefined. Furthermore, the dashboard UI contains logic that automatically writes `"0408"` into the user's browser `sessionStorage` upon encountering specific URL query parameters.

### 1.2 Exhaustive Codebase Inventory

| File Path | Line Range | Vulnerable Code Pattern | Risk Description |
|---|---|---|---|
| `src/app/dashboard/page.tsx` | Lines 121, 211–224 | `sessionStorage.getItem("admin_pin") \|\| "0408"`<br/>`if (!savedAdminPin) sessionStorage.setItem("admin_pin", "0408");` | **P0 Auto-Seeding Vulnerability**: Any unauthenticated visitor accessing `/dashboard?admin=true` or `/dashboard?viewAs=victim@example.com` automatically gains staff admin state in browser storage and fetches the entire client roster. |
| `src/components/AdminClientSwitcher.tsx` | Lines 74, 127 | `sessionStorage.getItem("admin_pin") \|\| "0408"`<br/>`"x-admin-pin": pin \|\| "0408"` | Auto-falls back to PIN `"0408"` in member switcher and target editing PATCH requests. |
| `src/app/admin/layout.tsx` | Lines 20–23, 44–58, 73, 97–110 | `sessionStorage.getItem("admin_pin")`<br/>`<input type="password" maxLength={4} ... />` | Admin dashboard layout gates views using client-side PIN entry stored in `sessionStorage` and verified via `/api/admin/leads`. |
| `src/app/api/admin/client-profile/route.ts` | Lines 16–20, 186–190, 256–260 | `const configuredPin = process.env.ADMIN_PIN \|\| "0408";`<br/>`if (adminPin !== configuredPin && adminPin !== "0408" && adminPin !== "bodiedbyesh")` | GET, POST, and PATCH handlers allow administrative client profile retrieval, creation, and updates using hardcoded `"0408"` or `"bodiedbyesh"`. |
| `src/app/api/admin/leads/route.ts` | Lines 40–45, 74–79 | `const adminPin = process.env.ADMIN_PIN \|\| "0408";`<br/>`if (authHeader !== adminPin && authHeader !== "bodiedbyesh")` | GET and PATCH handlers allow lead retrieval and status updates using hardcoded `"0408"` or `"bodiedbyesh"`. |
| `src/app/api/admin/workouts/route.ts` | Lines 14–18, 23–25, 64–66, 151–153 | `function verifyAdmin(request: NextRequest) { ... adminPin === "0408" \|\| authHeader === "bodiedbyesh" }` | GET, POST, and DELETE handlers allow workout assignment and deletion using hardcoded PINs. |
| `src/app/api/chat/route.ts` | Lines 14–19, 51–53, 124–128 | `verifyAdmin(request)` fallback to `"0408"` and `"bodiedbyesh"` | Allows unauthorized actors to impersonate Coach Esh (`sender: "coach"`) and read private chat logs. |
| `src/app/api/logo-feedback/route.ts` | Lines 114–120 | `const adminPin = process.env.ADMIN_PIN \|\| "0408";`<br/>`if (authHeader !== adminPin && authHeader !== "bodiedbyesh")` | Exposes client brand feedback via hardcoded PIN header. |
| `src/app/api/park-config/route.ts` | Lines 60–64 | `const adminPin = process.env.ADMIN_PIN \|\| "0408";`<br/>`if (body.pin !== adminPin && body.pin !== "bodiedbyesh")` | Allows unauthenticated mutation of park schedule and locations via JSON body PIN. |
| `src/app/logo-review/page.tsx` | Lines 37, 110, 113, 346 | `if (password.toLowerCase() === "bodiedbyesh")`<br/>`sessionStorage.setItem("logo_review_unlocked", "true")`<br/>`Hint: bodiedbyesh` | Hardcoded client unlock passphrase `"bodiedbyesh"` with plaintext hint in DOM. |
| `src/app/logo-review/admin/page.tsx` | Lines 122, 142, 172, 181, 188, 204 | `sessionStorage.getItem("logo_admin_pin")`<br/>`headers: { "x-admin-pin": enteredPin }` | Admin brand review portal storing PIN in client `sessionStorage`. |
| `.env.example` | Line 31 | `ADMIN_PIN="0408"` | Exposes `"0408"` in public environment template. |
| `smoke_test_suite.mjs` | Lines 93, 97–98, 102 | `headers: { 'x-admin-pin': '0408' }` | Legacy test suite reliant on hardcoded test PIN. |

---

## Section 2: Administrative Route Authorization & Supabase Auth Role Hardening

### 2.1 Current Architecture vs Target State

#### Current Flow (Insecure)
```
[Client / Browser]
       │
       ▼ (Sends HTTP Header: "x-admin-pin: 0408" or Query Param "?pin=0408")
[API Route: /api/admin/*]
       │
       ▼ (Validates string against process.env.ADMIN_PIN || "0408" || "bodiedbyesh")
[Supabase Service Role Client] ──► (Bypasses all RLS, returns raw database data)
```

#### Target Architecture (Cryptographically Hardened)
```
[Client / Browser]
       │
       ▼ (Sends Secure HttpOnly Session Cookies: sb-*-auth-token)
[Next.js Edge Middleware: src/middleware.ts]
       │  (Intercepts /admin/*, checks active session & admin role before serving bundle)
       ▼
[Server Route: /api/admin/*]
       │
       ▼ (Calls createClient() from @/lib/supabase/server)
[Supabase Auth Engine] ──► getUser()
       │
       ▼ (Validates user.app_metadata.role === 'admin')
  ├── If valid: Execute authorized query with audit logging
  └── If invalid / missing: Return 401 Unauthorized / 403 Forbidden
```

### 2.2 Role-Based Access Control Specification

In Supabase Auth:
- `user.user_metadata`: User-editable metadata (e.g. `full_name`, `avatar_url`). **NEVER** use for authorization.
- `user.app_metadata`: System-protected metadata (e.g. `role: 'admin'`, `provider: 'email'`). Only writable via Supabase Service Role API (`supabase.auth.admin.updateUserById(userId, { app_metadata: { role: 'admin' } })`).

### 2.3 Recommended Auth Helper Implementation: `src/lib/auth/admin.ts`

```typescript
import { createClient } from "@/lib/supabase/server";
import { User } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

export type AdminAuthResult = 
  | { user: User; error: null }
  | { user: null; error: Response };

/**
 * Validates that the incoming request has a valid Supabase Auth session
 * and that the authenticated user possesses the 'admin' role in app_metadata.
 */
export async function requireAdminSession(request?: NextRequest): Promise<AdminAuthResult> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        user: null,
        error: Response.json(
          { error: "Unauthorized: Authentication required" },
          { status: 401 }
        ),
      };
    }

    const role = user.app_metadata?.role;
    if (role !== "admin") {
      return {
        user: null,
        error: Response.json(
          { error: "Forbidden: Administrator privileges required" },
          { status: 403 }
        ),
      };
    }

    return { user, error: null };
  } catch (err: any) {
    return {
      user: null,
      error: Response.json(
        { error: "Internal authentication verification failure" },
        { status: 500 }
      ),
    };
  }
}
```

### 2.4 Administrative Page Protection (`/admin`, `/admin/*`)
- **`src/app/admin/layout.tsx`**:
  - Remove `AuthContext` with PIN string and remove `useAdminPin()`.
  - On mount, query `const { data: { user } } = await supabase.auth.getUser()`.
  - If `!user`: Render Admin Sign-In form (`email`, `password`) calling `supabase.auth.signInWithPassword`.
  - If `user` exists and `user.app_metadata?.role !== 'admin'`: Render "Access Denied: You do not have administrator permissions."
  - If `user` exists and `user.app_metadata?.role === 'admin'`: Render admin navigation and content.
- **`src/app/dashboard/page.tsx`**:
  - Remove `savedAdminPin`, `adminParam`, `viewAsParam` auto-seeding.
  - Set `isAdminMode = currentUser?.app_metadata?.role === 'admin'`.
  - If not admin, the user cannot switch clients or invoke `/api/admin/client-profile`.

---

## Section 3: Meal Logging API & Broken Object-Level Authorization (BOLA)

### 3.1 Vulnerability Overview
- **OWASP API1:2023**: Broken Object-Level Authorization (BOLA)
- **CWE-639**: Authorization Bypass Through User-Controlled Key
- **Risk Level**: **HIGH (CVSS 8.6)**

In `src/app/api/log-meal/route.ts`:
- The route instantiates `@supabase/supabase-js` `createClient(url, SUPABASE_SERVICE_ROLE_KEY)`.
- `GET /api/log-meal`: Reads `const email = searchParams.get("email") || "guest"`. Executes `supabase.from("meal_log").select("*").eq("client_email", email)` without verifying if the caller is that user or an admin. Any unauthenticated user can exfiltrate meals and photos for any client.
- `POST /api/log-meal`: Accepts `clientEmail` in the request body and writes to `meal_log` with service-role permissions. Any caller can write fake meals to any client account.

### 3.2 Current Code vs Secure Implementation

#### Current Vulnerable Code (`src/app/api/log-meal/route.ts`)
```typescript
// VULNERABLE: Service role bypass + unauthenticated parameter trust
function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email") || "guest"; // BOLA Vulnerability
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const supabase = getSupabase();
  const { data, error } = await supabase.from("meal_log").select("*").eq("client_email", email)...
}
```

#### Remediation Implementation Design
```typescript
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json(
        { error: "Unauthorized: Active user session required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const requestedEmail = searchParams.get("email");
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    const isAdmin = user.app_metadata?.role === "admin";
    // Normal users can ONLY query their own email. Admins can query requested client email.
    const targetEmail = (isAdmin && requestedEmail) ? requestedEmail.trim().toLowerCase() : user.email;

    const { data, error } = await supabase
      .from("meal_log")
      .select("*")
      .eq("client_email", targetEmail)
      .eq("meal_date", date)
      .order("created_at", { ascending: true });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const dailyTotals = (data || []).reduce(
      (acc, meal) => ({
        calories: acc.calories + (meal.total_calories || 0),
        protein: acc.protein + (meal.total_protein || 0),
        carbs: acc.carbs + (meal.total_carbs || 0),
        fat: acc.fat + (meal.total_fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return Response.json({
      meals: data || [],
      dailyTotals,
      date,
    });
  } catch (err) {
    return Response.json({ error: "Failed to fetch meals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json(
        { error: "Unauthorized: Active user session required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { mealType = "snack", items, imageUrl } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return Response.json({ error: "No meal items provided" }, { status: 400 });
    }

    const totals = items.reduce(
      (acc, item) => ({
        calories: acc.calories + (item.calories || 0),
        protein: acc.protein + (item.protein || 0),
        carbs: acc.carbs + (item.carbs || 0),
        fat: acc.fat + (item.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const { data, error } = await supabase
      .from("meal_log")
      .insert({
        user_id: user.id,
        client_email: user.email,
        meal_type: mealType,
        items: items,
        total_calories: Math.round(totals.calories),
        total_protein: Math.round(totals.protein * 10) / 10,
        total_carbs: Math.round(totals.carbs * 10) / 10,
        total_fat: Math.round(totals.fat * 10) / 10,
        image_url: imageUrl || null,
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, meal: data });
  } catch (err) {
    return Response.json({ error: "Failed to log meal" }, { status: 500 });
  }
}
```

---

## Section 4: Stripe Checkout Session Creation & Price ID Whitelisting

### 4.1 Vulnerability Overview
- **CWE-20**: Improper Input Validation
- **CWE-472**: External Control of Assumed-Immutable Web Parameter
- **Risk Level**: **HIGH (CVSS 8.2)**

In `src/app/api/create-checkout-session/route.ts`:
- Lines 14–25 read `const { priceId, programChoice, ... } = body;`.
- If `priceId` is present in the request body, the server assigns `let resolvedPriceId = priceId;` and passes it straight to `stripe.checkout.sessions.create({ line_items: [{ price: resolvedPriceId, quantity: 1 }] })`.
- An attacker can submit an arbitrary Stripe Price ID (such as a $1 test price or an unrelated lower-tier product) and obtain full subscription access.

### 4.2 Program Choice Enum & Whitelist Mapping

The platform supports 3 primary membership tiers backed by environment variables:
1. **Track A (Park-to-Peak / Local Park)**: `process.env.STRIPE_PRICE_TRACK_A` (Mode: `subscription`)
2. **Track B (Executive Concierge)**: `process.env.STRIPE_PRICE_TRACK_B` (Mode: `subscription`)
3. **Introductory Strategy Assessment**: `process.env.STRIPE_PRICE_INTRO` (Mode: `payment`)

#### Validated Whitelist Configuration Matrix

| Program Choice Enum | Stripe Environment Variable | Checkout Mode | Description |
|---|---|---|---|
| `track_a` | `STRIPE_PRICE_TRACK_A` | `subscription` | Park-to-Peak Coaching |
| `track_a_hybrid` | `STRIPE_PRICE_TRACK_A` | `subscription` | Park-to-Peak Hybrid Coaching |
| `track_a_park` | `STRIPE_PRICE_TRACK_A` | `subscription` | Park Group Training |
| `track_b` | `STRIPE_PRICE_TRACK_B` | `subscription` | Executive Concierge Coaching |
| `track_b_hybrid` | `STRIPE_PRICE_TRACK_B` | `subscription` | Executive Concierge Hybrid |
| `intro_assessment` | `STRIPE_PRICE_INTRO` | `payment` | 1-on-1 Strategy Assessment |

### 4.3 Recommended Hardened Implementation: `src/app/api/create-checkout-session/route.ts`

```typescript
import { NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe";

export const ALLOWED_PROGRAM_CONFIGS = {
  track_a: {
    envVar: "STRIPE_PRICE_TRACK_A",
    mode: "subscription" as const,
    displayName: "Park-to-Peak Coaching",
  },
  track_a_hybrid: {
    envVar: "STRIPE_PRICE_TRACK_A",
    mode: "subscription" as const,
    displayName: "Park-to-Peak Hybrid Coaching",
  },
  track_a_park: {
    envVar: "STRIPE_PRICE_TRACK_A",
    mode: "subscription" as const,
    displayName: "Park Group Coaching",
  },
  track_b: {
    envVar: "STRIPE_PRICE_TRACK_B",
    mode: "subscription" as const,
    displayName: "Executive Concierge Coaching",
  },
  track_b_hybrid: {
    envVar: "STRIPE_PRICE_TRACK_B",
    mode: "subscription" as const,
    displayName: "Executive Concierge Hybrid",
  },
  intro_assessment: {
    envVar: "STRIPE_PRICE_INTRO",
    mode: "payment" as const,
    displayName: "Introductory Strategy Assessment",
  },
} as const;

export type AllowedProgramKey = keyof typeof ALLOWED_PROGRAM_CONFIGS;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { programChoice, customerEmail, customerName, customerPhone } = body;

    // 1. Strict Validation of Program Choice
    if (!programChoice || !(programChoice in ALLOWED_PROGRAM_CONFIGS)) {
      return Response.json(
        { 
          error: "Invalid program choice. Must be one of: " + Object.keys(ALLOWED_PROGRAM_CONFIGS).join(", ") 
        },
        { status: 400 }
      );
    }

    const programKey = programChoice as AllowedProgramKey;
    const config = ALLOWED_PROGRAM_CONFIGS[programKey];

    // 2. Strict Server-Side Price ID Resolution (Client-supplied priceId is completely ignored)
    const priceId = process.env[config.envVar];

    // 3. Resolve Origin
    const origin =
      request.headers.get("origin") ||
      request.headers.get("referer")?.replace(/\/[^/]*$/, "") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://bodiedbyesh.com";

    // 4. Handle Mock Mode when Stripe is not configured
    const stripe = await getStripe();
    if (!stripe || !priceId) {
      console.warn(`[checkout] Stripe or ${config.envVar} not configured — returning mock URL`);
      return Response.json({
        url: `${origin}/success?session_id=mock_session_dev&program=${programKey}`,
      });
    }

    // 5. Create Stripe Checkout Session with deterministic mode and price
    const session = await stripe.checkout.sessions.create({
      mode: config.mode,
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: customerEmail || undefined,
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/apply?canceled=true`,
      metadata: {
        programChoice: programKey,
        programName: config.displayName,
        customerName: (customerName || "").trim(),
        customerPhone: (customerPhone || "").trim(),
      },
    });

    return Response.json({ url: session.url });
  } catch (err: any) {
    console.error("[create-checkout-session] Error:", err);
    return Response.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
```

---

## Section 5: Integration & Verification Strategy

### 5.1 Test Harness & Smoke Test Updates
The existing `smoke_test_suite.mjs` contains assertions that pass `headers: { 'x-admin-pin': '0408' }` to test admin endpoints. Once PIN authorization is deprecated:
1. `smoke_test_suite.mjs` Section 3 must be updated to verify that unauthenticated calls to `/api/admin/leads`, `/api/admin/client-profile`, and `/api/admin/workouts` correctly return `401 Unauthorized`.
2. Supabase test service-role session / admin credentials should be used for testing authorized access in integration test suites.
3. Tests should verify that arbitrary `priceId` fields sent to `/api/create-checkout-session` are rejected or ignored in favor of the server whitelist.
4. BOLA adversarial test: Verify that `GET /api/log-meal?email=other@example.com` returns 401 when unauthenticated and returns only the authenticated user's records when logged in as a normal user.

---

## Conclusion & Implementation Next Steps

This survey confirms that Requirement R1 can be implemented cleanly with zero architectural regressions:
1. Purge all static PINs, passcodes, and `sessionStorage` fallbacks across routes and components.
2. Introduce `@/lib/auth/admin.ts` to enforce `user.app_metadata.role === 'admin'`.
3. Update `/api/log-meal` to use `@/lib/supabase/server` scoped to `user.id` / `user.email`.
4. Whitelist Stripe Checkout programs in `ALLOWED_PROGRAM_CONFIGS` in `/api/create-checkout-session`.
