# Original User Request

## 2026-09-02T16:33:05Z

Design, implement, and deploy three distinct digital clinical client intake forms (Track A Park-to-Peak Recomp, Track B Executive Concierge, and Nutrition & Metabolic Health) with standalone shareable URLs, local draft auto-saving, Zod runtime schema validation, Supabase PostgreSQL persistence, automated coach alerts, and an administrative intake review portal.

Working directory: c:\projects\BodiedbyEsh
Integrity mode: development

## Requirements

### R1. Digital Clinical Intake Forms & Standalone Shareable Routes
- Implement standalone, mobile-first responsive intake routes:
  1. `/intake/park-to-peak`: Track A on-site intake capturing athlete practice schedules (Mon/Wed vs. Tue/Thu cohorts), clinical PAR-Q+ orthopedic joint audits (grass/turf screening), South Florida heat/humidity environmental readiness, and 24-hr/weather policies with digital signature waivers.
  2. `/intake/executive-concierge`: Track B remote high-performance intake capturing bio-telemetry onboarding (Oura, Whoop, Apple Watch, Garmin; resting HR, HRV, sleep, strain), sedentary desk ergonomics (cervical spine, anterior pelvic tilt, hip flexors), travel/dining cadence, and dynamic recovery waivers.
  3. `/intake/nutrition-metabolic`: Custom macro & metabolic recomp intake capturing anthropometric baselines (Mifflin-St Jeor variables, body fat %, AI mesh consent), high-performance protein targets (~2.2g/kg), GI/behavioral triggers, and AI Meal Plate Scanner onboarding.
- Implement a unified coach hub at `/intake` with 1-click "Copy Direct Share Link" actions for Coach Esh and direct track selection for clients.
- Provide real-time client-side draft auto-save/restore (LocalStorage) so users do not lose progress on mobile interruptions.

### R2. Backend Ingress, Persistence & Notification Pipeline
- Create Supabase PostgreSQL table `public.client_intakes` with idempotent DDL, JSONB `intake_data` structure, RLS policies, and indexes.
- Implement `POST /api/intake` secured with IP sliding-window rate limiting (`evaluateRateLimit`), Zod schema validation, Supabase persistence, GoHighLevel contact upsert, automated client confirmation emails, and SMS/email alert notifications to Coach Esh.
- Implement `GET /api/intake` protected by `requireAdminSession` for querying and filtering submissions.

### R3. Admin Intake Review Portal & Dashboard Integration
- Build `/admin/intakes` allowing Coach Esh to filter intakes by track, view complete clinical responses, search by client name/email, update review statuses (`new`, `reviewed`, `enrolled`), and inspect signed waivers.
- Update `src/app/admin/layout.tsx` with a "Client Intakes" navigation item.

### R4. Design System Compliance & Quality Gates
- Maintain 100% Obsidian Gold Glassmorphism design tokens matching the Bodied by Esh design system.
- Strictly adhere to Global Rule 1: 100% Lucide React SVG iconography with zero Unicode/AI emojis.
- Ensure 100% TypeScript compilation and passing automated test suites.

## Verification Resources
- Implementation Plan: `implementation_plan.md`
- Master Project Register: `PROJECT.md`
- Test Suites: `node scripts/run-prr-audit-suite.mjs` / `npm.cmd test`
- Build Verification: `npm.cmd run build`

## Acceptance Criteria

### Functional Forms & Shareable Links
- [ ] `/intake`, `/intake/park-to-peak`, `/intake/executive-concierge`, and `/intake/nutrition-metabolic` render cleanly on mobile (390px) and desktop.
- [ ] 1-Click Copy Link buttons on `/intake` copy canonical URLs to clipboard with visual toast feedback.
- [ ] Draft progress automatically persists to LocalStorage and restores upon page refresh.
- [ ] Submitting each form successfully validates all required clinical fields and digital signatures.

### Backend & Data Isolation
- [ ] `POST /api/intake` validates payloads with Zod schemas and saves records to `public.client_intakes`.
- [ ] Rate limiter throttles excessive submissions with RFC HTTP 429 response.
- [ ] Notification dispatches trigger client confirmation emails and Coach Esh alert notifications.
- [ ] `GET /api/intake` strictly requires admin session authorization.

### Admin Review Portal
- [ ] `/admin/intakes` lists all submissions with track badges, search filters, and status management.
- [ ] Detailed modal/drawer displays full clinical answers, PAR-Q+ questions, and signed waivers.

### Build & Code Quality
- [ ] `npm.cmd test` passes with 100% success rate.
- [ ] `npm.cmd run build` compiles 0 TypeScript and 0 lint errors.
- [ ] 100% Lucide SVG icon compliance with zero emojis.
