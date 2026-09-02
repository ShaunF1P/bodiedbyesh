# Specification Discovery & Test Architecture Analysis

**Project**: Bodied by Esh — Digital Clinical Client Intake System & PRR Verification Architecture  
**Author**: teamwork_preview_spec_miner (Specification & Test Architecture)  
**Date**: 2026-09-02  
**Integrity Mode**: Development / Preview  

---

## 1. Executive Summary & Authoritative Spec Ingress

This document defines the authoritative specification discovery, validation constraints, error codes, security boundaries, and 4-tier End-to-End (E2E) testing architecture for the **Bodied by Esh Digital Clinical Client Intake System** and existing platform hardening framework.

### Authoritative Specification Sources:
1. `ORIGINAL_REQUEST.md`: Direct requirements for 3 digital clinical intake forms (Track A, Track B, Track C), Coach Hub (`/intake`), LocalStorage auto-save/restore, Supabase `public.client_intakes` persistence, CRM/email/SMS notification pipeline, and Admin Review Portal (`/admin/intakes`).
2. `PROJECT.md` & `TEST_INFRA.md`: Master feature register, Hexagonal architecture, sliding-window rate limiting, PII logging redaction, and 4-tier testing hierarchy.
3. `TEST_READY.md` & `scripts/run-prr-audit-suite.mjs`: Master PRR audit engine, 100/100 scoring algorithm, AST zero-emoji compliance scanner, and static verification gates.
4. Existing Core Codebase (`src/lib/validation/schemas.ts`, `src/lib/rate-limit.ts`, `src/lib/auth/admin.ts`, `src/middleware.ts`, `src/lib/logger.ts`, `src/lib/container.ts`).

---

