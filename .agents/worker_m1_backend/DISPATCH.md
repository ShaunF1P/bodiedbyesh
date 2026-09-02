## 2026-09-02T16:38:12Z
You are teamwork_preview_worker (Backend Ingress Pipeline & Database DDL).
Working directory: c:\projects\BodiedbyEsh\.agents\worker_m1_backend
Project root: c:\projects\BodiedbyEsh
Original Request: c:\projects\BodiedbyEsh\ORIGINAL_REQUEST.md
Master Project Plan: c:\projects\BodiedbyEsh\PROJECT.md
Backend Analysis: c:\projects\BodiedbyEsh\.agents\explorer_backend_1\analysis.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Zero Emojis Rule:
Strictly 100% Lucide React SVG iconography with ZERO Unicode/AI emojis anywhere in code, logs, or comments.

Your Write Ownership:
- `scratch/client_intakes_setup.sql` (exclusive)
- `src/lib/validation/schemas.ts` (exclusive for intake schemas)
- `src/app/api/intake/route.ts` (exclusive)

Your Mission:
1. Create `scratch/client_intakes_setup.sql`:
   - Idempotent table definition `CREATE TABLE IF NOT EXISTS public.client_intakes` with UUID id default gen_random_uuid(), track text not null, client_name text not null, client_email text not null, client_phone text, intake_data jsonb not null default '{}'::jsonb, waiver_signed boolean not null default false, waiver_signature text, waiver_signed_at timestamptz, status text not null default 'new', coach_notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now().
   - Granular RLS policies (enable RLS, allow public insert, allow service_role and authenticated admin select/update).
   - Indexes on track, status, client_email, created_at, and GIN index on intake_data.
   - Updated_at trigger.

2. Update `src/lib/validation/schemas.ts`:
   - Add Zod schemas:
     - `ParkToPeakIntakeSchema`
     - `ExecutiveConciergeIntakeSchema`
     - `NutritionMetabolicIntakeSchema`
     - `ClientIntakeSubmissionSchema`
     - `AdminIntakeQuerySchema`
     - `AdminIntakePatchSchema`
   - Export all types via `z.infer`.

3. Implement `src/app/api/intake/route.ts`:
   - `POST`:
     - Rate limit with `checkRateLimit(request, "form")`, return `rateLimitResponse(rateLimit)` if !rateLimit.allowed.
     - Validate body with `validateRequestBody(request, ClientIntakeSubmissionSchema)`.
     - Insert into `public.client_intakes` using Supabase server/service-role client (`src/lib/supabase/server.ts` / `@supabase/supabase-js`).
     - Upsert GoHighLevel contact via `container.crmService.createOrUpdateContact({ email, firstName, lastName, phone, tags: ['client-intake', track] })`.
     - Send client confirmation email via `container.communicationService.sendEmail(...)`.
     - Send Coach alert via `container.communicationService.sendEmail(...)` and `container.communicationService.sendSMS(...)`.
     - Log events with PII-masked logging (`src/lib/logger.ts`).
     - Return HTTP 201 `{ success: true, intakeId: record.id, track: record.track, message: "..." }`.
   - `GET`:
     - Protected via `requireAdminSession(request)`. If error, return admin error.
     - Parse query parameters (track, status, search, limit, offset).
     - Query `public.client_intakes` and return `{ success: true, data, total }`.
   - `PATCH`:
     - Protected via `requireAdminSession(request)`.
     - Validate body with `AdminIntakePatchSchema`.
     - Update record in `public.client_intakes` and return `{ success: true, data }`.

4. Verify: Run TypeScript verification / type check on affected files.
5. Write your handoff report to `c:\projects\BodiedbyEsh\.agents\worker_m1_backend\handoff.md`.
6. Send a message to your caller when complete.
