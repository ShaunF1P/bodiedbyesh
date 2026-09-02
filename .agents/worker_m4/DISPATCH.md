## 2026-08-28T20:39:11Z

You are a Worker subagent implementing Milestone 4 (M4: Final E2E Test Suite, Master PRR Verification & Acceptance) for the Bodied by Esh platform.

Your working directory is: `c:\projects\BodiedbyEsh\.agents\worker_m4`
The project root is: `c:\projects\BodiedbyEsh`
Authoritative user request: `c:\projects\BodiedbyEsh\.agents\ORIGINAL_REQUEST.md`
Project specification: `c:\projects\BodiedbyEsh\PROJECT.md`
Test Infrastructure specification: `c:\projects\BodiedbyEsh\TEST_INFRA.md`

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Strict Rules
- NO AI EMOJIS: ONLY use Lucide icons or inline SVGs. NEVER use AI emojis anywhere in UI or code.
- Zero secret exposure: All secrets read dynamically from environment variables.

## Milestone 4 Implementation Tasks
1. **Advisory Polish**:
   - In `src/middleware.ts`, ensure admin authorization checks strictly `user.app_metadata?.role === 'admin'`.
   - In `src/lib/adapters/payment/StripePaymentService.ts`, ensure `cancel_url` parameter alignment.
2. **Master PRR Audit & E2E Test Runner**:
   - Create `scripts/run-prr-audit-suite.mjs` that orchestrates:
     - Tier 1: Feature Coverage across all endpoints (M1, M2, M3).
     - Tier 2: Boundary & Corner Cases (Fuzzing, Rate Limit windows, 8000ms timeouts).
     - Tier 3: Cross-Feature Integration (Session auth + rate limit + Zod validation).
     - Tier 4: Real-World Workloads (Coastal 50-member step sync, workout log, meal tracking).
     - Static Checks: Zero-Emoji AST scanner, safe-area inspection, TypeScript check (`tsc --noEmit`), Next.js production build (`next build`).
     - Calculates formal PRR Production Readiness Score out of 100 (must be >= 90/100, target 100/100).
3. **Publish `TEST_READY.md`**:
   - Write `c:\projects\BodiedbyEsh\TEST_READY.md` summarizing the test runner command, coverage metrics by tier, and feature checklist.
4. **Execution & Verification**:
   - Run `node scripts/run-prr-audit-suite.mjs`
   - Run `npx.cmd tsc --noEmit`
   - Run `npm.cmd test`
   - Run `npm.cmd run build`

## Deliverables
- Write `c:\projects\BodiedbyEsh\.agents\worker_m4\handoff.md` with:
  - Exact command outputs
  - PRR Score and breakdown
  - Confirmation of 0 build/type errors
  - Verification of no-emoji compliance
- Update `c:\projects\BodiedbyEsh\.agents\worker_m4\progress.md`.
- Send completion message to orchestrator.