## 2. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Forms (Track A) | `/intake/park-to-peak` Form | On-site clinical intake capturing practice schedules, orthopedic joint audit, Florida heat readiness, and signed liability waiver | Client info, cohort (Mon/Wed vs Tue/Thu), PAR-Q+ joint checklist, heat tolerance, digital signature | Form submission payload, LocalStorage draft, confirmation toast | 400 on missing waiver or invalid fields; field-level inline error cues | `ORIGINAL_REQUEST.md` R1 |
| 2 | Forms (Track B) | `/intake/executive-concierge` Form | Remote high-performance intake capturing bio-telemetry wearables, sedentary ergonomics, travel cadence, dynamic recovery waiver | Client info, wearables (Oura/Whoop/Apple/Garmin), RHR, HRV, sleep, strain, posture audit, travel frequency, signature | Form submission payload, LocalStorage draft, confirmation toast | 400 on out-of-range bio-telemetry numbers or unaccepted waivers | `ORIGINAL_REQUEST.md` R1 |
| 3 | Forms (Track C) | `/intake/nutrition-metabolic` Form | Macro & metabolic recomp intake capturing anthropometric baselines, Mifflin-St Jeor TDEE, protein targets (~2.2g/kg), GI triggers, AI mesh consent | Client info, age, gender, height, weight, body fat %, GI/allergy triggers, AI scan consent, signature | Form submission payload, calculated macro targets, confirmation toast | 400 on negative anthropometrics, invalid email/phone, or missing consent | `ORIGINAL_REQUEST.md` R1 |
| 4 | Coach Hub | Unified Coach Hub (`/intake`) | Central track selector for prospective clients and 1-click "Copy Direct Share Link" tool for Coach Esh | Click on track card or "Copy Direct Link" button | Navigation to track form or canonical URL copied to clipboard with visual toast | Fallback prompt if clipboard permissions are denied | `ORIGINAL_REQUEST.md` R1 |
| 5 | Client State | LocalStorage Auto-Save & Recovery | Client-side persistent draft engine preventing progress loss during mobile interruptions | User keystrokes, form input events, page reload | Auto-saved draft in `localStorage`, "Restore Draft" prompt / auto-population | Graceful fallback to fresh state if localStorage JSON is corrupted | `ORIGINAL_REQUEST.md` R1 |
| 6 | API Ingress | `POST /api/intake` Backend Ingress | Validates submission payload against Zod schema, enforces sliding-window rate limit, persists to Supabase, and triggers notifications | HTTP POST with JSON body (track, client info, clinical data, signature) | HTTP 201 `{ success: true, id, message }` | 429 on rate limit breach; 400 on schema violation; 500 on DB error | `ORIGINAL_REQUEST.md` R2 |
| 7 | API Admin | `GET /api/intake` Submissions Query | Admin-gated endpoint allowing querying, filtering by track/status, and searching client intakes | HTTP GET with optional `track`, `status`, `search`, `limit`, `offset` query params | HTTP 200 `{ success: true, intakes: [...] }` | 401 if unauthenticated; 403 if non-admin role; 400 on invalid query params | `ORIGINAL_REQUEST.md` R2 |
| 8 | API Admin | `PATCH /api/intake` Status Update | Admin-gated endpoint updating intake review status and coach notes | HTTP PATCH with `id`, `status` (`new`, `reviewed`, `enrolled`, `archived`), optional `notes` | HTTP 200 `{ success: true, intake }` | 401 if unauthenticated; 403 if non-admin; 400 if invalid status; 404 if not found | `ORIGINAL_REQUEST.md` R2, R3 |
| 9 | Database | Supabase `public.client_intakes` Table | Idempotent PostgreSQL schema with JSONB `intake_data`, indexes, and RLS policies | SQL DDL migration | Persistent table storage with indexed track, email, status, and created_at | RLS denial for unauthorized select/update operations | `ORIGINAL_REQUEST.md` R2 |
| 10 | Integrations | GoHighLevel Contact Upsert | Upserts client contact in GHL CRM with appropriate track tags | Email, name, phone, track tag (`intake:track-a`, etc.) | GHL Contact record | Logged error with non-blocking fallback if CRM service is unreachable | `ORIGINAL_REQUEST.md` R2 |
| 11 | Notifications | Client Confirmation Email | Sends transactional confirmation email via Resend / Communication Port | Client email, client name, track summary | Delivery via Resend API or simulated log | Logged error with non-blocking fallback | `ORIGINAL_REQUEST.md` R2 |
| 12 | Notifications | Coach Esh SMS/Email Alert | Dispatches immediate alert notification to Coach Esh on new intake submission | Intake details, client name, track name, contact info | SMS via Twilio and/or Email to coach | Logged error with non-blocking fallback | `ORIGINAL_REQUEST.md` R2 |
| 13 | Admin Portal | `/admin/intakes` Review Dashboard | Administrative portal for filtering, searching, and reviewing complete clinical responses and signed waivers | Search string, track filter tabs, status filter dropdown, row selection | Interactive submissions table, clinical details drawer/modal | Error banner if data fetch fails; 401/403 redirect if unauthorized | `ORIGINAL_REQUEST.md` R3 |
| 14 | Admin Portal | Admin Layout Navigation Update | Adds "Client Intakes" item to sidebar and mobile navigation in `src/app/admin/layout.tsx` | User navigation click | Route transition to `/admin/intakes` | Active state highlight | `ORIGINAL_REQUEST.md` R3 |
| 15 | Security | IP Sliding-Window Rate Limiting | In-memory sliding-window IP rate limiter enforcing 5 req/min on public form submissions | Client IP from headers (`x-forwarded-for`, `x-real-ip`) | RateLimitResult (limit, remaining, reset) | HTTP 429 Too Many Requests with RFC headers (`Retry-After`, `X-RateLimit-*`) | `src/lib/rate-limit.ts` |
| 16 | Security | Supabase Auth Metadata Role Gate | Role-based access control checking `user.app_metadata?.role === 'admin'` | Supabase session cookie | Authenticated admin user or HTTP 401/403 response | HTTP 401 Unauthorized or HTTP 403 Forbidden | `src/lib/auth/admin.ts` |
| 17 | Security | Edge Middleware Interception | Intercepts `/admin`, `/admin/*`, and canonicalizes case-insensitive routes | Request URL pathname | Next response or 301/307 redirect | Redirects unauthenticated to `/login?redirectTo=...`; non-admin to `/dashboard?error=unauthorized_admin_access` | `src/middleware.ts` |
| 18 | Telemetry | Structured Logging with PII Masking | Redacts customer emails, phone numbers, names, and auth tokens from server logs | Log message and meta payload | Formatted stdout log with `j***e@example.com`, `+1***4231`, `M*** V***` | Prevents credential and PII leakage in compliance with HIPAA/SOC2 | `src/lib/logger.ts` |
| 19 | SRE / Resilience | Bounded Outbound Timeouts | Enforces strict 8000ms SLA (`AbortSignal.timeout(8000)`) on all external fetch and AI calls | Outbound HTTP request | Timely response or AbortError | Throws AbortError / TimeoutError caught by safe wrapper | `src/lib/http/safe-fetch.ts` |
| 20 | Design System | Obsidian Gold Design Tokens & 0 Emojis | Enforces dark glassmorphism styling (`#050508`, `#0E0E14`, `#D4B87E`) and 100% Lucide SVGs | UI component JSX and CSS | Rendered UI meeting brand specs | AST emoji scanner fails CI if any Unicode emoji is detected | `src/app/globals.css`, Global Rule 1 |

