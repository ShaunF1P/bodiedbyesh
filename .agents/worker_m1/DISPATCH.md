## 2026-08-28T19:59:51Z

You are a Worker subagent implementing Milestone 1 (M1: Perimeter & Security Ingress Hardening) for the Bodied by Esh platform.

Your working directory is: `c:\projects\BodiedbyEsh\.agents\worker_m1`
The project root is: `c:\projects\BodiedbyEsh`
Authoritative user request: `c:\projects\BodiedbyEsh\.agents\ORIGINAL_REQUEST.md`
Project specification: `c:\projects\BodiedbyEsh\PROJECT.md`
Survey investigation report with exact line numbers and remediation patterns: `c:\projects\BodiedbyEsh\.agents\explorer_survey_1\report.md`

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Strict Rules
- NO AI EMOJIS: ONLY use Lucide icons or inline SVGs. NEVER use AI emojis anywhere in UI or code.
- Zero secret exposure: All secrets read dynamically from environment variables.
- Write exclusively to M1 scope files. Do not modify other modules.

## Milestone 1 Implementation Tasks
1. **Admin PIN Purge & Client Storage Auto-Seeding Elimination**:
   - Create `src/lib/auth/admin.ts` with `requireAdminSession(request?: NextRequest)` verifying `user.app_metadata.role === 'admin'`.
   - Update `src/app/dashboard/page.tsx`: Remove `savedAdminPin`, `adminParam`, `viewAsParam` auto-seeding `"0408"` to `sessionStorage`. Derive admin mode strictly from authenticated user `user.app_metadata?.role === 'admin'`.
   - Update `src/components/AdminClientSwitcher.tsx`: Remove fallback `"0408"`. Use active session auth.
   - Update `src/app/admin/layout.tsx`: Remove PIN input modal and client-side `sessionStorage` PIN check. Authenticate via Supabase Auth email/password and verify `user.app_metadata?.role === 'admin'`.
   - Update `src/app/api/admin/client-profile/route.ts`, `src/app/api/admin/leads/route.ts`, `src/app/api/admin/workouts/route.ts`, `src/app/api/chat/route.ts`, `src/app/api/logo-feedback/route.ts`: Replace PIN headers/fallbacks (`"0408"`, `"bodiedbyesh"`) with `requireAdminSession(request)` or `user.app_metadata?.role === 'admin'` checks.
   - Update `src/app/logo-review/page.tsx` and `src/app/logo-review/admin/page.tsx`: Remove hardcoded `"bodiedbyesh"` / PINs in storage.
   - Clean `.env.example` line 31 (`ADMIN_PIN="0408"`).

2. **Meal Logging BOLA Remediation**:
   - In `src/app/api/log-meal/route.ts`: Scoping queries strictly to authenticated cookie session (`createClient()` from `@/lib/supabase/server`). Verify user session; regular users query and insert only for their own `user.id` / `user.email`. Admins can view requested client email. Remove service role client bypass.

3. **Stripe Checkout Price ID Lockdown**:
   - In `src/app/api/create-checkout-session/route.ts`: Implement `ALLOWED_PROGRAM_CONFIGS` server-side whitelist mapping validated program choice enums (`track_a`, `track_a_hybrid`, `track_a_park`, `track_b`, `track_b_hybrid`, `intro_assessment`) to environment variables (`STRIPE_PRICE_TRACK_A`, `STRIPE_PRICE_TRACK_B`, `STRIPE_PRICE_INTRO`). Reject arbitrary client `priceId` fields.

4. **Verification**:
   - Run `npx.cmd tsc --noEmit` and `npm.cmd test`. Ensure all tests compile and pass.
