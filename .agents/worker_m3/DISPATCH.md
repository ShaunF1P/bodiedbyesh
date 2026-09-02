## 2026-08-28T20:25:00Z
You are a Worker subagent implementing Milestone 3 (M3: Quality Gates, Schema Validation & Architecture) for the Bodied by Esh platform.

Your working directory is: `c:\projects\BodiedbyEsh\.agents\worker_m3`
The project root is: `c:\projects\BodiedbyEsh`
Authoritative user request: `c:\projects\BodiedbyEsh\.agents\ORIGINAL_REQUEST.md`
Project specification: `c:\projects\BodiedbyEsh\PROJECT.md`
Survey investigation report with exact line numbers and remediation patterns: `c:\projects\BodiedbyEsh\.agents\explorer_survey_3\report.md`

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Strict Rules
- NO AI EMOJIS: ONLY use Lucide icons or inline SVGs. NEVER use AI emojis anywhere in UI or code.
- Zero secret exposure: All secrets read dynamically from environment variables.
- Write exclusively to M3 scope files.

## Milestone 3 Implementation Tasks
1. **Zod Runtime Schema Validation**:
   - Ensure `zod` is installed in `package.json`.
   - Create `src/lib/validation/api-validator.ts` with `validateRequestBody<T>` and `validateQueryParams<T>`.
   - Create `src/lib/validation/schemas.ts` defining strict shape and type bounds for all 21 API routes.
   - Refactor all 21 API route handlers (`src/app/api/**/route.ts`) to replace untyped `request.json()` with `validateRequestBody` / `validateQueryParams`, returning structured HTTP 400 Bad Request JSON responses upon validation failure.

2. **Next.js Edge Middleware Admin Interception**:
   - Update `src/middleware.ts` to intercept `/admin` and `/admin/*` and `/logo-review/admin`.
   - Check active Supabase session at edge: redirect unauthenticated users to `/login?redirectTo=/admin` and unauthorized non-admin users to `/dashboard?error=unauthorized_admin_access` before serving page bundles. Maintain case-insensitivity and cookie sync.

3. **Bounded Request Timeouts**:
   - Create `src/lib/http/safe-fetch.ts` with `fetchWithTimeout(..., 8000)` using `AbortSignal.timeout(8000)`.
   - Attach bounded timeouts to external calls in `src/lib/ghl.ts`, `src/lib/mail.ts`, `src/lib/sms.ts`, `src/components/BarcodeScanner.tsx`.
   - Add `{ timeout: 8000 }` to `Stripe` client instantiation in `src/lib/stripe.ts`.
   - Wrap Gemini AI calls with 8-second bounded execution in `src/lib/ai/` and API routes.

4. **Hexagonal Port Adapters Architecture**:
   - Define port interfaces in `src/lib/ports/`: `IAIService.ts`, `ICommunicationService.ts`, `ICRMService.ts`, `IPaymentService.ts`.
   - Implement production adapters in `src/lib/adapters/` (e.g. `GeminiAIService.ts`, `ResendEmailService.ts`, `TwilioSMSService.ts`, `GoHighLevelCRMService.ts`, `StripePaymentService.ts`).
   - Create dependency injection container / service locator in `src/lib/container.ts`.

5. **React Hook Purity & Clean Build**:
   - Fix React Hook purity violations in `src/components/coastal/StepTracker.tsx` (move `Date.now()` out of `useMemo` render path).
   - Ensure `npx.cmd tsc --noEmit` and `npm.cmd run build` pass with 0 errors.

6. **Verification & Test Runner**:
   - Create `scripts/run-m3-architecture-tests.mjs` asserting Zod schema rejection, edge middleware protection, timeout aborts, and port adapters.
   - Integrate `test:m3` into `package.json` and root `npm test`.

## Deliverables
- Write `c:\projects\BodiedbyEsh\.agents\worker_m3\handoff.md`.
- Update `c:\projects\BodiedbyEsh\.agents\worker_m3\progress.md`.
- Send a completion message to the orchestrator.