---

## 3. Edge Cases & Boundary Conditions

| # | Feature | Input | Observed / Expected Behavior |
|---|---------|-------|------------------------------|
| 1 | Track A Form | Submitting without digital signature name | Validation error displayed on signature input: "Digital signature is required to confirm liability waiver". Submission blocked. |
| 2 | Track A Form | Mon/Wed cohort selected vs Tue/Thu cohort | Cohort choice accurately preserved in payload (`intake_data.cohortSchedule`) and displayed in admin drawer. |
| 3 | Track B Form | Resting heart rate input = `25` (extreme bradycardia) or `250` (extreme tachycardia) | Zod validator rejects RHR outside realistic human range [30, 220] bpm with descriptive validation issue. |
| 4 | Track B Form | Sitting hours input = `28` (impossible value > 24 hrs/day) | Zod validator rejects sitting hours > 24 with message "Daily sitting hours cannot exceed 24". |
| 5 | Track B Form | Wearable device selector set to "None" | Form bypasses device-specific metric requirements and allows manual baseline estimates without error. |
| 6 | Track C Form | Negative body weight (`-150` lbs) or negative height (`-60` inches) | Zod validator rejects non-positive numbers with "Weight/Height must be a positive number". |
| 7 | Track C Form | Body fat percentage input = `120%` | Zod validator rejects values > 100 with "Body fat percentage cannot exceed 100%". |
| 8 | Track C Form | Food allergens field containing script injection `<script>alert('xss')</script>` | Sanitized as plain string in Zod validation; React DOM escapes text preventing script execution. |
| 9 | Coach Hub | Browser clipboard write permission rejected by user or OS | Fallback UI gracefully shows direct URL in an input field with manual "Select All" focus. |
| 10 | LocalStorage Draft | Corrupted or malformed JSON in `localStorage.getItem('bodied_intake_draft_...')` | `try/catch` JSON parse block catches error, logs warning, initializes default empty state without crashing UI. |
| 11 | LocalStorage Draft | User fills Track A draft, then navigates to Track B form | Track isolation keys prevent Track A answers from populating Track B form fields. |
| 12 | LocalStorage Draft | User successfully submits form | LocalStorage draft for that specific track is purged immediately so refreshing does not show stale filled draft. |
| 13 | Ingress API | Client sends 6th submission within 60 seconds from same IP | Rate limiter evaluates sliding-window bucket, detects threshold breach, returns HTTP 429 with `Retry-After: 60` and `X-RateLimit-Remaining: 0`. |
| 14 | Ingress API | Client sends malformed non-JSON payload `{"broken: json` | `validateRequestBody` catches JSON parse exception and returns HTTP 400 with `{ success: false, error: "Invalid JSON" }`. |
| 15 | Ingress API | Client submits unknown track identifier `track_z_alien_fitness` | Zod schema validation fails with issue on `track` field, returning HTTP 400 Bad Request. |
| 16 | Admin API | Non-admin user (regular client session) calls `GET /api/intake` | `requireAdminSession` verifies `user.app_metadata?.role !== 'admin'` and returns HTTP 403 `{ error: "Forbidden: Administrator privileges required" }`. |
| 17 | Admin API | Unauthenticated request (no session cookies) calls `GET /api/intake` | `requireAdminSession` returns HTTP 401 `{ error: "Unauthorized: Authentication required" }`. |
| 18 | Admin API | Admin patches intake status with invalid enum `"approved_by_boss"` | Zod validation rejects status, returning HTTP 400 with allowed enum list (`new`, `reviewed`, `enrolled`, `archived`). |
| 19 | Admin Portal | Searching for client with special regex characters `test+client@gmail.com` or `O'Connor` | Search query escaping handles quotes, pluses, and special characters cleanly in Supabase query filter. |
| 20 | Static Audit | File containing Unicode emoji `🔥` or `✅` in UI text or comments | AST Zero-Emoji scanner flags exact file path and line number, causing test suite to exit with code 1. |

