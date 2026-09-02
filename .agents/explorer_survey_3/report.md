# Architectural Survey Report: Quality Gates, Schema Validation, Port Adapters & Verification Infrastructure

**Target System**: Bodied by Esh Platform & Coastal Community Church (#3266) Walking Portal  
**Scope**: Requirement R3 (Quality Gates, Schema Validation & Architecture) & Test / Verification Infrastructure  
**Author**: Explorer Subagent (Survey 3)  
**Date**: 2026-08-28  

---

## 1. Executive Summary

This comprehensive architectural survey evaluates the Bodied by Esh platform against **Requirement R3** and the Production Readiness Review (PRR) quality gating standards. The investigation covered 21 API route handlers, Next.js Edge middleware routing, all external outbound HTTP/SDK integrations (GoHighLevel, Stripe, Google Gemini AI, Resend Email, Twilio SMS, OpenFoodFacts, Supabase), service layer abstraction patterns, and the complete verification/test runner infrastructure.

### Key Assessment Findings
1. **API Schema Validation**: Zero out of 21 API routes currently use runtime schema validation (`zod`). All routes parse `await request.json()` directly with ad-hoc manual property checks or untyped `any` casting, leaving endpoints vulnerable to malformed payloads, type injection, and unhandled 500 runtime exceptions.
2. **Admin Route Edge Middleware**: `src/middleware.ts` intercepts `/dashboard` and `/login`, but completely omits `/admin` and `/admin/*`. Prerendered admin page bundles are delivered to unauthenticated clients, relying solely on client-side `sessionStorage` PIN gates.
3. **Outbound Request Timeouts**: External network calls across GoHighLevel CRM (`src/lib/ghl.ts`), Resend Email (`src/lib/mail.ts`), Twilio SMS (`src/lib/sms.ts`), Google Gemini Vision AI (`src/app/api/scan-meal/route.ts`, etc.), and OpenFoodFacts (`src/components/BarcodeScanner.tsx`) lack bounded timeouts (`AbortSignal.timeout(8000)`), creating severe serverless function hang and exhaustion risks during 3rd-party latency spikes.
4. **Architectural Decoupling (Port Adapters)**: External services (Gemini AI, Resend, Twilio, GHL, Stripe) are directly coupled to API route handlers and utilities with duplicated prompt handling and ad-hoc fallback logic. Typed port interfaces (`IAIService`, `ICommunicationService`, `ICRMService`, `IPaymentService`) with dependency injection are needed.
5. **Test Infrastructure**: The codebase features a robust 4-tier Coastal test suite (99 tests, 100% pass rate via `scripts/run-coastal-tests.mjs`), a 30-assertion smoke audit (`scripts/run-smoke-test.mjs`), live endpoint testers, and 6 headless Playwright E2E suites (`tests/playwright_health_sync.mjs`). TypeScript type checking (`tsc --noEmit`) and Next.js production build (`next build`) pass with 0 errors. However, ESLint reports 289 linting issues (including React Hook purity violations in `StepTracker.tsx`), and automated test coverage for Zod validation rejection, edge admin auth interception, and timeout aborts is missing.

---

## 2. API Route Handlers & Zod Schema Validation Inventory

### 2.1 Route Handler Audit Matrix (21 Endpoints)

| # | Endpoint Route | HTTP Methods | Current Input Parsing | Validation Gaps | Proposed Zod Schema |
|---|---|---|---|---|---|
| 1 | `/api/admin/client-profile` | GET, POST, PATCH | Query params, `req.json()` untyped | Fallback PIN headers, untyped macro floats/ints, no bounds on calories/protein | `AdminClientProfileQuerySchema`, `AdminClientProfileCreateSchema`, `AdminClientProfileUpdateSchema` |
| 2 | `/api/admin/leads` | GET, PATCH | Headers, `req.json()` untyped | PIN header check, manual status string array lookup | `AdminLeadsPatchSchema` (`z.enum(["new", "contacted", "enrolled", "archived"])`) |
| 3 | `/api/admin/workouts` | GET, POST, DELETE | Query params, `req.json()` untyped | Exercises array untyped, target reps/sets/weight unvalidated | `AdminWorkoutGetQuerySchema`, `AdminWorkoutCreateSchema`, `AdminWorkoutDeleteQuerySchema` |
| 4 | `/api/book-appointment` | POST | `req.json()` untyped | Email regex not enforced, slot string unvalidated, no length bounds | `BookAppointmentSchema` |
| 5 | `/api/chat` | GET, POST | Query params, `req.json()` untyped | `message` length unbound (DDoS risk), clientId UUID unvalidated | `ChatGetQuerySchema`, `ChatSendMessageSchema` |
| 6 | `/api/checkout-session` | GET | `searchParams.get("id")` | Stripe session ID format unvalidated | `CheckoutSessionGetQuerySchema` |
| 7 | `/api/client/logged-sets` | POST | `req.json()` untyped | `repsCompleted`, `weightLiftedLbs` unvalidated integers, setIndex unbound | `ClientLoggedSetSchema` |
| 8 | `/api/coastal/community` | GET, POST | Query params, `req.json()` untyped | Polymorphic body (`post` vs `react`) unvalidated, message 1000 char cap manual | `CoastalCommunityQuerySchema`, `CoastalCommunityPostSchema`, `CoastalCommunityReactSchema` |
| 9 | `/api/coastal/devotionals` | GET, POST | Query params, `req.json()` untyped | `dayNumber` bounds (1-14) manual, `reflectionText` 4000 char cap manual | `CoastalDevotionalQuerySchema`, `CoastalDevotionalReflectionSchema` |
| 10 | `/api/coastal/join` | POST | `req.json()` untyped | `groupSlug` fallback manual, `displayName` XSS/length unvalidated | `CoastalJoinGroupSchema` |
| 11 | `/api/coastal/steps` | GET, POST, DELETE | Query params, `req.json()` untyped | `steps` integer bounds (0-200,000) manual, date format unvalidated | `CoastalStepsQuerySchema`, `CoastalStepsLogSchema`, `CoastalStepsDeleteQuerySchema` |
| 12 | `/api/create-checkout-session` | POST | `req.json()` untyped | `programChoice` enum unvalidated, client price ID injection risk | `CreateCheckoutSessionSchema` |
| 13 | `/api/ghl-contact` | POST | `req.json()` untyped | Phone/email formats unvalidated, PII logged to stdout, fallback 200 on error | `GHLContactLeadSchema` |
| 14 | `/api/log-meal` | POST, GET | Query params, `req.json()` untyped | `items` array unvalidated, mealType unvalidated, service role BOLA risk | `LogMealQuerySchema`, `LogMealCreateSchema` |
| 15 | `/api/logo-feedback` | POST, GET | Headers, `req.json()` untyped | `favorites`/`hearts` integer arrays unvalidated, notes unbound | `LogoFeedbackPostSchema` |
| 16 | `/api/park-config` | GET, POST | `req.json()` untyped | PIN in body, schedule array unvalidated, local disk persistence | `ParkConfigUpdateSchema` |
| 17 | `/api/recommend-recipe` | POST | `req.json()` untyped | `remainingMacros` numeric bounds unvalidated, dietaryPreference unvalidated | `RecommendRecipeSchema` |
| 18 | `/api/scan-meal` | POST | `req.json()` untyped | `imageBase64` size/mimeType unvalidated | `ScanMealSchema` |
| 19 | `/api/scan-menu` | POST | `req.json()` untyped | `imageBase64` size unvalidated, `remainingBudget` unvalidated | `ScanMenuSchema` |
| 20 | `/api/sync/health` | GET, POST | `req.json()` untyped | `provider` enum unvalidated at runtime, `steps` bounds (0-200k) manual | `SyncHealthPostSchema` |
| 21 | `/api/webhook/stripe` | POST | `req.text()`, signature header | Signature verified via SDK, payload unmapped | `StripeWebhookHeaderSchema` |

---

### 2.2 Standardized Validation Infrastructure Design

To enforce zero-defect schema validation across all route handlers, we establish a standardized validation utility:

```typescript
// src/lib/validation/api-validator.ts
import { z, ZodSchema, ZodError } from "zod";
import { NextResponse } from "next/server";

export interface ValidationSuccess<T> {
  success: true;
  data: T;
}

export interface ValidationFailure {
  success: false;
  response: NextResponse;
  error: ZodError;
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

/**
 * Validates JSON request body against a Zod schema with uniform 400 Bad Request responses.
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<ValidationResult<T>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: "Invalid JSON",
          message: "Request body contains malformed JSON.",
        },
        { status: 400 }
      ),
      error: new ZodError([]),
    };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: "Validation Error",
          issues: result.error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
            code: e.code,
          })),
        },
        { status: 400 }
      ),
      error: result.error,
    };
  }

  return { success: true, data: result.data };
}

/**
 * Validates URL query search parameters against a Zod schema.
 */
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>
): ValidationResult<T> {
  const paramsObject = Object.fromEntries(searchParams.entries());
  const result = schema.safeParse(paramsObject);

  if (!result.success) {
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: "Invalid Query Parameters",
          issues: result.error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
            code: e.code,
          })),
        },
        { status: 400 }
      ),
      error: result.error,
    };
  }

  return { success: true, data: result.data };
}
```

### 2.3 Example Core Domain Zod Schemas

```typescript
// src/lib/validation/schemas.ts
import { z } from "zod";

export const ProgramChoiceEnum = z.enum([
  "track_a",
  "track_a_hybrid",
  "track_b",
  "track_b_hybrid",
  "portal_access",
]);

export const HealthProviderEnum = z.enum([
  "apple_health",
  "google_health",
  "google_fit",
  "fitbit",
  "garmin",
  "strava",
  "whoop",
  "device_motion",
]);

export const MacroBudgetSchema = z.object({
  calories: z.number().min(0).max(10000).default(400),
  protein: z.number().min(0).max(500).default(35),
  carbs: z.number().min(0).max(1000).default(30),
  fat: z.number().min(0).max(500).default(10),
});

export const SyncHealthPostSchema = z.object({
  provider: HealthProviderEnum,
  steps: z.number().int().min(0, "Steps cannot be negative").max(200000, "Maximum daily steps is 200,000"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  distanceMiles: z.number().min(0).max(100).optional(),
  activeMinutes: z.number().int().min(0).max(1440).optional(),
  groupId: z.string().default("3266-coastal-church"),
  deviceModel: z.string().max(100).optional(),
  sourceApp: z.string().max(100).optional(),
  userId: z.string().optional(),
});

export const CoastalStepsLogSchema = z.object({
  steps: z.number().int().min(0, "Steps cannot be negative").max(200000, "Maximum daily steps is 200,000"),
  logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  distanceMiles: z.number().min(0).max(100).optional(),
  activeMinutes: z.number().int().min(0).max(1440).optional(),
  notes: z.string().max(500).optional(),
  groupId: z.string().default("3266-coastal-church"),
  userId: z.string().optional(),
});

export const GHLContactLeadSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  phone: z.string().trim().max(30).optional().nullable(),
  programChoice: ProgramChoiceEnum.optional().nullable(),
  trackGoal: z.string().trim().max(200).optional().nullable(),
  source: z.string().trim().max(50).default("website"),
});

export const BookAppointmentSchema = z.object({
  name: z.string().trim().min(1).max(100).default("Athlete"),
  email: z.string().trim().email().toLowerCase().default("client@bodiedbyesh.com"),
  programName: z.string().trim().max(100).default("Coaching Program"),
  slot: z.string().trim().min(1, "Appointment slot is required").max(100),
});
```

---

## 3. Next.js Edge Middleware Architecture for Admin Auth

### 3.1 Current Gap Analysis (`src/middleware.ts`)
- **Current Behavior**:
  - Case-insensitive redirect: Redirects uppercase URLs (`/Park` -> `/park`).
  - Session refresh: Configures Supabase SSR client cookie sync.
  - Route protection: ONLY checks `/dashboard` (redirecting to `/login`) and `/login` (redirecting to `/dashboard` if authenticated).
  - Admin exposure: Completely omits `/admin` and `/admin/*`. Any user can load `/admin`, `/admin/leads`, `/admin/park` and download full admin React components to browser memory before entering any PIN.
  - Deprecation warning: Next.js 16 emits `The "middleware" file convention is deprecated. Please use "proxy" instead.` (While `middleware.ts` remains functional, proxy migration compatibility should be maintained).

### 3.2 Target Edge Middleware Design

```typescript
// src/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ── 1. Case-Insensitive URL Canonicalization ──────────────────────────────
  if (
    /[A-Z]/.test(pathname) &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/api") &&
    !pathname.includes(".")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.toLowerCase();
    return NextResponse.redirect(url, 301);
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Verify active Supabase user session at edge
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── 2. Intercept /admin and /admin/* Routes ───────────────────────────────
  if (pathname.startsWith("/admin") || pathname.startsWith("/logo-review/admin")) {
    if (!user) {
      // Unauthenticated -> Redirect to login with return target
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(url);
    }

    // Role-based authorization: Verify app_metadata or user_metadata admin role
    const userRole =
      (user.app_metadata?.role as string | undefined) ||
      (user.user_metadata?.role as string | undefined);

    if (userRole !== "admin") {
      // Non-admin authenticated user -> Redirect to dashboard with access denied
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.searchParams.set("error", "unauthorized_admin_access");
      return NextResponse.redirect(url);
    }
  }

  // ── 3. Intercept /dashboard Routes ─────────────────────────────────────────
  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    if (!user.email_confirmed_at) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("verified", "false");
      return NextResponse.redirect(url);
    }
  }

  // ── 4. Redirect Authenticated Users Away from /login ───────────────────────
  if (pathname.startsWith("/login") && user && user.email_confirmed_at) {
    const redirectTo = request.nextUrl.searchParams.get("redirectTo");
    const userRole =
      (user.app_metadata?.role as string | undefined) ||
      (user.user_metadata?.role as string | undefined);

    const url = request.nextUrl.clone();
    if (redirectTo && redirectTo.startsWith("/admin") && userRole === "admin") {
      url.pathname = redirectTo;
    } else {
      url.pathname = "/dashboard";
    }
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
```

---

## 4. Outbound External HTTP & SDK Fetch Calls & Bounded Timeout Audit

### 4.1 External Call Inventory & Missing Timeout Audit

| Service / Integration | Source Location | Current Call Pattern | Bounded Timeout Status | Vulnerability / Impact |
|---|---|---|---|---|
| **GoHighLevel CRM** | `src/lib/ghl.ts:89` | `fetch(url, { ...options, headers })` | Missing (No AbortSignal) | 429 retry loops can hang serverless instance for 30s+ |
| **Resend Email API** | `src/lib/mail.ts:18` | `fetch("https://api.resend.com/emails", ...)` | Missing (No AbortSignal) | API route hangs on Resend network degradation |
| **Twilio SMS API** | `src/lib/sms.ts:19` | `fetch("https://api.twilio.com/...", ...)` | Missing (No AbortSignal) | Route blocks during Twilio carrier delays |
| **Stripe SDK** | `src/lib/stripe.ts:30` | `new Stripe(key, { apiVersion })` | Missing (`timeout` option omitted) | Stripe checkout creation can block client checkout |
| **Google Gemini Vision AI** | `src/app/api/scan-meal/route.ts:88` | `model.generateContent(...)` | Missing (No timeout race/signal) | Image vision analysis hangs serverless execution |
| **Google Gemini Menu AI** | `src/app/api/scan-menu/route.ts:95` | `model.generateContent(...)` | Missing (No timeout race/signal) | Menu scanning blocks on large image OCR |
| **Google Gemini Recipe AI** | `src/app/api/recommend-recipe/route.ts:74` | `model.generateContent(...)` | Missing (No timeout race/signal) | Recipe generation delays fallback execution |
| **OpenFoodFacts Barcode API**| `src/components/BarcodeScanner.tsx:99` | `fetch("https://world.openfoodfacts.org/...")` | Missing (No AbortSignal) | Client UI camera spinner hangs indefinitely on bad UPC |
| **Supabase SSR / JS SDK** | `src/lib/supabase/*.ts` | `@supabase/ssr` / `@supabase/supabase-js` | Uses default global fetch | Database connection delays can exceed edge limits |

### 4.2 Bounded Timeout Implementation Specifications

#### 1. Universal Safe Fetch Utility (`src/lib/http/safe-fetch.ts`)
```typescript
// src/lib/http/safe-fetch.ts
export const DEFAULT_TIMEOUT_MS = 8000;

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const signal = init?.signal
    ? AbortSignal.any([init.signal, AbortSignal.timeout(timeoutMs)])
    : AbortSignal.timeout(timeoutMs);

  return fetch(input, {
    ...init,
    signal,
  });
}
```

#### 2. Stripe Client with Native Timeout (`src/lib/stripe.ts`)
```typescript
// src/lib/stripe.ts
const { default: Stripe } = await import("stripe");
stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
  typescript: true,
  timeout: 8000, // 8-second bounded timeout
  maxNetworkRetries: 2,
});
```

#### 3. Gemini AI Call Timeout Wrapper (`src/lib/ai/gemini-client.ts`)
```typescript
export async function generateContentWithTimeout<T>(
  generatePromise: Promise<T>,
  timeoutMs: number = 8000
): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`AI generation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([generatePromise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId!);
  }
}
```

---

## 5. Hexagonal Port Adapters Architecture (DIP)

### 5.1 Architecture Overview
To achieve modularity, testability, and zero vendor lock-in, all external dependencies are decoupled behind typed abstract ports (interfaces) in `src/lib/ports/`, with concrete adapters in `src/lib/adapters/`.

```
src/lib/
├── ports/
│   ├── IAIService.ts            (Vision & nutrition AI contract)
│   ├── ICommunicationService.ts (Email & SMS notification contract)
│   ├── ICRMService.ts           (Lead & deal pipeline contract)
│   └── IPaymentService.ts       (Checkout & webhook contract)
├── adapters/
│   ├── ai/
│   │   ├── GeminiAIService.ts   (Production Gemini 3.5 Flash implementation)
│   │   └── MockAIService.ts     (Deterministic unit-test fixture)
│   ├── communication/
│   │   ├── ResendEmailService.ts
│   │   ├── TwilioSMSService.ts
│   │   └── MockCommunicationService.ts
│   ├── crm/
│   │   ├── GoHighLevelCRMService.ts
│   │   └── MockCRMService.ts
│   └── payment/
│       ├── StripePaymentService.ts
│       └── MockPaymentService.ts
└── container.ts                 (Dependency Injection & Service Locator)
```

### 5.2 Port Interfaces

```typescript
// src/lib/ports/IAIService.ts
export interface ScannedFoodItem {
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
}

