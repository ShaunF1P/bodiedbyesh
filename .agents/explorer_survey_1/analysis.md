# Technical Analysis: Bodied by Esh Full-Stack Enhancement

**Author**: Explorer Agent 1 (Codebase & Feature Survey)  
**Date**: 2026-08-20  
**Scope**: Codebase structure, Client Workout Tracking, AI Nutrition Coaching (Requirement R2 & Acceptance Criteria), and Design System Compliance.

---

## 1. Executive Summary

The Bodied by Esh platform is built on Next.js 16.2.9 App Router with React 19.2.4, Supabase SSR/PostgreSQL, Google Generative AI (Gemini 3.5 Flash), Google MediaPipe Pose Vision, and Tailwind CSS v4.

This investigation evaluated the existing implementation of:
1. **Client Workout Tracking**: Exercise set logging, workout program display, admin workout assignment, and database schema (`workouts`, `workout_exercises`, `logged_sets`).
2. **AI Nutrition Coaching**: Remaining-budget-aware recipe generation (`/api/recommend-recipe` & `RecipeAdvisor`), visual food macro estimation (`/api/scan-meal` & `MealScanner`), restaurant menu scoring & swap recommendations (`/api/scan-menu` & `MenuAdvisor`), and Open Food Facts barcode lookup (`BarcodeScanner`).
3. **Architectural Gaps & Opportunities**: Identified 5 key enhancement areas to satisfy Requirement R2 and its Acceptance Criteria with high fidelity.

---

## 2. Codebase Architecture & Layout

### 2.1 Technology Stack
- **Framework**: Next.js 16.2.9 (App Router)
- **UI Library**: React 19.2.4, Tailwind CSS v4, Lucide React SVG Icons (`lucide-react` v1.18.0)
- **Database & Auth**: Supabase PostgreSQL with `@supabase/ssr` (v0.12.0) and `@supabase/supabase-js` (v2.108.2)
- **AI & Computer Vision**: Google Generative AI (`@google/generative-ai` v0.24.1), MediaPipe PoseLandmarker (`@mediapipe/tasks-vision` v0.10.35)
- **Payments**: Stripe (`stripe` v22.2.3)
- **Testing**: Playwright (`playwright` v1.62.1), Node test runner (`smoke_test_suite.mjs`)

