## 2026-08-28T20:15:00Z
You are a Worker subagent implementing Milestone 2 (M2: Domain Logic, SRE & Data Isolation) for the Bodied by Esh platform.

Your working directory is: `c:\projects\BodiedbyEsh\.agents\worker_m2`
The project root is: `c:\projects\BodiedbyEsh`
Authoritative user request: `c:\projects\BodiedbyEsh\.agents\ORIGINAL_REQUEST.md`
Project specification: `c:\projects\BodiedbyEsh\PROJECT.md`
Survey investigation report with exact line numbers and remediation patterns: `c:\projects\BodiedbyEsh\.agents\explorer_survey_2\report.md`

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Strict Rules
- NO AI EMOJIS: ONLY use Lucide icons or inline SVGs. NEVER use AI emojis anywhere in UI or code.
- Zero secret exposure: All secrets read dynamically from environment variables.
- Write exclusively to M2 scope files. Do not modify other modules.

## Milestone 2 Implementation Tasks
1. **Sliding-Window IP Rate Limiting**:
   - Create `src/lib/rate-limit.ts` implementing a sliding-window token bucket / in-memory rate limiter with standard IP resolution (`x-forwarded-for`, `x-real-ip`, `cf-connecting-ip`) and policies (`form`: 5 req/min, `ai`: 10 req/min, `checkout`: 10 req/min, `auth`: 30 req/min). Returns standard RFC rate limit headers and 429 status on limit exceeded.
   - Apply rate limiting to public form routes: `src/app/api/ghl-contact/route.ts`, `src/app/api/book-appointment/route.ts`, and public AI routes (`scan-meal`, `recommend-recipe`, `create-checkout-session`).

2. **Health Tracker & Step Logging Session Authentication (Anti-Spoofing)**:
   - In `src/app/api/sync/health/route.ts`, `src/app/api/coastal/steps/route.ts`, `src/app/api/coastal/devotionals/route.ts`, `src/app/api/coastal/community/route.ts`, `src/app/api/coastal/join/route.ts`:
     - Remove all insecure user fallback patterns (`auth?.user?.id || body.userId || "guest-user"`, `|| searchParams.get("userId")`).
     - Require active Supabase cookie session via `getAuthUser(request)` / `createClient()`.
     - Return HTTP 401 Unauthorized if unauthenticated.
     - Derive `userId` exclusively from authenticated `user.id`.
     - In DELETE `api/coastal/steps`, verify ownership before deleting log.

3. **Park Schedule Persistence**:
   - Create `scratch/park_config_setup.sql` with Supabase PostgreSQL DDL and RLS policies for `public.park_config`.
   - Update `src/app/api/park-config/route.ts` to query `public.park_config` using Supabase server client (`createClient()`), with resilient fallback to `data/park-config.json` / static default config if database is unreachable. Admin mutations must authenticate via `requireAdminSession(request)` and upsert to `public.park_config`.

4. **Customer PII Logging Redaction & Structured Logger**:
   - Create `src/lib/logger.ts` with PII masking functions (`maskEmail`, `maskPhone`, `maskName`) and structured logging methods (`info`, `warn`, `error`) that suppress sensitive payload dumping in production.
   - Replace unredacted `console.log` / `console.error` calls across `src/lib/mail.ts`, `src/lib/sms.ts`, `src/app/api/ghl-contact/route.ts`, `src/app/api/webhook/stripe/route.ts`, and other endpoints.

5. **Additional Hardening**:
   - In `src/app/api/create-checkout-session/route.ts`, ensure `Object.prototype.hasOwnProperty.call(ALLOWED_PROGRAM_CONFIGS, programChoice)` is used to guard against prototype property lookups.

6. **Verification & Test Runner**:
   - Create a dedicated test runner `scripts/run-m2-sre-tests.mjs` verifying rate limiting, auth anti-spoofing, park persistence, and PII masking.
   - Run `npx.cmd tsc --noEmit` and `npm.cmd test`.