export interface MealScanResult {
  success: boolean;
  mealDescription?: string;
  items?: ScannedFoodItem[];
  error?: string;
}

export interface MenuItemAnalysis {
  name: string;
  category: "best_choice" | "acceptable" | "avoid";
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  swap: string | null;
}

export interface MenuScanResult {
  success: boolean;
  restaurant?: string;
  items?: MenuItemAnalysis[];
  error?: string;
}

export interface RecipeResult {
  recipeName: string;
  prepTime: string;
  ingredients: string[];
  instructions: string[];
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  matchingAnalysis: string;
}

export interface IAIService {
  scanMeal(imageBase64: string, mimeType?: string): Promise<MealScanResult>;
  scanMenu(imageBase64: string, mimeType?: string, remainingBudget?: { calories: number; protein: number; carbs: number; fat: number }): Promise<MenuScanResult>;
  recommendRecipe(remainingMacros: { calories: number; protein: number; carbs: number; fat: number }, pantryIngredients?: string, dietaryPreference?: string): Promise<{ success: boolean; data: RecipeResult; isFallback?: boolean }>;
}
```

```typescript
// src/lib/ports/ICommunicationService.ts
export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export interface SendSMSInput {
  to: string;
  body: string;
}

export interface ICommunicationService {
  sendEmail(input: SendEmailInput): Promise<boolean>;
  sendSMS(input: SendSMSInput): Promise<boolean>;
}
```

---

## 6. Comprehensive Test & Verification Infrastructure Survey

### 6.1 Test Suites Inventory & Execution Matrix

| Test Suite / Script | Location | Type & Scope | Assertions / Tests | Execution Command | Current Status |
|---|---|---|:---:|---|:---:|
| **Coastal 4-Tier Test Runner** | `scripts/run-coastal-tests.mjs` | In-process unit, boundary, pairwise integration, 50-member workload | 99 tests (4 tiers) | `node scripts/run-coastal-tests.mjs` or `npm run test:coastal` | **100% Pass** (0.03s) |
| **Smoke & Zero-Emoji Scanner** | `scripts/run-smoke-test.mjs` | Static AST/regex scan of layout, RLS DDL, safe-areas, zero-emoji audit | 30 checks | `node scripts/run-smoke-test.mjs` or `npm run test:static` | **100% Pass** |
| **Composite Pipeline** | `package.json` | Runs smoke scanner + 4-tier suite sequentially | 129 checks | `npm.cmd test` | **100% Pass** |
| **Playwright Health E2E Suite** | `tests/playwright_health_sync.mjs` | Headless browser automation (6 suites: modal, OAuth, direct sync, DOM rolling counter, 400/500 errors, zero-emoji DOM) | 14 assertions | `node tests/playwright_health_sync.mjs` or `npm run test:e2e` | **Configured** (Requires running dev server) |
| **Aggressive Link QA Audit** | `scratch/aggressive-coastal-audit.mjs` | Dead link crawler (15 routes) + Mobile iPhone 14 Pro UI checks | 15 routes + 5 UI phases | `node scratch/aggressive-coastal-audit.mjs` | **Configured** (Requires running dev server) |
| **Live Endpoint Probe** | `scratch/test-live-endpoints.mjs` | HTTP status verifier against live domains | 6 endpoints | `node scratch/test-live-endpoints.mjs` | **Configured** |
| **TypeScript Type Check** | `tsconfig.json` | Strict compiler type verification | Entire codebase | `npx.cmd tsc --noEmit` | **0 Errors** (Pass) |
| **Next.js Production Build** | `next.config.ts` | Turbopack compilation, minification, static page generation | 40 routes | `npm.cmd run build` | **0 Errors** (Pass) |
| **ESLint Static Analysis** | `eslint.config.mjs` | ESLint 9 + typescript-eslint + react-hooks rules | Entire codebase | `npm.cmd run lint` | **145 Errors / 144 Warnings** |

### 6.2 ESLint Failure Diagnosis & Remediation Requirements
Running `npm.cmd run lint` currently identifies 145 errors across the codebase. Key categories:
1. **React Hook Purity Violations (`react-hooks/purity`)**:
   - `src/components/coastal/StepTracker.tsx:492, 496, 747`: Calling `Date.now()` inside `useMemo` and render methods.
   - *Fix*: Move `Date.now()` to component initialization state, effect handlers, or pass as a stable memo dependency.
2. **TypeScript `@typescript-eslint/no-explicit-any`**:
   - `src/lib/coastal/db.ts:280, 470, 515, 558, 665, 708, 797, 891`
   - *Fix*: Replace untyped `any` with strong Supabase row interfaces and generic parameters.
3. **Deprecated `@ts-ignore` Comments (`@typescript-eslint/ban-ts-comment`)**:
   - `src/lib/stripe.ts:28, 31`: Replace `@ts-ignore` with `@ts-expect-error`.
4. **Unused Variables (`@typescript-eslint/no-unused-vars`)**:
   - `src/middleware.ts:40`: `options` in cookie setter.
   - `src/lib/body-ai.ts:140`: `waistY`.

---

## 7. Concrete Implementation Roadmap for Requirement R3

1. **Step 1: Dependency Installation**
   - Install `zod`: `npm install zod`
   - Verify `package.json` reflects `"zod": "^3.24.x"`
2. **Step 2: Core Validation Engine & Schemas**
   - Create `src/lib/validation/api-validator.ts` with `validateRequestBody` and `validateQueryParams`.
   - Create `src/lib/validation/schemas.ts` defining strict schemas for all 21 endpoints.
3. **Step 3: Route Handlers Schema Migration**
   - Refactor all 21 `route.ts` files to replace `await request.json()` with `validateRequestBody(request, Schema)`.
   - Return structured HTTP 400 Bad Request JSON responses upon validation failure.
4. **Step 4: Edge Middleware Hardening**
   - Update `src/middleware.ts` to intercept `/admin` and `/admin/*`, extracting the Supabase user session and verifying `user.app_metadata.role === 'admin'`.
   - Redirect unauthenticated users to `/login?redirectTo=/admin` and unauthorized users to `/dashboard?error=unauthorized`.
5. **Step 5: Bounded Timeouts Integration**
   - Create `src/lib/http/safe-fetch.ts` with `fetchWithTimeout(..., 8000)`.
   - Attach `AbortSignal.timeout(8000)` to `src/lib/ghl.ts`, `src/lib/mail.ts`, `src/lib/sms.ts`, `src/components/BarcodeScanner.tsx`.
   - Add `{ timeout: 8000 }` to `new Stripe(...)` in `src/lib/stripe.ts`.
   - Wrap Gemini AI generate calls with 8-second bounds in `src/lib/ai/`.
6. **Step 6: Port Adapters Architecture**
   - Define interfaces `IAIService`, `ICommunicationService`, `ICRMService`, `IPaymentService` in `src/lib/ports/`.
   - Implement adapters in `src/lib/adapters/` and dependency factory in `src/lib/container.ts`.
7. **Step 7: ESLint & Verification Harness Cleanup**
   - Resolve React Hook purity violations in `StepTracker.tsx`.
   - Clean up explicit `any` and `@ts-ignore` comments.
   - Extend `scripts/run-coastal-tests.mjs` and `scripts/run-smoke-test.mjs` to assert Zod schema rejections and edge middleware protection.

---
*Report completed and verified against all project specifications.*
