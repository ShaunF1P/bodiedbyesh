# Project: Bodied by Esh Digital Clinical Client Intake System

## Architecture
- **Framework**: Next.js App Router (React 19, TypeScript strict mode)
- **Styling & Tokens**: Tailwind v4 with Obsidian Gold glassmorphism (`#050508`, `#0E0E14`, `#D4B87E`, `.glass-panel`, `.glass-panel-lime`)
- **Iconography**: 100% Lucide React SVG components (ZERO Unicode emojis / AI symbols)
- **Database & Persistence**: Supabase PostgreSQL `public.client_intakes` with Row Level Security (RLS), JSONB `intake_data`, indexes, and timestamp triggers
- **Perimeter & Ingress Security**: Sliding-window IP rate limiting (`form` policy: 5 req/min), Zod runtime validation, structured PII-sanitized logging
- **Authentication & RBAC**: Admin role session enforcement via `requireAdminSession` for `GET`/`PATCH` endpoints and Edge middleware for `/admin/*` routes
- **External Integrations**: GoHighLevel (GHL) CRM contact sync, Resend client email confirmations, Twilio SMS/email alerts for Coach Esh
- **Client-Side State**: LocalStorage draft auto-save & restore engine with debouncing and track isolation

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Track A Form (`/intake/park-to-peak`) | On-site clinical intake: cohort selection (Mon/Wed vs Tue/Thu), PAR-Q+ orthopedic joint audits (grass/turf), S. Florida heat/humidity readiness, 24hr weather policy waiver & digital signature | M2 | Survey / ORIGINAL_REQUEST §R1 |
| 2 | Track B Form (`/intake/executive-concierge`) | Remote high-performance intake: bio-telemetry onboarding (Oura/Whoop/Apple Watch/Garmin; resting HR, HRV, sleep, strain), sedentary desk ergonomics (cervical spine, APT, hip flexors), travel/dining cadence, dynamic recovery waiver | M2 | Survey / ORIGINAL_REQUEST §R1 |
| 3 | Track C Form (`/intake/nutrition-metabolic`) | Custom macro & metabolic recomp intake: anthropometric baselines (Mifflin-St Jeor), body fat %, AI mesh consent, ~2.2g/kg protein targets, GI/behavioral triggers, AI Meal Plate Scanner onboarding | M2 | Survey / ORIGINAL_REQUEST §R1 |
| 4 | Unified Coach Hub (`/intake`) | Central hub for Coach Esh with 1-click canonical link copying, visual toast feedback, track selection cards, and form overview modal | M2 | Survey / ORIGINAL_REQUEST §R1 |
| 5 | LocalStorage Draft Auto-Save | Debounced client-side auto-save and restore (`useIntakeDraft`) keyed by track with purge-on-success | M2 | Survey / ORIGINAL_REQUEST §R1 |
| 6 | Digital Signature Canvas | Smooth touch/mouse canvas signature pad (`SignaturePad`) with touch-action isolation, clear, and PNG export | M2 | Survey / ORIGINAL_REQUEST §R1 |
| 7 | Supabase Table `public.client_intakes` | Idempotent PostgreSQL migration DDL, RLS policies, performance indexes, GIN index on `intake_data`, and `updated_at` trigger | M1 | Survey / ORIGINAL_REQUEST §R2 |
| 8 | Zod Clinical Schemas | Strict runtime validation schemas in `src/lib/validation/schemas.ts` for all 3 tracks, ingress submission, and admin queries | M1 | Survey / ORIGINAL_REQUEST §R2 |
| 9 | Ingress API `POST /api/intake` | Sliding-window rate limiting (`form` policy), Zod validation, Supabase insert, GHL sync, Resend confirmation email, Coach SMS/email alert | M1 | Survey / ORIGINAL_REQUEST §R2 |
| 10 | Protected API `GET /api/intake` | Admin session protected query API with track, status, search, and date range filters | M1 | Survey / ORIGINAL_REQUEST §R2 |
| 11 | Protected API `PATCH /api/intake` | Admin session protected status updates (`new`, `reviewed`, `enrolled`, `archived`) and coach notes | M1 | Survey / ORIGINAL_REQUEST §R2 |
| 12 | Admin Review Portal (`/admin/intakes`) | Dashboard listing submissions, track filter badges, client search, status management, and statistics summary | M3 | Survey / ORIGINAL_REQUEST §R3 |
| 13 | Clinical Response Detail Drawer | Comprehensive modal/drawer displaying full client answers, PAR-Q+ audit, biometrics, macro breakdown, and signed waiver | M3 | Survey / ORIGINAL_REQUEST §R3 |
| 14 | Admin Navigation Integration | Updated `NAV_ITEMS` in `src/app/admin/layout.tsx` linking to `/admin/intakes` with `ClipboardCheck` Lucide icon | M3 | Survey / ORIGINAL_REQUEST §R3 |
| 15 | 4-Tier E2E Test Suite | Comprehensive automated test runner (`scripts/run-intake-tests.mjs`) covering Feature Coverage, Boundary Fuzzing, Cross-Feature Pipelines, and Real-World Workloads | M4 | Survey / ORIGINAL_REQUEST §Verification |
| 16 | PRR Audit & Smoke Test Integration | Integration into `scripts/run-prr-audit-suite.mjs` and `npm test` verifying 100/100 score, 0 emojis, and strict layout compliance | M4 | Survey / ORIGINAL_REQUEST §R4 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Database & Backend Ingress Pipeline | `scratch/client_intakes_setup.sql`, `src/lib/validation/schemas.ts`, `src/app/api/intake/route.ts` | none | DONE |
| M2 | Client Intake Forms & Coach Hub UI | `src/app/intake/page.tsx`, `src/app/intake/park-to-peak/page.tsx`, `src/app/intake/executive-concierge/page.tsx`, `src/app/intake/nutrition-metabolic/page.tsx`, `src/components/intake/*`, `src/hooks/useIntakeDraft.ts` | M1 (schemas) | DONE |
| M3 | Admin Review Portal & Nav Integration | `src/app/admin/intakes/page.tsx`, `src/components/admin/intakes/*`, `src/app/admin/layout.tsx` | M1, M2 | DONE |
| M4 | E2E Test Suite Creation | `scripts/run-intake-tests.mjs`, integration in `package.json` & `scripts/run-prr-audit-suite.mjs`, `TEST_READY.md` | M1, M2, M3 | DONE |
| M5 | Final Verification & Forensic Audit | Run full test suite (`npm test`), build check (`npm run build`), static zero-emoji AST scan, PRR audit, Forensic Integrity Audit | M1, M2, M3, M4 | DONE |