### 2.2 Directory Map
```
src/
├── app/
│   ├── page.tsx                      # Main Landing Page
│   ├── dashboard/page.tsx            # Client Portal (Body, Nutrition, Recovery, Workout, Transformation, Video Coaching)
│   ├── calculator/page.tsx           # Fitness Intelligence Suite (12 clinical calculators)
│   ├── coastal/page.tsx              # Coastal Community Church #3266 Faith & Fitness Portal
│   ├── coastal-walk/page.tsx         # Route alias / redirect to /coastal
│   ├── login/page.tsx                # Client Authentication (Supabase Auth)
│   ├── apply/page.tsx                # Coaching Intake / Strategy Application Form
│   ├── park/page.tsx                 # Park-to-Peak program details & schedule
│   ├── admin/
│   │   ├── page.tsx                  # Coach Esh Admin Hub
│   │   ├── leads/page.tsx            # Inbound Leads Pipeline Table
│   │   └── park/page.tsx             # Park settings & schedule manager
│   ├── api/
│   │   ├── client/logged-sets/       # POST: Client set logging endpoint
│   │   ├── admin/workouts/           # GET/POST/DELETE: Admin workout assignment
│   │   ├── admin/client-profile/     # GET/POST/PATCH: Client roster & target configuration
│   │   ├── admin/leads/              # GET/PATCH/DELETE: Lead CRM
│   │   ├── recommend-recipe/         # POST: Gemini AI macro-budget recipe advisor
│   │   ├── scan-meal/                # POST: Gemini Vision food photo macro estimator
│   │   ├── scan-menu/                # POST: Gemini Vision menu macro analyzer & swap suggester
│   │   ├── log-meal/                 # POST/GET: Supabase meal logging
│   │   ├── chat/                     # POST: Client-to-coach messaging
│   │   ├── sync/health/              # GET/POST: Wearable & health tracker auto-sync
│   │   └── coastal/*                 # Steps, community stats, devotionals, join routes
│   └── globals.css                   # Obsidian Gold & Cyber Slate design tokens
├── components/
│   ├── Header.tsx                    # Global sticky navigation with safe-top insets
│   ├── Footer.tsx                    # Global footer with safe-bottom insets
│   ├── AdminClientSwitcher.tsx       # Coach assist & client impersonation bar
│   ├── RecipeAdvisor.tsx             # AI recipe generator with macro budget matching
│   ├── MealScanner.tsx               # Photo upload / camera feed food analyzer
│   ├── MenuAdvisor.tsx               # Restaurant menu photo analyzer
│   ├── BarcodeScanner.tsx            # Barcode scanner via BarcodeDetector + OpenFoodFacts
│   ├── BodyScanner.tsx               # MediaPipe 33-point body landmark & BF% detector
│   ├── TransformationStudio.tsx      # Before/after visual comparison studio
│   ├── CoachingVideoPlayer.tsx       # Video coaching library
│   ├── ChatWidget.tsx                # Floating real-time client chat
│   └── coastal/                      # Coastal church components (StepTracker, ScriptureCard, GroupProgress, etc.)
└── lib/
    ├── body-ai.ts                    # MediaPipe pose estimation & body composition math
    ├── fitness-calculators.ts        # 12 pure physiological calculation functions
    └── supabase/                     # Client and Server Supabase instances
```

---

## 3. Client Workout Tracking: Deep Dive

