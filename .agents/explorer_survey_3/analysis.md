# Full-Stack Enhancement Survey: Security, Testing, Database, and Deployment Analysis

## 1. Executive Summary
This analysis details the security posture, environment variable configuration, Supabase database architecture, Row-Level Security (RLS) policies, automated test suites, build configuration, and production deployment pipeline for the Bodied by Esh platform, specifically focusing on Requirement R1 (Automated Verification & Production Deployment) and Requirement R4 (Security & Environment Constraints).

---

## 2. Security, Secrets Handling, and Environment Variables

### 2.1 Environment Variable Architecture
The codebase dynamically accesses configuration and API keys via Node.js `process.env`. Environment variables are segregated across browser-exposed public variables (`NEXT_PUBLIC_*`) and private backend server-only credentials.

| Environment Variable | Scope | Primary Usage | Fallback / Default Behavior |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public (Client & Server) | Supabase project endpoint | Throws descriptive error if missing in client/server initializers |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (Client & Server) | Supabase public anonymous client key | Throws error in `src/lib/supabase/client.ts` if missing |
| `SUPABASE_SERVICE_ROLE_KEY` | Private (Server only) | Supabase elevated admin operations (CRM, leads, workouts) | Used in `src/app/api/admin/*` and webhooks |
| `ADMIN_PIN` | Private (Server only) | Coach/Admin API security barrier (`x-admin-pin` header) | Defaults to `"0408"` (also accepts `"bodiedbyesh"`) |
| `GEMINI_API_KEY` | Private (Server only) | Google Generative AI (recipe advisor, meal/menu scanner) | Triggers structured fallback recipe if unset or placeholder |
| `STRIPE_SECRET_KEY` | Private (Server only) | Stripe billing & checkout session creation | Safely returns null if not configured |
| `STRIPE_WEBHOOK_SECRET` | Private (Server only) | Stripe webhook event signature verification | Returns HTTP 500 if missing when webhook triggered |
| `STRIPE_PRICE_TRACK_A` | Private (Server only) | Price ID for Park-to-Peak coaching track | Read dynamically during checkout session generation |
| `STRIPE_PRICE_TRACK_B` | Private (Server only) | Price ID for Executive Concierge track | Read dynamically during checkout session generation |
| `STRIPE_PRICE_INTRO` | Private (Server only) | Price ID for Intro strategy session | Read dynamically during checkout session generation |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Public (Client) | Stripe frontend elements / checkout redirect | Read in client checkout integration |
| `GHL_API_KEY` | Private (Server only) | GoHighLevel CRM integration | Read in `src/lib/ghl.ts` and lead creation |
| `GHL_LOCATION_ID` | Private (Server only) | GoHighLevel sub-account location identifier | Read in `src/lib/ghl.ts` |
| `GHL_PIPELINE_ID` | Private (Server only) | GoHighLevel pipeline identifier | Read in `src/lib/ghl.ts` |
| `GHL_STAGE_*` | Private (Server only) | Pipeline stage IDs (`NEW_LEAD`, `ACTIVE`, `APPLICATION`, etc.) | Read in webhook and lead routing |
| `COACH_NOTIFICATION_EMAIL` | Private (Server only) | Target email for lead and payment notifications | Defaults to `"BodiedByEsh@gmail.com"` |
| `COACH_NOTIFICATION_PHONE` | Private (Server only) | Target SMS recipient for appointment/lead alerts | Defaults to `"+17728774231"` |
| `RESEND_API_KEY` | Private (Server only) | Resend transactional email service | Read in `src/lib/mail.ts` |
| `TWILIO_ACCOUNT_SID` | Private (Server only) | Twilio SMS API authentication SID | Read in `src/lib/sms.ts` |
| `TWILIO_AUTH_TOKEN` | Private (Server only) | Twilio SMS API authentication token | Read in `src/lib/sms.ts` |
| `TWILIO_PHONE_NUMBER` | Private (Server only) | Outbound Twilio SMS origin number | Read in `src/lib/sms.ts` |
| `USDA_API_KEY` | Private (Server only) | USDA FoodData Central API for barcode/food nutrition lookup | Defaults to `"DEMO_KEY"` |
| `VERCEL_TOKEN` | Private (CI/Deploy only) | Token for non-interactive `npx vercel --prod --yes` | Read in `scripts/deploy-vercel.mjs` |
| `TEST_BASE_URL` | Test Runner | Target base URL for smoke tests | Defaults to `http://localhost:3000` |