---

## 4. Comprehensive 4-Tier E2E Testing Architecture

```
================================================================================
  BODIED BY ESH — 4-TIER INTAKE & PLATFORM TESTING ARCHITECTURE
================================================================================
  Tier 1: Feature Coverage           (>= 5 test cases per feature module)
  Tier 2: Boundary & Corner Cases     (>= 5 test cases per feature module)
  Tier 3: Cross-Feature Integration   (Multi-module pipelines & state handoffs)
  Tier 4: Real-World User Journeys    (Full client & coach end-to-end workflows)
  Static: AST Zero-Emoji & Type Audit (100% strict compliance verification)
================================================================================
```

---

### Tier 1: Feature Coverage Matrix ($\ge 5$ tests per feature)

#### Module 1: Track A Form (`/intake/park-to-peak`)
- **T1.1.1 (Route & Structure)**: Verify `/intake/park-to-peak` mounts with Obsidian Gold theme, header, and progress indicator.
- **T1.1.2 (Cohort Selection)**: Verify user can toggle between Mon/Wed and Tue/Thu cohort schedules with visual selection state.
- **T1.1.3 (Orthopedic Joint Audit)**: Verify PAR-Q+ orthopedic joint checkboxes (ankles, knees, hips, lower back, shoulders) capture boolean state.
- **T1.1.4 (Florida Heat Readiness)**: Verify heat/humidity tolerance and hydration habit inputs capture selections.
- **T1.1.5 (Waiver & Signature)**: Verify 24-hr cancellation policy checkbox and digital signature text field are captured and included in submission payload.

#### Module 2: Track B Form (`/intake/executive-concierge`)
- **T1.2.1 (Route & Structure)**: Verify `/intake/executive-concierge` renders with high-performance executive branding and bio-telemetry sections.
- **T1.2.2 (Wearable Device Onboarding)**: Verify multi-select / single-select for wearable hardware (Oura Ring, Whoop, Apple Watch, Garmin).
- **T1.2.3 (Bio-Telemetry Baselines)**: Verify numeric inputs for Resting Heart Rate (bpm), HRV (ms), average sleep hours, and daily strain.
- **T1.2.4 (Sedentary Ergonomics)**: Verify joint screening for cervical spine tension, anterior pelvic tilt (APT), and hip flexor tightness.
- **T1.2.5 (Travel & Dining Cadence)**: Verify travel frequency and dining-out cadence dropdowns capture selected values.

#### Module 3: Track C Form (`/intake/nutrition-metabolic`)
- **T1.3.1 (Route & Structure)**: Verify `/intake/nutrition-metabolic` renders with anthropometric calculation cards.
- **T1.3.2 (Anthropometric Baselines)**: Verify Age, Gender, Height, Weight, and Body Fat % fields capture and store numeric values.
- **T1.3.3 (Metabolic Calculator)**: Verify real-time client-side Mifflin-St Jeor BMR/TDEE calculation and 2.2g/kg protein target computation.
- **T1.3.4 (GI & Behavioral Triggers)**: Verify allergy checkboxes, digestive sensitivity tags, and late-night eating triggers are recorded.
- **T1.3.5 (AI Mesh Scan Consent)**: Verify AI 3D Mesh body scanner onboarding consent toggle and digital signature capture.

#### Module 4: Coach Hub & Shareable Links (`/intake`)
- **T1.4.1 (Hub Navigation)**: Verify `/intake` renders all 3 track cards with clear descriptions and CTA buttons.
- **T1.4.2 (Direct Link Track A)**: Verify "Copy Direct Link" for Track A writes `https://<domain>/intake/park-to-peak` to clipboard.
- **T1.4.3 (Direct Link Track B)**: Verify "Copy Direct Link" for Track B writes `https://<domain>/intake/executive-concierge` to clipboard.
- **T1.4.4 (Direct Link Track C)**: Verify "Copy Direct Link" for Track C writes `https://<domain>/intake/nutrition-metabolic` to clipboard.
- **T1.4.5 (Visual Toast Feedback)**: Verify toast banner appears upon copying link ("Direct intake link copied to clipboard").

