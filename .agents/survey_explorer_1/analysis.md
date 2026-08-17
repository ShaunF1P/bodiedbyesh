# Technical Survey & Architecture Analysis
**Project:** BodiedbyEsh.com — Coastal Community Church (#3266) Faith & Fitness Walking & Step Tracker  
**Author:** Survey Explorer 1  
**Date:** 2026-08-17  
**Integrity Mode:** Development (Read-Only Survey)

---

## 1. Executive Summary

This survey analyzes the existing BodiedbyEsh.com production codebase to establish technical specifications and integration pathways for the Coastal Community Church (#3266) Faith & Fitness Walking and Step Tracker section (`/coastal` / `/coastal-walk`).

The codebase is built on Next.js 16.2.9 (App Router) with React 19.2.4, TypeScript 5, Tailwind CSS v4, and Supabase SSR authentication with Row Level Security (RLS). The design system features an obsidian gold/rose gold dark-mode aesthetic with custom safe-area utilities, smooth cubic-bezier transitions, and exclusively Lucide SVG icons (zero emojis).

---

## 2. Next.js & Build System Configuration

| Configuration | Value | Details / Observations |
|---|---|---|
| **Next.js Version** | `16.2.9` | App Router paradigm (`src/app/`) |
| **React Version** | `19.2.4` / `react-dom: 19.2.4` | Fully compatible with Server and Client components |
| **TypeScript** | `^5` | Strict mode enabled, `moduleResolution: "bundler"`, path alias `@/*` -> `./src/*` |
| **Tailwind CSS** | `^4` (with `@tailwindcss/postcss: ^4`) | Tailwind v4 architecture with `@theme` CSS variable tokens in `globals.css` |
| **PostCSS** | `postcss.config.mjs` | Configured with `@tailwindcss/postcss` plugin |
| **ESLint** | `eslint.config.mjs` | Flat config extending `core-web-vitals` and `typescript` from `eslint-config-next` |
| **Security Headers** | `next.config.ts` | CSP headers with permissions for Supabase, Stripe, Google Fonts; `poweredByHeader: false`; `X-Frame-Options: SAMEORIGIN` |
| **PWA & Mobile** | `src/app/layout.tsx` | Viewport `viewportFit: "cover"`, `maximumScale: 5`, mobile web app standalone tags, FOWT theme preloader script |

---

## 3. Directory Structure & Codebase Map

```
c:/projects/BodiedbyEsh/
├── .agents/                      # Teamwork agent metadata
│   ├── ORIGINAL_REQUEST.md       # Root project prompt & requirements
│   ├── orchestrator_1/
│   ├── sentinel/
│   ├── survey_explorer_1/        # This agent workspace
│   ├── survey_explorer_2/
│   └── survey_spec_miner/
├── data/
│   └── park-config.json          # Dynamic config for park schedule & location
├── public/
│   ├── coach_esh_park.png        # Coach photo assets
│   ├── logos/                    # Flat SVG and 3D PNG brand marks
│   ├── mockups/                  # UI mockup references
│   └── smoke-test.html           # In-browser iframe smoke test runner
├── src/
│   ├── middleware.ts             # Case-insensitive routing + Supabase SSR session guard
│   ├── app/
│   │   ├── layout.tsx            # Root layout (Inter + Space Grotesk, theme injector)
│   │   ├── globals.css           # Tailwind v4 theme variables, glassmorphism, safe-areas
│   │   ├── page.tsx              # Public home page
│   │   ├── login/page.tsx        # Client portal authentication (Supabase Auth)
│   │   ├── dashboard/page.tsx    # Member dashboard (Body, Nutrition, Recovery, Workout)
│   │   ├── park/page.tsx         # Track A Park-to-Peak program landing page
│   │   ├── calculator/page.tsx   # 12 fitness & recomp calculators
│   │   ├── apply/page.tsx        # Multi-step coaching application & checkout
│   │   ├── success/page.tsx      # Post-checkout confirmation
│   │   ├── brand-guide/page.tsx  # Interactive brand design guide
│   │   ├── logo-review/page.tsx  # PIN-protected logo review portal
│   │   ├── admin/                # 4-digit PIN gated admin panel
│   │   │   ├── layout.tsx        # PIN verification & navigation sidebar
│   │   │   ├── page.tsx          # Admin overview
│   │   │   ├── leads/page.tsx    # Coaching lead pipeline management
│   │   │   └── park/page.tsx     # Live park schedule/location editor
│   │   └── api/                  # API Route Handlers (REST)
│   │       ├── admin/            # Admin leads, workouts, client profile
│   │       ├── book-appointment/# Appointment booking
│   │       ├── chat/             # Client-to-coach realtime messaging
│   │       ├── client/logged-sets# Workout set logging with RLS check
│   │       ├── ghl-contact/      # GoHighLevel CRM integration
│   │       ├── log-meal/         # Meal logging
│   │       ├── park-config/      # Park configuration GET/PUT
│   │       ├── scan-meal/        # Gemini Vision food photo analyzer
│   │       ├── scan-menu/        # Gemini Vision menu analyzer
│   │       ├── recommend-recipe/ # Gemini macro recipe suggestions
│   │       └── webhook/stripe/   # Stripe checkout and subscription webhook
│   ├── components/               # Reusable React components
│   │   ├── Header.tsx            # Sticky glass header with mobile drawer & theme toggle
│   │   ├── Footer.tsx            # Brand footer with location & social links
│   │   ├── Logo.tsx              # Primary brand logo component
│   │   ├── ThemeToggle.tsx       # Light/dark mode toggle with localStorage sync
│   │   ├── AnimateIn.tsx         # IntersectionObserver slide/fade animation
│   │   ├── RollingCounter.tsx    # Cubic ease-out numerical counter
│   │   ├── ChatWidget.tsx        # Realtime WebSocket chat widget (Supabase Realtime)
│   │   ├── BodyScanner.tsx       # MediaPipe Pose landmark scanner
│   │   ├── MealScanner.tsx       # AI photo meal tracker
│   │   ├── BarcodeScanner.tsx    # Open Food Facts barcode lookup
│   │   ├── MenuAdvisor.tsx       # Restaurant menu photo analyzer
│   │   ├── RecipeAdvisor.tsx     # Macro recipe assistant
│   │   └── FaqAccordion.tsx      # Expandable FAQ accordion
│   └── lib/
│       ├── fitness-calculators.ts# Pure physiologist-grade fitness calculation formulas
│       ├── body-ai.ts            # MediaPipe Pose Landmarker WASM engine
│       ├── ghl.ts                # GoHighLevel API client
│       ├── mail.ts               # Email dispatch client
│       ├── sms.ts                # SMS dispatch client
│       ├── stripe.ts             # Stripe SDK helper
│       └── supabase/
│           ├── client.ts         # Browser-side createBrowserClient (@supabase/ssr)
│           └── server.ts         # Server-side createServerClient with cookie handling
└── scratch/                      # Database migration SQL and scratch scripts
    ├── database_setup.sql        # Client profiles RLS & case-insensitive trigger
    └── phase2_setup.sql          # Workouts, exercises, logged sets, chat RLS schema
```

---

## 4. Authentication, Middleware & Supabase Integration

### 4.1 Client vs. Server Supabase Helpers
- **Browser Client (`src/lib/supabase/client.ts`)**:
  - Uses `createBrowserClient` from `@supabase/ssr`.
  - Reads `process.env.NEXT_PUBLIC_SUPABASE_URL` and `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Server Client (`src/lib/supabase/server.ts`)**:
  - Uses `createServerClient` from `@supabase/ssr` with Next.js `cookies()` store from `next/headers`.
  - Provides `getAll` and `setAll` cookie handlers for SSR session refresh.
- **Service Role Client (API Routes)**:
  - Uses `createClient` from `@supabase/supabase-js` with `SUPABASE_SERVICE_ROLE_KEY` for administrative queries and batch aggregations.

### 4.2 Middleware Architecture (`src/middleware.ts`)
- Case-insensitivity check: auto-redirects uppercase URLs to lowercase equivalents.
- Auth session refresh: initializes SSR Supabase client to sync cookies across requests.
- Route protection: `/dashboard` redirects unauthenticated users or unverified email accounts to `/login?verified=false`.
- Redirects authenticated users accessing `/login` straight to `/dashboard`.

### 4.3 Database Schema & RLS Patterns
Existing database tables and RLS policies in `scratch/database_setup.sql` and `scratch/phase2_setup.sql` follow strict isolation:
1. `client_profiles`: Authenticated users can only read/update/insert rows where `auth.uid() = user_id`.
2. `workouts`: Authenticated users can only read workouts where `auth.uid() = client_id`.
3. `workout_exercises`: Users can only query exercises associated with workouts owned by their `client_id`.
4. `logged_sets`: Users can only access and log sets for exercises they own.
5. `chat_messages`: Users can only access messages where `auth.uid() = client_id`.
6. Realtime WebSockets: `ChatWidget.tsx` demonstrates `supabase.channel('chat_messages:client_id=eq.${clientId}')` for real-time Postgres change listening.

---

## 5. UI System, Styling, Icons & Safe Areas

### 5.1 Color Palette & Theme System (`src/app/globals.css`)
Tailwind v4 utilizes CSS variable indirection:

```css
:root {
  --t-surface: #050508;              /* Obsidian Black */
  --t-glass: rgba(10, 10, 15, 0.85); /* Onyx Glass */
  --t-card: #0E0E14;                 /* Onyx Card */
  --t-accent: #D4B87E;               /* Obsidian / Liquid Gold */
  --t-violet: #C58B8B;               /* Brushed Rose Gold */
  --t-text: #FFFFFF;                 /* Ice White */
  --t-muted: #A0A5B5;                /* Soft Silver Slate */
  
  /* Safe Area Insets */
  --sat: env(safe-area-inset-top, 0px);
  --sar: env(safe-area-inset-right, 0px);
  --sab: env(safe-area-inset-bottom, 0px);
  --sal: env(safe-area-inset-left, 0px);
}
```

Light mode overrides are configured under `html.light` with `--t-surface: #FBFBFD`, `--t-accent: #C59B27`, and `--t-violet: #B07474`.

### 5.2 Typography
- **Display / Titles:** `Space_Grotesk` (configured as `--font-space-grotesk` / `font-display`).
- **Body / Interface:** `Inter` (configured as `--font-inter` / `font-sans`).

### 5.3 Safe Area Utilities & Layout Helpers
- Classes: `.safe-top`, `.safe-bottom`, `.safe-left`, `.safe-right`, `.safe-x`, `.safe-y`, `.safe-all`.
- Responsive container: `.page-container` (max-width 1400px with safe area insets).
- Touch target: `.touch-target` (minimum 44px by 44px).
- Glassmorphism: `.glass-panel`, `.glass-panel-lime`, `.glass-panel-violet`.
- Animations: `.animate-fadeIn`, `.animate-scaleUp`, `AnimateIn` wrapper, `RollingCounter`.

### 5.4 Iconography & Strict No-Emoji Constraint
- The codebase uses **Lucide React (`lucide-react`)** exclusively.
- Strict constraint: **Zero emojis** in UI copy, titles, buttons, or metadata. All visual symbols use Lucide SVG components.

---

## 6. Testing, Automation & Build Verification

- **Package Scripts:**
  - `npm run dev`: Starts local development server on port 3000.
  - `npm run build`: Compiles TypeScript and Next.js production build.
  - `npm run lint`: Runs ESLint 9 with Next.js core web vitals and TypeScript rules.
- **QA Smoke Test Suite (`public/smoke-test.html`):**
  - Standalone in-browser test runner validating layout, responsive viewports, route availability, and header components.
- **Automated Screenshot Scripts (`take_screenshots.mjs`, `capture_both.mjs`):**
  - Playwright scripts for visual validation of components and brand pages.

---

## 7. Technical Recommendations for Coastal Community Church (#3266)

### 7.1 Proposed Route Structure
1. `/coastal` or `/coastal-walk`:
   - Dedicated entrance route for Coastal Community Church Group #3266.
   - Welcoming community portal showcasing group walking stats, daily devotional, leaderboard highlights, and quick step logger.
2. `/api/coastal/steps`:
   - API endpoint for logging steps, distance, active minutes, and calculating streaks.
3. `/api/coastal/community`:
   - Endpoint returning aggregate group statistics (total collective steps, mileage progress toward faith milestones, active walkers, encouragement wall notes).
4. `/api/coastal/devotional`:
   - Endpoint providing the daily scripture, reflection prompt, and faith milestone status.

### 7.2 Database Schema & Security (RLS) Specification
To support individual privacy and public aggregate metrics, the following schema is recommended:

```sql
-- 1. Coastal Group Profiles / Membership
CREATE TABLE IF NOT EXISTS public.coastal_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id text NOT NULL DEFAULT 'coastal-3266',
  display_name text NOT NULL,
  email text NOT NULL,
  daily_step_goal int DEFAULT 8000 NOT NULL,
  total_steps int DEFAULT 0 NOT NULL,
  current_streak_days int DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, group_id)
);

-- 2. Daily Step Logs (Private)
CREATE TABLE IF NOT EXISTS public.coastal_step_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  group_id text NOT NULL DEFAULT 'coastal-3266',
  date date NOT NULL,
  steps int NOT NULL CHECK (steps >= 0),
  miles numeric(5,2) GENERATED ALWAYS AS (ROUND((steps * 0.00045)::numeric, 2)) STORED,
  active_minutes int DEFAULT 0,
  notes text,
  logged_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, date)
);

-- 3. Daily Scripture & Devotionals
CREATE TABLE IF NOT EXISTS public.coastal_devotionals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date date UNIQUE NOT NULL,
  verse_reference text NOT NULL,
  verse_text text NOT NULL,
  reflection_title text NOT NULL,
  reflection_body text NOT NULL,
  action_step text NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Community Encouragement Feed
CREATE TABLE IF NOT EXISTS public.coastal_encouragements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  group_id text NOT NULL DEFAULT 'coastal-3266',
  author_name text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Enable RLS
ALTER TABLE public.coastal_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coastal_step_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coastal_devotionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coastal_encouragements ENABLE ROW LEVEL SECURITY;

-- 6. Strict RLS Policies
-- Step Logs: Member can only view and mutate their own step logs
CREATE POLICY "coastal_steps_owner_all" ON public.coastal_step_logs
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Group Members: Members can view directory display names, manage their own profile
CREATE POLICY "coastal_members_select" ON public.coastal_members
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "coastal_members_modify" ON public.coastal_members
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Devotionals: Public / Authenticated read-only
CREATE POLICY "coastal_devotionals_read" ON public.coastal_devotionals
  FOR SELECT TO authenticated, anon
  USING (true);

-- Encouragements: Authenticated read & write
CREATE POLICY "coastal_encouragements_select" ON public.coastal_encouragements
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "coastal_encouragements_insert" ON public.coastal_encouragements
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

### 7.3 Component Architecture Plan
Create module directory `src/components/coastal/`:
- `CoastalHero.tsx`: Group identity banner, welcome message, call to action.
- `StepTracker.tsx`: Interactive step logger, daily progress ring, mileage converter, streak indicator.
- `ScriptureCard.tsx`: "Walking by Faith" daily verse and devotional reflection card with shareable excerpt.
- `GroupProgress.tsx`: Communal step accumulator, aggregate journey miles, and milestone unlock progress bar (e.g. 50k, 100k, 250k, 500k collective steps).
- `EncouragementFeed.tsx`: Community note board with realtime message additions.
- `CoastalAuthModal.tsx`: Streamlined login/registration modal linking members to Group #3266.

---

## 8. Conclusion

The BodiedbyEsh codebase has a clean, modern Next.js 16 + React 19 + Tailwind v4 + Supabase architecture that provides all required primitives for the Coastal Community Church walking group tracker. The integration will leverage existing Supabase client utilities, theme variables, glassmorphism styling, safe-area utilities, and Lucide icons without requiring any disruptive changes to the core platform.