### 2.2 Secrets Isolation & `.gitignore`
- `.gitignore` (lines 34, 44) contains `.env*`, strictly preventing `.env`, `.env.local`, and `.env.production` from being committed to Git.
- Next.js HTTP headers in `next.config.ts` configure `poweredByHeader: false` to eliminate server fingerprinting, alongside a Content Security Policy (CSP), `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Strict-Transport-Security`.

---

## 3. Database Architecture & Row-Level Security (RLS)

The database layer utilizes Supabase PostgreSQL with three major SQL schema layers defined in `scratch/`:

### 3.1 Schema Layers & Table Map
1. **Core Client Profiles & Auth Sync (`scratch/database_setup.sql`)**:
   - `public.client_profiles`: Stores client metrics, targets (`target_calories`, `target_protein`, `target_carbs`, `target_fat`, `weight_lbs`, `target_weight_lbs`).
   - Trigger `on_auth_user_created` on `auth.users`: Automatically runs `public.handle_new_user_signup()` (SECURITY DEFINER) with case-insensitive `LOWER(email)` resolution to link pre-created profiles.
2. **Phase 2 Workout & Coaching Hub (`scratch/phase2_setup.sql`)**:
   - `public.workouts`: Client assigned daily workouts linked to `client_profiles(id)`.
   - `public.workout_exercises`: Exercises within workouts with target sets/reps/weight.
   - `public.logged_sets`: Individual set completion logs with actual reps and weights.
   - `public.chat_messages`: Two-way messaging between coach and client.