## Interface Contracts
### Client Intake Submission Contract (`POST /api/intake`)
- **Request Headers**: `Content-Type: application/json`
- **Payload Schema**: `ClientIntakeSubmissionSchema`
  - `track`: `'park-to-peak' | 'executive-concierge' | 'nutrition-metabolic'`
  - `clientName`: string (min 2, max 100)
  - `clientEmail`: string (valid email format)
  - `clientPhone`: string (min 7, max 25)
  - `intakeData`: Record<string, unknown> (track-specific structured JSON)
  - `waiverSigned`: boolean (must be true)
  - `waiverSignature`: string (data URL or typed name, min 2 chars)
- **Response Success (201 Created)**:
  ```json
  {
    "success": true,
    "intakeId": "uuid-v4",
    "track": "park-to-peak",
    "message": "Intake submitted successfully. Confirmation email dispatched."
  }
  ```
- **Response Failure (400 Bad Request)**:
  ```json
  {
    "success": false,
    "error": "Validation Error",
    "issues": [{ "path": "clientEmail", "message": "Invalid email address" }]
  }
  ```
- **Response Rate Limited (429 Too Many Requests)**:
  ```json
  {
    "success": false,
    "error": "Too Many Requests",
    "message": "Rate limit exceeded. Please wait 60 seconds before submitting again."
  }
  ```

### Admin Intake Query Contract (`GET /api/intake`)
- **Headers**: Cookie / Authorization with admin session
- **Query Parameters**: `track`, `status`, `search`, `limit`, `offset`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "track": "park-to-peak",
        "client_name": "...",
        "client_email": "...",
        "client_phone": "...",
        "intake_data": { ... },
        "waiver_signed": true,
        "waiver_signature": "...",
        "waiver_signed_at": "ISO",
        "status": "new",
        "coach_notes": null,
        "created_at": "ISO",
        "updated_at": "ISO"
      }
    ],
    "total": 1
  }
  ```

### Admin Intake Status Update Contract (`PATCH /api/intake`)
- **Headers**: Cookie / Authorization with admin session
- **Payload**: `{ "id": "uuid", "status": "reviewed" | "enrolled" | "archived" | "new", "coachNotes"?: string }`
- **Response (200 OK)**: `{ "success": true, "data": { ... } }`

## Code Layout
```
src/
├── app/
│   ├── intake/
│   │   ├── page.tsx                      # Unified Coach Hub & Direct Track Selector
│   │   ├── layout.tsx                    # Intake Shared Shell & Glassmorphic Background
│   │   ├── park-to-peak/page.tsx         # Track A On-Site Clinical Intake Form
│   │   ├── executive-concierge/page.tsx  # Track B Remote Biotelemetry Intake Form
│   │   └── nutrition-metabolic/page.tsx  # Track C Macro & Metabolic Intake Form
│   ├── admin/
│   │   ├── layout.tsx                    # Updated Admin Navigation with Client Intakes link
│   │   └── intakes/
│   │       └── page.tsx                  # Admin Intake Review Dashboard
│   └── api/
│       └── intake/
│           └── route.ts                  # POST (Ingress), GET (Admin query), PATCH (Admin update)
├── components/
│   ├── intake/
│   │   ├── IntakeProgress.tsx            # Multi-step progress bar
│   │   ├── SignaturePad.tsx              # Canvas-based digital signature pad
│   │   ├── Toast.tsx                     # Obsidian Gold glassmorphic toast notification
│   │   └── TrackCard.tsx                 # Coach Hub track selection & direct copy card
│   └── admin/
│       └── intakes/
│           ├── IntakeDetailModal.tsx     # Full clinical response viewer & waiver inspector
│           └── IntakeTable.tsx           # Filterable submissions table with status pills
├── hooks/
│   └── useIntakeDraft.ts                 # LocalStorage draft auto-save and restore hook
├── lib/
│   └── validation/
│       └── schemas.ts                    # Zod schemas for all intake tracks & API routes
scratch/
└── client_intakes_setup.sql              # Idempotent Supabase PostgreSQL migration DDL
scripts/
└── run-intake-tests.mjs                  # 4-Tier E2E automated test suite
```
