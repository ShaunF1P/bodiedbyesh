## 2026-09-02T16:41:02Z
You are teamwork_preview_worker (Admin Review Portal & Navigation Integration).
Working directory: c:\projects\BodiedbyEsh\.agents\worker_m3_admin
Project root: c:\projects\BodiedbyEsh
Original Request: c:\projects\BodiedbyEsh\ORIGINAL_REQUEST.md
Master Project Plan: c:\projects\BodiedbyEsh\PROJECT.md
Frontend Analysis: c:\projects\BodiedbyEsh\.agents\explorer_frontend_1\analysis.md
Backend Analysis: c:\projects\BodiedbyEsh\.agents\explorer_backend_1\analysis.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Zero Emojis Rule:
Strictly 100% Lucide React SVG iconography with ZERO Unicode/AI emojis anywhere in code, copy, headings, or comments.

Your Write Ownership:
- `src/app/admin/layout.tsx` (update NAV_ITEMS with Client Intakes)
- `src/app/admin/intakes/page.tsx`
- `src/components/admin/intakes/IntakeDetailModal.tsx`
- `src/components/admin/intakes/IntakeTable.tsx`

Your Mission:
1. Update `src/app/admin/layout.tsx`:
   - Import `ClipboardCheck` from `lucide-react`.
   - Add `{ href: "/admin/intakes", label: "Client Intakes", icon: ClipboardCheck }` to `NAV_ITEMS`.
2. Implement `src/components/admin/intakes/IntakeDetailModal.tsx`:
   - Full clinical inspection drawer/modal:
     - Client summary (name, email, phone, submitted date, track badge).
     - Clinical answers breakdown (Track A PAR-Q+ joint audit / weather; Track B biometrics / ergonomics / travel; Track C anthropometrics / BMR / GI triggers).
     - Digital signature inspection with signature image preview, timestamp, and legal confirmation.
     - Review status management: dropdown / buttons to update status (`new`, `reviewed`, `enrolled`, `archived`) calling `PATCH /api/intake`.
     - Coach notes editor with save button calling `PATCH /api/intake`.
     - Obsidian Gold Glassmorphism styling (`.glass-panel`, `border-accent-lime/30`), Lucide SVG icons, zero emojis.
3. Implement `src/components/admin/intakes/IntakeTable.tsx`:
   - Table of intakes with columns: Client, Track (badge), Status (pill), Waiver (signed badge), Submitted Date, Actions ("Review Clinical Intake").
   - Empty state with Lucide icons.
4. Implement `src/app/admin/intakes/page.tsx`:
   - Admin Intake Review Portal:
     - Summary KPI cards: Total Submissions, Track A on-site, Track B concierge, Track C nutrition, Pending Review count.
     - Filter bar: Track filter (`all`, `park-to-peak`, `executive-concierge`, `nutrition-metabolic`), Status filter (`all`, `new`, `reviewed`, `enrolled`, `archived`), and real-time text search input.
     - Loads submissions from `GET /api/intake` with loading skeleton and error retry.
     - Integrates `IntakeTable` and `IntakeDetailModal`.
     - Toast notifications on status/notes update.
5. Verify: Run TypeScript verification (`tsc --noEmit`).
6. Write handoff to `c:\projects\BodiedbyEsh\.agents\worker_m3_admin\handoff.md` and notify caller.