#### Module 5: Client-Side Draft Auto-Save Engine
- **T1.5.1 (Real-Time Auto-Save)**: Verify form input changes trigger debounced write to `localStorage`.
- **T1.5.2 (Key Isolation)**: Verify each track saves to its own unique key (`bodied_intake_draft_park_to_peak`, etc.).
- **T1.5.3 (Draft Recovery on Mount)**: Verify page reload detects existing draft and auto-populates fields with toast confirmation.
- **T1.5.4 (Manual Clear Draft)**: Verify "Reset / Clear Form" button purges `localStorage` draft.
- **T1.5.5 (Auto-Purge on Submit)**: Verify successful API submission clears the corresponding `localStorage` draft.

#### Module 6: Ingress API (`POST /api/intake`)
- **T1.6.1 (Track A Ingress)**: Verify valid Track A payload returns HTTP 201 with generated UUID.
- **T1.6.2 (Track B Ingress)**: Verify valid Track B payload returns HTTP 201 with generated UUID.
- **T1.6.3 (Track C Ingress)**: Verify valid Track C payload returns HTTP 201 with generated UUID.
- **T1.6.4 (Supabase Persistence)**: Verify payload is stored in `public.client_intakes` with status `'new'` and JSONB `intake_data`.
- **T1.6.5 (Notification Dispatch)**: Verify confirmation email and coach alert dispatches are triggered.

#### Module 7: Admin API (`GET & PATCH /api/intake`)
- **T1.7.1 (Admin GET All)**: Verify authenticated admin session receives list of all intake records.
- **T1.7.2 (Track Filter Query)**: Verify `GET /api/intake?track=park-to-peak` filters records accurately.
- **T1.7.3 (Status Filter Query)**: Verify `GET /api/intake?status=new` returns only unreviewed intakes.
- **T1.7.4 (Search Query)**: Verify `GET /api/intake?search=marcus` searches by client name or email.
- **T1.7.5 (Status Update PATCH)**: Verify `PATCH /api/intake` updates record status to `'reviewed'` or `'enrolled'`.

#### Module 8: Admin Review Portal (`/admin/intakes`)
- **T1.8.1 (Layout Integration)**: Verify "Client Intakes" item exists in sidebar and navigates to `/admin/intakes`.
- **T1.8.2 (Intakes Table Rendering)**: Verify submissions table displays client name, email, track badge, date, and status.
- **T1.8.3 (Filter Tabs Interaction)**: Verify clicking "Track A", "Track B", or "Track C" filter tabs filters visible table rows.
- **T1.8.4 (Clinical Details Drawer)**: Verify clicking an intake row opens the clinical inspection drawer showing full questionnaire responses.
- **T1.8.5 (Status Management Action)**: Verify coach can toggle status between New, Reviewed, and Enrolled with instant UI update.

#### Module 9: Design System & Static Quality
- **T1.9.1 (Theme Tokens)**: Verify background is `#050508`, cards are `#0E0E14`, accent is `#D4B87E`.
- **T1.9.2 (Glassmorphism)**: Verify `.glass-panel` backdrop-filter blur and border styling.
- **T1.9.3 (Safe Area Insets)**: Verify padding handles `--sat` and `--sab` environmental insets.
- **T1.9.4 (Lucide SVG Icons)**: Verify all icons render as SVG elements from `lucide-react`.
- **T1.9.5 (Mobile Viewport 390px)**: Verify zero horizontal overflow at 390px viewport width.

---

### Tier 2: Boundary & Corner Cases Matrix ($\ge 5$ tests per feature)

#### Module 1: Track A Form Boundaries
- **T2.1.1 (Empty Name/Email)**: Verify submission fails validation when name or email is blank.
- **T2.1.2 (Invalid Email Format)**: Verify submission rejects `athlete@` or `athlete.com` with inline error message.
- **T2.1.3 (Missing Waiver Agreement)**: Verify submission blocked if waiver checkbox is unchecked.
- **T2.1.4 (Oversized Text Notes)**: Verify notes field > 5000 characters is rejected or safely truncated.
- **T2.1.5 (Rapid Double Submit)**: Verify submit button is disabled during in-flight submission to prevent duplicate records.

