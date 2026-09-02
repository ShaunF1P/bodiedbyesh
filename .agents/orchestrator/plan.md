# Orchestration Plan: Health Tracker Sync, Testing, Calibration & Audit Verification

## Goal
Coordinate full end-to-end testing, calibration, and verification of health tracker step synchronization (Google Fit, Google Health Connect, Apple Health), dashboard metric accuracy, Playwright automated browser test execution, and database audit logging.

## Workflow Phases
1. **Phase 0: Survey & Scope Discovery**
   - Explorer 1: Survey Health Tracker Sync Calibration & Accuracy (R1), client timezone resolution, cumulative/delta merging, metric formulas, drift timers in dashboard components (`HealthSyncModal`, `CoastalTracker`, dashboard hooks, sync APIs).
   - Explorer 2: Survey End-to-End Playwright Automated Browser Test Suite (R2), existing tests in `tests/`, test execution requirements (`node tests/playwright_health_sync.mjs`, `npx playwright test`), UI elements and selectors.
   - Explorer 3: Survey API & Database Audit Log Verification Harness (R3) & Production Stability & Zero-Emoji Compliance (R4) (`/api/sync/health`, `/api/coastal/steps`, Supabase `public.step_logs`, `scripts/run-coastal-tests.mjs`, `scripts/run-smoke-test.mjs`, `npm.cmd run build`, emoji audit).

2. **Phase 1: Feature Inventory & Architecture (PROJECT.md)**
   - Synthesize survey reports into comprehensive Feature Inventory with milestones, interface contracts, and code layout.

3. **Phase 2: Milestone Decomposition & Iteration Loop**
   - Milestone 1: Health Tracker Sync & Dashboard Drift Calibration (R1)
   - Milestone 2: API & Supabase Audit Log Verification Harness (R3)
   - Milestone 3: Playwright Automated Browser E2E Test Suite (R2)
   - Milestone 4: Production Stability, Build & Zero-Emoji Compliance Verification (R4)
   - For each milestone: Explorer -> Worker -> Reviewers (x2) -> Challengers (x2) -> Auditor -> Gate check.

4. **Phase 3: Final Verification & Reporting**
   - Run Playwright test suite, Coastal tests, smoke tests, and Next.js build.
   - Forensic audit verification.
   - Comprehensive handoff to parent Sentinel.
