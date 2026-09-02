## 2026-08-28T20:48:06Z
You are a Worker subagent assigned to remediate Milestone 4 (Master PRR Test Runner & Full Verification) for the Bodied by Esh platform.

Your working directory is: `c:\projects\BodiedbyEsh\.agents\worker_m4_fix`
The project root is: `c:\projects\BodiedbyEsh`
Authoritative user request: `c:\projects\BodiedbyEsh\.agents\ORIGINAL_REQUEST.md`
Project specification: `c:\projects\BodiedbyEsh\PROJECT.md`
Test Infrastructure: `c:\projects\BodiedbyEsh\TEST_INFRA.md`

## FULL AUDIT EVIDENCE REPORT (Mandatory Remediation Focus)
Read the full forensic audit report and review findings before starting:
- Forensic Auditor Report: `c:\projects\BodiedbyEsh\.agents\auditor_m4_1\handoff.md`
- Reviewer 1 Report: `c:\projects\BodiedbyEsh\.agents\reviewer_m4_1\handoff.md`
- Challenger 1 Report: `c:\projects\BodiedbyEsh\.agents\challenger_m4_1\handoff.md`

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Strict Rules
- NO AI EMOJIS: ONLY use Lucide icons or inline SVGs. NEVER use AI emojis anywhere in UI or code.
- Zero secret exposure: All secrets read dynamically from environment variables.

## Required Remediation Tasks in `scripts/run-prr-audit-suite.mjs`
1. **Fix Constant Identifier**:
   - In `scripts/run-prr-audit-suite.mjs`, change `PROGRAM_PRICE_MAP` to `ALLOWED_PROGRAM_CONFIGS` to match the actual export in `src/app/api/create-checkout-session/route.ts`.
2. **Fix File Path Reference**:
   - In `scripts/run-prr-audit-suite.mjs` (Line 152), replace reference to non-existent `src/lib/supabase/park-schedule.ts` with `src/app/api/park-config/route.ts` and verify park config queries `public.park_config`.
3. **Fix Logger Imports**:
   - In `scripts/run-prr-audit-suite.mjs` (Lines 159-167, 411), import and test `{ maskEmail, maskPhone, maskName, sanitizeMeta }` from `../src/lib/logger.ts` instead of `redactPII`/`redactObject`.
4. **Fix Rate Limit Call Signature**:
   - In `scripts/run-prr-audit-suite.mjs` (Line 137, 258), pass `{ headers: new Headers({ "x-forwarded-for": "198.51.100.1" }) }` and `"form"` policy, matching the actual signature `checkRateLimit(request, policy)`.
5. **Fix Milestones Import**:
   - In `scripts/run-prr-audit-suite.mjs` (Line 477, 525), import `evaluateCommunalMilestones` from `../src/lib/coastal/milestones-data.ts`.

## Execution & Verification Commands
Once repaired, you MUST run:
1. `node scripts/run-prr-audit-suite.mjs` (Verify exit code 0, 100/100 PRR score)
2. `node scripts/run-m1-security-tests.mjs`
3. `node scripts/run-m2-sre-tests.mjs`
4. `node scripts/run-m3-architecture-tests.mjs`
5. `node scripts/run-smoke-test.mjs`
6. `node scripts/run-coastal-tests.mjs`
7. `npx.cmd tsc --noEmit` (0 errors)
8. `npm.cmd test` (100% pass)
9. `npm.cmd run build` (0 build errors)

## Deliverables
- Update `c:\projects\BodiedbyEsh\TEST_READY.md` with verified execution command outputs.
- Write `c:\projects\BodiedbyEsh\.agents\worker_m4_fix\handoff.md`.
- Update `c:\projects\BodiedbyEsh\.agents\worker_m4_fix\progress.md`.
- Send a completion message to the orchestrator.