### 3.1 Existing Database Schema (`scratch/phase2_setup.sql`)
1. **`workouts`**:
   - `id` (uuid, PK)
   - `client_id` (uuid, references `client_profiles.id`)
   - `date` (date, YYYY-MM-DD)
   - `name` (text, e.g., "Leg Day Hypertrophy")
   - `notes` (text, Coach's instructions)
   - `created_at` (timestamptz)
2. **`workout_exercises`**:
   - `id` (uuid, PK)
   - `workout_id` (uuid, references `workouts.id` cascade)
   - `exercise_name` (text, e.g., "Barbell Back Squat")
   - `target_sets` (int, default 3)
   - `target_reps` (text, default '10')
   - `target_weight_lbs` (int, target load)
   - `order_index` (int, sequence order)
3. **`logged_sets`**:
   - `id` (uuid, PK)
   - `workout_exercise_id` (uuid, references `workout_exercises.id` cascade)
   - `set_index` (int, 0-indexed set position)
   - `reps_completed` (int)
   - `weight_lifted_lbs` (int)
   - `is_completed` (boolean, default false)
   - `logged_at` (timestamptz)

### 3.2 Existing API Route (`src/app/api/client/logged-sets/route.ts`)
- **Method**: `POST`
- **Authentication Barrier**: Validates Supabase session cookies via `supabase.auth.getUser()`. Returns `401 Unauthorized` if unauthenticated.
- **RLS & Ownership Verification**: Verifies that the targeted exercise belongs to a workout assigned to the requesting client's profile.
- **Upsert Logic**: Updates existing logged set row if found for `(workout_exercise_id, set_index)` or inserts a new row.
- **Response**: `{ success: true, data: { ...loggedSetRecord } }`.

### 3.3 Existing UI Implementation (`src/app/dashboard/page.tsx` - Workout Tab)
- Fetches today's scheduled workout using `.eq("client_id", profile.id).eq("date", todayDate)`.
- Displays exercise cards with exercise name, target sets/reps/weight, progress bar of completed sets (`completedSets / target_sets * 100`).
- Individual set row with inputs for `Reps` and `lbs` and an interactive check button.
- Check button initiates `handleLogSet`, updates local state optimistically, and renders a checkmark when complete.
- AI Form Check placeholder with joint angle analysis chips (Squat Depth, Knee Tracking, Back Angle, Hip Hinge).
- Weekly adherence calendar widget (Mon-Sun).

---

## 4. AI Nutrition Coaching: Deep Dive

### 4.1 AI Recipe Advisor (`src/app/api/recommend-recipe/route.ts` & `src/components/RecipeAdvisor.tsx`)
- **Engine**: Google Generative AI (`gemini-3.5-flash`) with structured JSON mode (`responseMimeType: "application/json"`).
- **Inputs**: `remainingMacros` (`calories`, `protein`, `carbs`, `fat`), `pantryIngredients` (optional string).
- **System Prompt Rules**:
  - Generated recipe macros MUST strictly be equal to or less than the client's remaining budget.
  - Prioritizes clean eating and high-quality protein density.
  - JSON output schema:
    ```json
    {
      "recipeName": "Title",
      "prepTime": "15 mins",
      "ingredients": ["150g raw chicken breast", "..."],
      "instructions": ["Step 1...", "Step 2..."],
      "macros": { "calories": 345.5, "protein": 42.0, "carbs": 38.5, "fat": 3.0 },
      "matchingAnalysis": "1-2 sentences explaining macro fit."
    }
    ```
- **Resilient Fallback**: If Gemini API key is missing or fails, generates a dynamic fallback recipe (*"Esh's Power Protein Skillet Bowl"*) dynamically scaled to the client's remaining protein and calorie numbers.
- **UI Presentation**:
  - Displays remaining budget badges (kcal, protein, carbs, fat).
  - Ingredient input field for custom pantry ingredients.
  - Glassmorphic card displaying recipe title, prep time, nutritional breakdown grid, ingredients list, and numbered step-by-step instructions.

### 4.2 AI Meal Scanner (`src/app/api/scan-meal/route.ts` & `src/components/MealScanner.tsx`)
- Accepts base64 image data from camera capture or photo upload.
- Utilizes Gemini Vision with conservative portion estimation and USDA FoodData Central standards.
- Returns identified food items with gram weights, calories, protein, carbs, fat, and confidence ratings (0-1.0).
- Allows 1-tap logging into daily macro totals and persists to Supabase `logged_meals` table.

### 4.3 Restaurant Menu AI (`src/app/api/scan-menu/route.ts` & `src/components/MenuAdvisor.tsx`)
- Analyzes restaurant menu photos against client's remaining daily macro budget.
- Categorizes dishes into:
  - `best_choice` (High protein-to-calorie ratio, fits remaining budget)
  - `acceptable` (Fits with minor tradeoffs)
  - `avoid` (Exceeds calorie/fat budget)
- Provides actionable swap tips (e.g. *"Get grilled instead of fried to save 18g fat"*).

### 4.4 Barcode Scanner (`src/components/BarcodeScanner.tsx`)
- Scans UPC/EAN barcodes using hardware-accelerated `BarcodeDetector` or manual UPC text input.
- Queries Open Food Facts database (3M+ items).
- Displays nutrition facts and enables 1-tap logging to the client's daily log.

---

## 5. Identified Gaps & Required Enhancements (Requirement R2)

Based on our survey against Requirement R2 and Acceptance Criteria:

| # | Item | Current State | Gap / Needed Enhancement | Recommended Implementation |
|---|------|---------------|--------------------------|----------------------------|
| **G1** | **Workout Session Volume & Summary** | Sets are logged individually; no aggregated workout summary. | Clients and coaches lack instant summary metrics (Total Volume / Tonnage in lbs, total sets completed, overall completion %). | Add a **Workout Summary Card** at the top/bottom of the workout tab calculating: `Total Volume = sum(reps * weight)`, `Sets Completed / Target Sets`, `Completion Rate (%)`, and celebration badge when 100% complete. |
| **G2** | **Workout Set History & Date Navigation** | Only today's workout (`date === todayDate`) is queried. | No UI to view past workouts or compare previous set weights across workout history. | Add a **Workout Date Selector / History Navigator** allowing clients to navigate to yesterday or previous dates to inspect logged sets and volume history. |
| **G3** | **1-Tap Log Recipe as Meal Integration** | RecipeAdvisor generates recipes, but requires manual re-entry to log to daily macros. | Disconnected workflow between AI recipe recommendation and daily macro tracker. | Add an **"Add to Today's Food Log"** action button in `RecipeAdvisor.tsx` that calls `onFoodLogged` / `/api/log-meal` with the recipe's macros. |
| **G4** | **Dietary Preference / Preset Filters for AI Recipes** | Recipe prompt only takes raw pantry text. | Clients cannot select dietary styles (e.g., High Protein, Low Carb / Keto, Quick Snack <15m, Post-Workout Anabolic). | Add quick **Dietary Preset Chips** (High Protein, Low Carb, Post-Workout, Under 15 Min) in `RecipeAdvisor` and pass to `/api/recommend-recipe`. |
| **G5** | **Admin Client Profile Query Alignment** | `admin/client-profile/route.ts` queries `logged_sets` with `.eq("user_id", idToUse)`. | In `phase2_setup.sql`, `logged_sets` is keyed on `workout_exercise_id` rather than `user_id`. | Update `admin/client-profile/route.ts` to join or query logged sets safely without failing if `user_id` column is omitted. |

---

## 6. Design System & Iconography Compliance

### 6.1 Obsidian Gold Design System Tokens
Verified in `src/app/globals.css`:
- `--t-surface`: `#050508` (Cyber Slate)
- `--t-glass`: `rgba(10, 10, 15, 0.85)` (Onyx Glass)
- `--t-card`: `#0E0E14` (Onyx Card)
- `--t-accent`: `#D4B87E` (Obsidian Gold / Accent Lime)
- `--t-violet`: `#C58B8B` (Rose Gold / Accent Violet)
- `--t-text`: `#FFFFFF` (Ice White)
- `--t-muted`: `#A0A5B5` (Silver Slate)

### 6.2 Safe-Area Insets & Responsive Multi-Device
- CSS variables `--sat`, `--sar`, `--sab`, `--sal` bound to `env(safe-area-inset-*)`.
- Utility classes `.safe-top`, `.safe-bottom`, `.safe-x`, `.safe-y`, `.safe-all` deployed on header, footer, modals, and container elements.
- Min 44px `.touch-target` applied across all mobile buttons and chips.

### 6.3 Iconography & Zero-Emoji Rule
- **100% Lucide React SVG icons** (`lucide-react` v1.18.0) used exclusively across all components.
- **Zero AI / unicode emojis** found in any UI copy, headings, or source code.

---

## 7. Verification & Smoke Test Matrix

The existing verification harness `smoke_test_suite.mjs` executes 14 automated tests:
1. Core Web Routes: `/`, `/apply`, `/dashboard`, `/coastal`, `/coastal-walk`, `/calculator`, `/brand-guide`, `/login`, `/admin`, `/admin/leads`, `/admin/park`
2. Coastal APIs: `/api/coastal/community`, `/api/coastal/devotionals`, `/api/coastal/steps`
3. Admin Security & PIN Barrier: `/api/admin/leads` (401 without PIN, 200 with PIN `0408`), `/api/admin/client-profile`, `/api/admin/workouts`
4. Health Sync Services: `/api/sync/health` (GET providers, POST Apple Health & Google Health Connect)
5. Client Workout & AI Services: `/api/park-config`, `/api/client/logged-sets` (401 barrier test), `/api/recommend-recipe` (POST test)

All tests are configured to validate against local (`http://localhost:3000`) or production URLs.