3. **Coastal Community Church (#3266) Walking Portal (`scratch/coastal_3266_setup.sql`)**:
   - `public.groups`: Communal church groups (`slug = 'coastal'`, `group_number = '3266'`).
   - `public.group_members`: Member registry with `is_anonymous_leaderboard` toggle and daily goals.
   - `public.step_logs`: Step entries with miles, active minutes, and calorie calculations.
   - `public.community_encouragements` & `public.encouragement_reactions`: Social feed and Lucide SVG reaction counts.
   - `public.faith_devotionals` & `public.devotional_reflections`: 14-day discipleship curriculum and private reflection notes.
   - `public.group_milestones` & `public.user_milestone_unlocks`: 6 communal milestones and 11 individual badges.

### 3.2 RLS Isolation Policies
Every table in the database explicitly enables RLS (`ALTER TABLE <table> ENABLE ROW LEVEL SECURITY`).
- **Owner Isolation**:
  - `client_profiles`: `auth.uid() = user_id OR LOWER(email) = LOWER(auth.jwt() ->> 'email')`
  - `workouts`: `auth.uid() = client_id`
  - `workout_exercises`: `EXISTS (SELECT 1 FROM workouts WHERE workouts.id = workout_exercises.workout_id AND workouts.client_id = auth.uid())`
  - `logged_sets`: Nested exists check matching client_id to `auth.uid()`
  - `chat_messages`: `auth.uid() = client_id`
  - `step_logs`: `auth.uid() = user_id OR EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = step_logs.group_id AND gm.user_id = auth.uid())`
  - `devotional_reflections`: `auth.uid() = user_id OR is_shared_to_feed = true`
- **Security Definer RPCs**:
  - `get_group_stats`: Aggregates group steps, miles, active walkers, and milestones without exposing individual PII.
  - `get_group_leaderboard`: Computes ranks and masks member names as `'Faithful Walker'` and hides avatar URLs when `is_anonymous_leaderboard = true` for non-owners.
  - `get_user_walking_streak`: Calculates consecutive active walking streaks using gap-and-island SQL window functions.
  - `auto_join_group`: Idempotently creates membership records upon initial sign-in.
  - `trg_check_group_milestones`: Trigger executing after step logs to auto-unlock communal milestones.

---

## 4. Automated Verification & Test Harness

### 4.1 Verification Harnesses
The project features two specialized test runners:
1. **Live Route & Endpoint Smoke Test (`smoke_test_suite.mjs`)**:
   - Executes HTTP fetch requests against `TEST_BASE_URL` (default `http://localhost:3000`).
   - Audits 11 web routes: `/`, `/apply`, `/dashboard`, `/coastal`, `/coastal-walk`, `/calculator`, `/brand-guide`, `/login`, `/admin`, `/admin/leads`, `/admin/park`.
   - Tests Coastal APIs: `/api/coastal/community`, `/api/coastal/devotionals`, `/api/coastal/steps`.
   - Tests Admin Security PIN barriers: `/api/admin/leads` (401 without PIN, 200 with `x-admin-pin: 0408`), `/api/admin/client-profile`, `/api/admin/workouts`.
   - Tests Health Auto-Sync APIs: `/api/sync/health` (GET, Apple Health POST, Google Health Connect POST).
   - Tests Workout & AI Services: `/api/park-config`, `/api/client/logged-sets` (expected 401 unauthorized barrier), `/api/recommend-recipe`.
2. **4-Tier Comprehensive E2E Matrix (`scripts/run-coastal-tests.mjs`)**:
   - Total of 99 unit/integration test assertions across 4 tiers:
     - Tier 1: Feature Coverage (70 tests covering F01 through F31).
     - Tier 2: Boundary & Corner Cases (22 tests covering step limits, Leap Day, year transitions, 4000-char reflections).
     - Tier 3: Cross-Feature Combinations (5 tests covering milestone unlocks, auth sync, anonymity).
     - Tier 4: Real-World Workload Scenarios (50-member Sunday walk simulation, 14-day discipleship journey).
3. **Static Compliance & Regex Audit (`scripts/run-smoke-test.mjs`)**:
   - Scans codebase for structure, math formulas, RLS statements, CSS safe-area tokens, and performs a strict Unicode/AI emoji audit over `src/` and `scratch/`.

### 4.2 Build & TypeScript/Lint Configuration
- **Package Scripts (`package.json`)**:
  - `"dev": "next dev"`
  - `"build": "next build"`
  - `"start": "next start"`
  - `"lint": "eslint"`
- **TypeScript (`tsconfig.json`)**:
  - `"target": "ES2017"`, `"moduleResolution": "bundler"`, `"strict": true`, `"noEmit": true`.
  - Path alias: `"@/*": ["./src/*"]`.
- **ESLint (`eslint.config.mjs`)**:
  - ESLint 9 flat configuration with `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`.

---

## 5. Production Deployment Setup

### 5.1 Vercel Project Linking & Credentials
- **Vercel Project Configuration (`.vercel/project.json`)**:
  - `projectId`: `"prj_XujXePhl7LRh7NxeKt1Fy8UR6Kmj"`
  - `orgId`: `"team_3GiHpZafOGzMcNrLU5xpci4I"`
  - `projectName`: `"bodiedbyesh"`
- **Automated Deployment Script (`scripts/deploy-vercel.mjs`)**:
  - Reads `VERCEL_TOKEN` from `process.env` or `.env.local`.
  - Invokes `npx vercel --prod --yes --token <VERCEL_TOKEN>`.
  - Enables zero-downtime deployment directly from the CLI.

---

## 6. Gap Analysis & Recommendations for R1 & R4

### 6.1 Requirement R1 Gaps & Observations
1. **Missing `test` Script in `package.json`**:
   - `package.json` contains `dev`, `build`, `start`, and `lint`, but lacks a `"test"` or `"test:smoke"` script.
   - *Recommendation*: Add `"test:smoke": "node smoke_test_suite.mjs"` and `"test:coastal": "node scripts/run-coastal-tests.mjs"` to `package.json` scripts.
2. **Smoke Test Execution Pre-condition**:
   - `smoke_test_suite.mjs` executes HTTP network requests against a running server (`http://localhost:3000`). If run without a running server, all 23 endpoint checks fail with connection errors.
   - *Recommendation*: Ensure local development or preview server (`npm run build && npm run start` or `next dev`) is active prior to executing `smoke_test_suite.mjs`.

### 6.2 Requirement R4 Gaps & Observations
1. **Missing `.env.example` Template**:
   - The repository contains `.env.local` and `.env.production` (both properly ignored by Git), but lacks a clean `.env.example` reference template to document all 24 required/optional environment variables for new team members and CI pipelines.
   - *Recommendation*: Provide a clean `.env.example` template with sanitized placeholder values.
2. **Admin PIN Fallback Hardcoding**:
   - Multiple routes (`src/app/api/admin/leads/route.ts`, `src/app/api/admin/client-profile/route.ts`, `src/app/api/admin/workouts/route.ts`) have fallback checks for `"0408"` and `"bodiedbyesh"`.
   - *Recommendation*: Ensure `ADMIN_PIN` is set in Vercel Production Environment Variables, and ensure client-side `sessionStorage` passcode entry strictly uses the configured environment PIN.
3. **Database Migration State**:
   - Schema definitions in `scratch/database_setup.sql`, `scratch/phase2_setup.sql`, and `scratch/coastal_3266_setup.sql` must be confirmed applied in the Supabase PostgreSQL environment to guarantee table existence and RLS enforcement in production.