#### Module 2: Track B Form Boundaries
- **T2.2.1 (Resting Heart Rate Boundary)**: Verify RHR < 30 or > 220 is rejected by schema validation.
- **T2.2.2 (HRV Boundary)**: Verify HRV < 0 or > 300 ms is rejected by schema validation.
- **T2.2.3 (Sleep Hours Boundary)**: Verify sleep hours < 0 or > 24 is rejected.
- **T2.2.4 (Missing Remote Waiver)**: Verify remote training liability waiver is required.
- **T2.2.5 (SQL Injection in Role Field)**: Verify `' OR 1=1 --` in job title is sanitized and treated as literal text.

#### Module 3: Track C Form Boundaries
- **T2.3.1 (Negative Weight/Height)**: Verify weight $\le 0$ lbs and height $\le 0$ inches are rejected.
- **T2.3.2 (Body Fat Out-of-Bounds)**: Verify body fat $< 0\%$ or $> 100\%$ is rejected.
- **T2.3.3 (Extreme Calorie Targets)**: Verify caloric target $> 15,000$ kcal is rejected as an invalid boundary.
- **T2.3.4 (XSS in Allergen List)**: Verify `<img src=x onerror=alert(1)>` in allergy notes is escaped safely.
- **T2.3.5 (AI Scan Toggle Unchecked)**: Verify user can proceed without AI mesh scan (optional opt-in).

#### Module 4: Coach Hub & Shareable Link Boundaries
- **T2.4.1 (Clipboard Denied)**: Verify app does not crash when `navigator.clipboard.writeText` throws permission error.
- **T2.4.2 (Malformed Direct URL Param)**: Verify `/intake?track=unknown_track` falls back to default hub view gracefully.
- **T2.4.3 (Special Characters in UTM)**: Verify query parameters with tracking tags (`?utm_source=instagram&ref=esh`) pass through cleanly.
- **T2.4.4 (Extreme Viewport 320px)**: Verify layout does not clip or break on ultra-compact mobile screens (320px).
- **T2.4.5 (High Contrast / Dark Mode Toggle)**: Verify contrast ratios meet WCAG AA standards in both default and light themes.

#### Module 5: LocalStorage Draft Boundaries
- **T2.5.1 (Corrupt JSON)**: Verify `localStorage.setItem(key, "INVALID_NON_JSON")` is caught and safely cleared.
- **T2.5.2 (Storage Quota Exceeded)**: Verify `QuotaExceededError` during `localStorage.setItem` is caught without crashing UI.
- **T2.5.3 (Stale Draft Expiry)**: Verify drafts older than 30 days are purged on load.
- **T2.5.4 (Cross-Tab Sync)**: Verify updating a form in Tab 1 synchronizes or does not corrupt draft in Tab 2.
- **T2.5.5 (Prototype Pollution in Draft)**: Verify `__proto__` or `constructor` keys in draft JSON cannot pollute Object prototype.

#### Module 6: Ingress API Boundaries
- **T2.6.1 (Rate Limit Saturation)**: Verify 6th request within 60s from single IP receives HTTP 429 Too Many Requests.
- **T2.6.2 (Malformed JSON Body)**: Verify non-JSON request body returns HTTP 400 Bad Request with descriptive message.
- **T2.6.3 (Missing Required Fields)**: Verify payload missing `client_email` returns HTTP 400 with Zod issues array.
- **T2.6.4 (Oversized Body Payload)**: Verify payload $> 1\text{ MB}$ is rejected with HTTP 413 or 400.
- **T2.6.5 (NoSQL/SQL Injection Payload)**: Verify `{"$gt": ""}` or `' UNION SELECT` in fields does not execute SQL/NoSQL injection.

#### Module 7: Admin API Boundaries
- **T2.7.1 (Unauthenticated 401)**: Verify calling `GET /api/intake` without cookies returns HTTP 401 Unauthorized.
- **T2.7.2 (Forbidden Role 403)**: Verify calling `GET /api/intake` with non-admin session returns HTTP 403 Forbidden.
- **T2.7.3 (Invalid Status Enum PATCH)**: Verify `PATCH /api/intake` with status `"deleted"` returns HTTP 400.
- **T2.7.4 (Non-Existent Intake UUID)**: Verify `PATCH /api/intake` with non-existent UUID returns HTTP 404 Not Found.
- **T2.7.5 (SQL Injection in Search Query)**: Verify `GET /api/intake?search='; DROP TABLE client_intakes; --` is parameterized safely.

