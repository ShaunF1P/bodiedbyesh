# DISPATCH

## 2026-08-17T16:50:00Z

You are Worker UI Tracking for the BodiedbyEsh.com Coastal Community Church (#3266) Faith & Fitness Walking and Step Tracker project.

Working directory: C:\projects\BodiedbyEsh\.agents\worker_ui_tracking
Parent conversation ID: 8ee26115-64d8-4399-bfa9-d72abdf93fc3
Project root: C:\projects\BodiedbyEsh

Your mission is to implement Milestone 3 (Onboarding & Portal Entry) and Milestone 4 (Step, Distance & Streak Tracker):

1. You MUST read:
   - C:\projects\BodiedbyEsh\.agents\ORIGINAL_REQUEST.md
   - C:\projects\BodiedbyEsh\PROJECT.md
   - C:\projects\BodiedbyEsh\src\types\coastal.ts
   - C:\projects\BodiedbyEsh\src\lib\coastal\db.ts

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

STRICT DESIGN & ACCESSIBILITY CONSTRAINTS:
- Strictly ZERO emojis in code, copy, titles, or messages. Only use Lucide React SVG icons (`lucide-react`).
- Obsidian Gold & dark slate styling (`bg-cyber-slate`, `text-ice-white`, `text-accent-lime` / gold `--t-accent`, `glass-panel`, `.touch-target`, `.safe-top`, `.safe-bottom`).

Files you own:
1. `src/components/coastal/CoastalHero.tsx`:
   - Group #3266 branding & verified badge ("Coastal Community Church #3266 Faith & Fitness Walking Group").
   - Quick statistics ticker (Total church steps, active walkers, collective miles).
   - "Join Walking Group" and "Log Daily Steps" primary/secondary CTAs.
   - Guest preview notice / authenticated member status.
2. `src/components/coastal/CoastalAuthModal.tsx`:
   - Seamless magic link email sign-in / password authentication.
   - Auto-association with Group #3266 upon login/signup.
   - Guest preview button to browse without logging in.
   - Supabase SSR / client auth integration.
3. `src/components/coastal/StepTracker.tsx`:
   - Daily step entry with quick-add presets (+1,000, +2,500, +5,000, +10,000 steps) and custom numeric input.
   - Real-time dynamic distance calculation (steps / 2000 = miles) and active walking time (steps / 100 = minutes).
   - Active walking streak counter badge (consecutive active days) with flame icon.
   - Daily log history view (calendar day selector, past logs with edit/delete options).
   - Daily progress toward personal 10,000-step goal with animated circular or linear progress bar.
4. `src/app/coastal-walk/page.tsx`:
   - Seamless Next.js route alias / redirect to `/coastal`.
