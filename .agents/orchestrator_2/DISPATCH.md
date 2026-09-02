# DISPATCH — 2026-08-28T15:54:43-04:00

## 2026-08-28T15:54:43-04:00
You are the Project Orchestrator for the Bodied by Esh platform.

Your working directory is: `c:\projects\BodiedbyEsh\.agents\orchestrator_2`
The project root is: `c:\projects\BodiedbyEsh`
The authoritative user request is recorded in: `c:\projects\BodiedbyEsh\.agents\ORIGINAL_REQUEST.md`

## Mission & Scope
Execute a comprehensive enterprise remediation of all critical, high, and medium vulnerabilities identified in the Production Readiness Review (PRR) audit across the Bodied by Esh platform to achieve a 100% compliant, secure, fault-tolerant production posture with automated verification.

## Requirements Breakdown

### R1. Perimeter & Security Ingress Hardening (Phase 1 P0 Blockers)
- Purge all hardcoded administrative fallback PINs (`"0408"`, `"bodiedbyesh"`) and eliminate client-side `sessionStorage` auto-seeding across all routes and components.
- Transition administrative route authorization to Supabase Auth metadata role checks (`user.app_metadata.role === 'admin'`).
- Resolve Broken Object-Level Authorization (BOLA) in the meal logging API by scoping queries strictly to the authenticated cookie-based user session and removing service-role bypasses.
- Lock down Stripe Checkout session creation to strictly map and whitelist allowed Price IDs on the server based on validated program choice enums, rejecting arbitrary client-supplied price IDs.

### R2. Domain Logic, SRE & Data Isolation (Phase 2 P1 Issues)
- Implement sliding-window IP rate limiting on public form routes (`/api/ghl-contact`, `/api/book-appointment`) to prevent SMS bombing and email quota exhaustion.
- Enforce strict user session authentication on health tracker and step logging endpoints (`/api/sync/health`, `/api/coastal/steps`), eliminating unauthenticated user ID spoofing.
- Migrate park schedule configuration from ephemeral local disk (`data/park-config.json`) to a persistent Supabase PostgreSQL table (`public.park_config`).
- Redact customer PII (emails, phone numbers, and notification payloads) from standard output logs in production.

### R3. Quality Gates, Schema Validation & Architecture (Phase 3 P2 Hardening)
- Integrate runtime schema validation using `zod` across all API route handlers, replacing untyped `request.json()` parsing with strict shape and type bounds.
- Intercept administrative paths (`/admin`, `/admin/*`) in Next.js edge middleware (`src/middleware.ts`) to require active admin sessions prior to serving page bundles.
- Attach bounded request timeouts (`AbortSignal.timeout(8000)`) to all outbound external HTTP and SDK fetch calls.
- Abstract Gemini AI and external communication services behind typed interface port adapters.

## Verification & Acceptance
- Automated test runner: `npm.cmd test` / `node scripts/run-coastal-tests.mjs`
- Endpoint tests: `node scratch/test-live-endpoints.mjs`
- Playwright QA suite: `node scratch/aggressive-coastal-audit.mjs`
- Production build: `npm.cmd run build` (0 TypeScript / 0 lint errors)
- Post-remediation PRR Audit score >= 90/100 (GO FOR PRODUCTION)

## Key Constraints
- Strict No-Emoji Rule: ONLY use Lucide icons or inline SVGs. NEVER use AI emojis anywhere in UI or code.
- Zero secret exposure: All secrets read dynamically from environment variables.
- Write your metadata (plan.md, progress.md, handoff.md) in your directory `c:\projects\BodiedbyEsh\.agents\orchestrator_2`.
- When complete, write handoff.md and send a message to the sentinel with your results and completion summary.