#### Module 8: Admin Portal Boundaries
- **T2.8.1 (Zero Submissions State)**: Verify table renders clear empty state illustration when 0 records match filter.
- **T2.8.2 (Long Client Text Wrapping)**: Verify 500-word clinical response wraps properly without breaking modal layout.
- **T2.8.3 (Rapid Status Toggling)**: Verify clicking status pills rapidly handles optimistic updates and error rollbacks.
- **T2.8.4 (Keyboard Drawer Dismissal)**: Verify pressing `Escape` key closes the clinical inspection drawer.
- **T2.8.5 (Mobile Table Horizontal Scroll)**: Verify table handles narrow screens with smooth horizontal scroll or card view.

#### Module 9: Design System & Quality Audit Boundaries
- **T2.9.1 (AST Zero-Emoji Audit)**: Verify recursive AST scan detects and flags any Unicode emoji character in `src/`.
- **T2.9.2 (Strict TypeScript Check)**: Verify `npx tsc --noEmit` exits with code 0 (zero type errors).
- **T2.9.3 (Next.js 16 Production Build)**: Verify `next build` compiles all dynamic and static routes cleanly.
- **T2.9.4 (PII Redaction in Output Logs)**: Verify logs mask emails (`j***e@domain.com`) and phone numbers (`+1***4231`).
- **T2.9.5 (Bounded SLA Timeout)**: Verify external fetch calls abort within 8000ms SLA.

---

### Tier 3: Cross-Feature Integration Pipelines

1. **Pipeline 1: Full Ingress Pipeline Flow**:
   - `Client Request` $\rightarrow$ `Sliding-Window Rate Limiter (checkRateLimit)` $\rightarrow$ `Zod Schema Validation (validateRequestBody)` $\rightarrow$ `Supabase PostgreSQL Persistence (public.client_intakes)` $\rightarrow$ `GHL CRM Contact Upsert (ICRMService)` $\rightarrow$ `Resend Client Confirmation Email (ICommunicationService)` $\rightarrow$ `Coach Esh Alert Notification` $\rightarrow$ `PII-Redacted Telemetry Logger`.
2. **Pipeline 2: Status Code Priority Hierarchy**:
   - HTTP 429 (Rate Limit Breached) $>$ HTTP 401 (Auth Missing) $>$ HTTP 403 (Non-Admin Role) $>$ HTTP 400 (Zod Schema Validation Error) $>$ HTTP 201/200 (Success).
3. **Pipeline 3: Draft Save $\rightarrow$ Edit $\rightarrow$ Submit $\rightarrow$ Purge Lifecycle**:
   - Step 1: User fills Track A form up to Step 3 $\rightarrow$ written to `localStorage`.
   - Step 2: User navigates away and returns $\rightarrow$ draft restored with banner.
   - Step 3: User finishes and submits $\rightarrow$ `POST /api/intake` succeeds $\rightarrow$ `localStorage` draft automatically purged $\rightarrow$ refresh yields clean form.
4. **Pipeline 4: Multi-Track Ingress from Same Client Email**:
   - User submits Track A intake $\rightarrow$ creates record #1 with `track='park-to-peak'`.
   - Same user submits Track C intake $\rightarrow$ creates record #2 with `track='nutrition-metabolic'`.
   - GHL upserts contact and appends both tags without data collision.
   - Admin portal displays both records under respective track filters.
5. **Pipeline 5: Edge Middleware Routing & Admin Barrier**:
   - Unauthenticated access to `/admin/intakes` $\rightarrow$ redirected to `/login?redirectTo=/admin/intakes`.
   - Authenticated client (non-admin) access $\rightarrow$ redirected to `/dashboard?error=unauthorized_admin_access`.
   - Case canonicalization `/INTAKE/PARK-TO-PEAK` $\rightarrow$ 301 permanent redirect to `/intake/park-to-peak`.

---

### Tier 4: Real-World User Journeys & Workloads

#### Journey 1: Coach Esh Direct Share & Outreach Workflow
- **Actor**: Coach Esh
- **Steps**:
  1. Coach Esh accesses `/intake` on mobile browser.
  2. Clicks "Copy Direct Link" under Track A Park-to-Peak.
  3. Receives visual toast notification: "Direct intake link copied to clipboard".
  4. Pastes link `https://bodiedbyesh.com/intake/park-to-peak` into SMS/Instagram DM to prospective athlete.

#### Journey 2: Track A Client Full Onboarding Journey (Park-to-Peak Recomp)
- **Actor**: Marcus Vance (Outdoor Athlete)
- **Steps**:
  1. Opens `/intake/park-to-peak` on mobile Safari (390px viewport).
  2. Selects Tue/Thu cohort schedule.
  3. Completes PAR-Q+ orthopedic joint audit (flags previous left ankle sprain).
  4. Answers South Florida heat/humidity acclimatization checklist.
  5. Reviews 24-hr cancellation policy and Florida lightning safety guidelines.
  6. Enters digital signature: "Marcus Vance".
  7. Clicks "Submit Client Intake".
  8. Instant visual success screen displayed; receives confirmation email via Resend; Coach Esh receives SMS alert.

#### Journey 3: Track B Remote Executive Concierge Onboarding Journey
- **Actor**: Elena Rostova (VP of Technology, Remote Client)
- **Steps**:
  1. Opens `/intake/executive-concierge` on desktop.
  2. Connects bio-telemetry profile: selects Oura Ring Gen 3 & Apple Watch Ultra.
  3. Inputs baseline metrics: RHR = 54 bpm, HRV = 72 ms, Avg Sleep = 6.5 hrs, Daily Sitting = 9 hrs.
  4. Identifies ergonomic focus areas: Cervical spine tension & anterior pelvic tilt.
  5. Inputs travel cadence: 2-3 domestic flights per month.
  6. Accepts remote coaching liability and dynamic recovery waiver.
  7. Submits intake $\rightarrow$ data persisted in Supabase with `track: 'executive-concierge'`.

#### Journey 4: Track C Nutrition & Metabolic Health Onboarding Journey
- **Actor**: David Chen (Recomposition Client)
- **Steps**:
  1. Opens `/intake/nutrition-metabolic`.
  2. Inputs anthropometrics: Age = 34, Height = 71 inches, Weight = 195 lbs, Body Fat = 18%.
  3. Views calculated baseline TDEE (2,450 kcal) and high-performance protein target (195g / 2.2g/kg).
  4. Selects dietary triggers: Lactose sensitivity, late-night snacking tendency.
  5. Toggles consent for AI 3D Mesh Body Scanner & AI Meal Plate Scanner.
  6. Signs waiver and submits intake.

#### Journey 5: Coach Esh Admin Clinical Review & Status Pipeline
- **Actor**: Coach Esh (Administrator)
- **Steps**:
  1. Receives notification alert: "New Track A Intake submitted by Marcus Vance".
  2. Opens `/admin/intakes`.
  3. Filters by "Track A Park-to-Peak" and searches "Marcus".
  4. Clicks row to open Clinical Response Drawer.
  5. Reviews orthopedic joint notes (ankle history), heat tolerance, and signed waiver.
  6. Enters coach clinical assessment notes: "Cleared for Tue/Thu cohort; monitor left ankle stability during turf plyometrics".
  7. Updates status from `New` $\rightarrow$ `Reviewed` $\rightarrow$ `Enrolled`.
  8. Status badge updates to green (`Enrolled`) with timestamp.

---

## 5. Test Implementation & Automation Strategy

### 1. Test Runner Scripts
- **Composite Runner (`package.json`)**: `npm.cmd test`
- **Master PRR Audit Suite**: `node scripts/run-prr-audit-suite.mjs` (or `npm run test:prr`)
- **Static AST & Zero-Emoji Scanner**: `node scripts/run-smoke-test.mjs`
- **Headless Browser E2E Runner**: `node tests/playwright_health_sync.mjs` / `tests/playwright_intake_suite.mjs`
- **Type Compiler Gate**: `npx.cmd tsc --noEmit`
- **Production Build Gate**: `npm.cmd run build`

### 2. PRR Acceptance Criteria
1. **100% Pass Rate across all 4 Tiers**: Zero test failures.
2. **0 TypeScript Compiler Errors**: Strict type checking with `tsc --noEmit`.
3. **0 Build Errors**: Next.js 16 App Router build compiles cleanly.
4. **PRR Production Readiness Score $\ge 90/100$**: Master audit score target of 100/100.
5. **Zero Unicode Emojis**: 100% compliance with Global Rule 1 across all components, headings, and copy.
6. **Forensic Integrity**: Genuine business logic, real state machines, zero hardcoded test bypasses.
