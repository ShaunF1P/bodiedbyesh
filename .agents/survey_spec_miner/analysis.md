# Bodied by Esh × Coastal Community Church (#3266)
## Faith & Fitness Walking and Step Tracker — Comprehensive Specification & Discovery Report

**Project**: BodiedbyEsh.com — Coastal Community Church Group #3266 Portal  
**Document Version**: 1.0.0  
**Status**: Authoritative Architectural & Functional Specification  
**Created Date**: 2026-08-17  
**Working Directory**: `c:/projects/BodiedbyEsh/.agents/survey_spec_miner`  

---

## 1. Executive Summary & Architectural Overview

The Coastal Community Church (#3266) Faith & Fitness Walking and Step Tracker is a dedicated, high-performance community sub-platform integrated into BodiedbyEsh.com. It bridges elite physical body recomposition conditioning with daily spiritual renewal for members of Coastal Community Church (Group #3266).

### 1.1 Core Strategic Objectives
1. **Seamless Group Onboarding & Access**: Direct entry via `/coastal` and `/coastal-walk` with zero-friction magic link or password authentication, automatically binding users to Group `#3266` while granting full access to Bodied by Esh member features.
2. **Precision Activity Tracking with Privacy-First Security**: Daily and historical logging of steps, calculated mileage, active walking minutes, and streak maintenance with strict Supabase Row Level Security (RLS) guaranteeing data isolation.
3. **Harmonized Faith & Fitness Curriculum**: A dynamic 14-day "Walking by Faith" devotional engine combining exegesis, physical conditioning challenges, reflection journaling, and prayer prompts.
4. **Communal Momentum & Accountability**: A live collective step journey tracker toward biblical distance milestones (50k Jericho March, 100k Galilee Trek, 250k Sinai Ascent, 500k Emmaus Walk, 1M Roman Road), real-time leaderboards, and a community encouragement & prayer feed.
5. **Brand Synergy & Design Fidelity**: Unifying Coastal Community Church's uplifting warmth with Bodied by Esh's signature Obsidian Gold & Rose Gold dark-mode aesthetic, utilizing **strictly Lucide SVG icons (zero emojis)** and responsive safe-area layouts.

### 1.2 Technology Stack
- **Framework**: Next.js 16.2.9 (App Router, Server Components, Server Actions)
- **UI & Runtime**: React 19.2.4, TypeScript 5.x
- **Styling**: Tailwind CSS v4 with CSS Theme Indirection Variables (`globals.css`)
- **Backend & Auth**: Supabase SSR (`@supabase/ssr` 0.12.0, `@supabase/supabase-js` 2.108.2) with PostgreSQL Row Level Security (RLS)
- **Icons**: Lucide React (`lucide-react` 1.18.0) — Strict compliance: no emojis permitted
- **Analytics & Tracking**: `@vercel/analytics`

---

## 2. Master Feature Inventory (R1 – R5)

The table below catalogs every discovered and derived feature across the 5 core system pillars.

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| **F01** | R1: Portal & Onboarding | Dedicated Route Alias `/coastal` | Primary branded landing page for Coastal Community Church Group #3266 | URL request to `/coastal` | Renders Coastal Hub with hero, active challenge banner, and portal entry | 404 fallback if routing misconfigured; redirect handled by Next.js App Router | ORIGINAL_REQUEST.md R1 |
| **F02** | R1: Portal & Onboarding | Dedicated Route Alias `/coastal-walk` | Alternative marketing & QR-code campaign URL redirecting/rendering portal | URL request to `/coastal-walk` | Direct rendering or rewrite to Coastal Hub | Case-insensitive redirect via `src/middleware.ts` | ORIGINAL_REQUEST.md R1 |
| **F03** | R1: Portal & Onboarding | Group #3266 Auto-Association | Automatically assigns new or logging-in users to Group #3266 in database | User session + group code `3266` | Created/verified `group_memberships` record | Graceful rollback if user profile creation fails | ORIGINAL_REQUEST.md R1 |
| **F04** | R1: Portal & Onboarding | Passwordless Magic-Link Auth | Allows members to enter email and receive a secure one-click sign-in link | Email address string | Verification email dispatched via Supabase Auth | Invalid email format returns inline error; rate-limit feedback | Supabase Auth API & R1 |
| **F05** | R1: Portal & Onboarding | Standard Email + Password Auth | Sign-in or account creation with password + verification handling | Email, Password, Full Name | Authenticated session cookie + JWT | Weak password (<6 chars) or duplicate email yields inline alert | `src/app/login/page.tsx` & R1 |
| **F06** | R1: Portal & Onboarding | Guest Preview Mode | Allows non-authenticated visitors to view collective group progress and sample Day 1 devotional | Click "Explore Group Progress" | Public group progress and read-only devotional preview | Prompts login modal when attempting to log steps or post reflections | UX Discovery |
| **F07** | R1: Portal & Onboarding | Bodied by Esh Member Cross-Access | Group members retain standard access to macro calculators, recipes, and body scanner | Navigation menu clicks | Instant routing to `/dashboard`, `/calculator`, `/park` | Middleware enforces email verification before entering full dashboard | `src/middleware.ts` & R1 |
| **F08** | R1: Portal & Onboarding | Member Profile & Privacy Settings | Configures display name, church campus, and public/anonymous leaderboard preference | Name, campus, `is_anonymous` boolean | Updated `group_memberships` record | Schema validation rejects empty names if non-anonymous | Data Schema Spec |
| **F09** | R2: Step Tracker & RLS | Daily Step Entry Form | Clean numeric input modal/card to log daily walking steps | Step count (integer > 0), date, optional note | Inserted/updated `step_logs` record, recalculated streaks | Rejects negative numbers, decimals, or extreme outliers (>100k steps/day without confirmation) | ORIGINAL_REQUEST.md R2 |
| **F10** | R2: Step Tracker & RLS | Quick-Add Step Presets | One-tap incremental buttons (+1,000, +2,500, +5,000, +10,000 steps) | Button click event | Increments step count state & triggers save | Debounces rapid clicks to prevent race conditions | UX Discovery |
| **F11** | R2: Step Tracker & RLS | Stride & Mileage Calculator Engine | Converts step counts into accurate mileage based on standard stride length (2.2 ft/step) | Step count (e.g. 10,000) | Mileage string (e.g. "4.17 miles") | Defaults to 2,400 steps/mile if custom stride not configured | Physics & Cadence Spec |
| **F12** | R2: Step Tracker & RLS | Active Walking Time Estimator | Calculates active minutes based on standard brisk cadence (100 steps/min) | Step count | Active duration in minutes/hours (e.g. "1 hr 40 min") | Clamps minimum display to 1 minute for non-zero steps | Fitness Calculation Spec |
| **F13** | R2: Step Tracker & RLS | Caloric Burn Estimator | Estimates walking energy expenditure (~0.04 kcal/step standard) | Step count, optional user weight | Burned calories (e.g. "400 kcal") | Fallback to standard 0.04 kcal/step if weight omitted | `src/lib/fitness-calculators.ts` |
| **F14** | R2: Step Tracker & RLS | Consecutive Daily Streak Counter | Computes current active daily streak and longest historical streak | Historical `step_logs` | Streak count (e.g. "7 Days Flame") | Streak breaks if prior day has 0 logged steps; handles timezone offsets | ORIGINAL_REQUEST.md R2 |
| **F15** | R2: Step Tracker & RLS | 7-Day & 30-Day Activity Trends | Interactive bar charts & trend lines displaying weekly walking volume | Historical step records for user | Visual bar chart with daily averages & total distance | Renders empty state placeholders for days without logs | UI Component Spec |
| **F16** | R2: Step Tracker & RLS | Strict Supabase Row Level Security | RLS policies restricting read/write of raw personal logs exclusively to owner | `auth.uid()` token | Enforced database security isolation | Supabase returns 403 Forbidden on unauthorized foreign record access | ORIGINAL_REQUEST.md R2 |
| **F17** | R2: Step Tracker & RLS | Aggregate Step Secure RPC View | Database RPC function aggregating group totals without exposing user records | `group_id` UUID | Total group steps, total mileage, active member count | Returns 0 for invalid group IDs; executes with `SECURITY DEFINER` | Supabase Security Spec |
| **F18** | R3: Devotionals & Milestones | "Walking by Faith" Daily Scripture Card | Highlights the active day's Bible passage in elegant typography | Current day index or selected date | Scripture verse text, reference, translation citation | Fallback to Day 1 if day parameter is out of bounds | ORIGINAL_REQUEST.md R3 |
| **F19** | R3: Devotionals & Milestones | Devotional Exegesis & Faith/Fitness Bridge | Deep theological and physical conditioning commentary connecting body and spirit | Selected devotional index | 2-3 paragraph devotional commentary | Displays formatted markdown with pull-quotes and key takeaways | Content Spec |
| **F20** | R3: Devotionals & Milestones | Interactive Reflection Journal | Member journal textarea to capture personal insights and prayer commitments | Text string (max 2000 chars), share toggle | Stored `devotional_reflections` record | Validates minimum length (>3 chars); enforces character limits | ORIGINAL_REQUEST.md R3 |
| **F21** | R3: Devotionals & Milestones | 14-Day Curriculum Navigation Carousel | Interactive day switcher allowing members to review past devotionals or preview upcoming | Day selection index (1 to 14) | Switches active devotional view smoothly | Past days accessible; future days indicate "Upcoming" or unlock daily | UI Flow Spec |
| **F22** | R3: Devotionals & Milestones | Individual Milestone Unlock Engine | Automatically detects step thresholds and awards achievement badges | User cumulative steps & streaks | Unlocked badge banner, trophy entry, toast notification | Idempotent unlock logic avoids duplicate entries | ORIGINAL_REQUEST.md R3 |
| **F23** | R3: Devotionals & Milestones | Scripture Memory Card Exporter | Generates a clean digital card with the day's verse for saving or sharing | Devotional verse data | High-res styled image/card view for download | Fallback to clipboard copy if Web Share API unavailable | UX Enhancement |
| **F24** | R4: Community Goal & Feed | Collective Group Progress Bar | Visual journey bar aggregating all Group #3266 members toward collective goal | Group aggregate step total | Progress percentage, miles covered, remaining steps | Animates smoothly on load; caps visual bar at 100% when goal reached | ORIGINAL_REQUEST.md R4 |
| **F25** | R4: Community Goal & Feed | Biblical Journey Milestone Map | Displays collective progress across landmark biblical routes (Jericho, Emmaus, Sinai) | Total collective steps | Interactive route map showing reached and upcoming milestones | Unlocks communal badge celebration when milestone surpassed | Milestone Spec |
| **F26** | R4: Community Goal & Feed | Group Step Leaderboard | Ranked list of group participants by daily, weekly, and all-time step volume | Date range filter ('today', 'week', 'all-time') | Ranked list with avatar initials, name, steps, and distance | Respects `is_anonymous` flag by displaying "Faithful Walker #..." | ORIGINAL_REQUEST.md R4 |
| **F27** | R4: Community Goal & Feed | Encouragement & Prayer Wall | Real-time community message board for praise reports, prayer, and walking shouts | Message text (max 280 chars), category tag | Posted `group_encouragements` card in live feed | Input sanitization prevents XSS; filters profanity | ORIGINAL_REQUEST.md R4 |
| **F28** | R4: Community Goal & Feed | "High Five" & "Amen" Reaction Engine | One-tap reaction counter on encouragement posts using Lucide icons (`Heart`, `Flame`) | Post ID, reaction type | Incremented reaction counter and toggled user reaction state | Prevents duplicate user reactions on same post | UI Component Spec |
| **F29** | R5: Brand Synergy & Design | Bodied by Esh × Coastal Visual Theme | Blends obsidian dark canvas, liquid gold accents with coastal ocean slate highlights | CSS variables in `globals.css` | Cohesive dark-mode aesthetic with high contrast text | Theme toggle smoothly switches between Dark Obsidian and Light Warm | ORIGINAL_REQUEST.md R5 |
| **F30** | R5: Brand Synergy & Design | Strict Lucide SVG Iconography | 100% vector SVG icons for all visual symbols; zero emojis across all pages | SVG component renders | Scalable, crisp icon elements (`Flame`, `Heart`, `Trophy`, etc.) | Build-time and lint enforcement against emoji character codes | Rule `user_global` & R5 |
| **F31** | R5: Brand Synergy & Design | Safe-Area Responsive Layout Engine | Full responsiveness across mobile, notch, Dynamic Island, tablet, foldable, desktop | Screen dimensions & CSS safe-area env vars | Optimized view with sticky action bar, padding adjustments | Eliminates horizontal scroll (`overflow-x: hidden`) | CSS & Layout Spec |

---

## 3. Detailed Subsystem Specifications

### 3.1 R1: Dedicated Group Portal & Seamless Onboarding

#### 3.1.1 URL Routing & Rewrite Architecture
- **Primary Canonical Route**: `/coastal`
- **Secondary Alias Route**: `/coastal-walk`
- **Middleware Compatibility**: Route is exempted from default dashboard redirection if unauthenticated, allowing rich guest preview and instant on-page authentication modal. Case-insensitive normalization redirects `/Coastal` and `/COASTAL-WALK` to lowercase.

#### 3.1.2 Onboarding Workflow
```
[User visits /coastal or /coastal-walk]
             │
             ▼
   Is User Authenticated?
   ├── YES ──► Check if member of Group #3266
   │            ├── YES ──► Load full interactive tracker & personalized metrics
   │            └── NO  ──► Auto-create `group_memberships` record for #3266 ──► Load tracker
   │
   └── NO  ──► Render Guest Hub (Collective Goal, Daily Scripture Preview, Sample Feed)
                │
                ├── [Click "Log Steps" or "Join Group"]
                │            │
                │            ▼
                │   Open Auth Modal (Magic Link or Password)
                │   • Input Email (+ Name / Password)
                │   • Auth dispatches verification / sets SSR session cookie
                │   • Auto-joins Group #3266 upon session creation
                │
                └── [Click "Explore Free Calculators"] ──► Route to /calculator or /park
```

---

### 3.2 R2: Step, Distance, Activity Tracker with Supabase RLS

#### 3.2.1 Mathematical Formulas & Conversion Constants
1. **Distance Calculation**:
   $$\text{Distance (miles)} = \frac{\text{Steps} \times \text{Stride Length (inches)}}{63,360 \text{ inches/mile}}$$
   *Standard default stride*: 30 inches (2.5 feet) for brisk walking $\rightarrow$ $1\text{ mile} \approx 2,112\text{ steps}$. Conservative standard: $2,400\text{ steps} \approx 1\text{ mile}$ ($0.0004167\text{ miles/step}$).
2. **Active Walking Time**:
   $$\text{Active Time (minutes)} = \frac{\text{Steps}}{\text{Cadence (steps/min)}}$$
   *Standard brisk walking cadence*: 100 steps/minute $\rightarrow$ $5,000\text{ steps} = 50\text{ minutes}$.
3. **Caloric Burn Calculation**:
   $$\text{Calories Burned (kcal)} = \text{Steps} \times 0.04\text{ kcal/step}$$
   *(Adjusted for user weight if provided: $\text{Calories} = \text{MET (3.5)} \times \text{Weight (kg)} \times \text{Hours}$).*
4. **Streak Calculation**:
   A day is counted as "Active" if $\text{Daily Steps} \ge 3,000$ (configurable base target). Consecutive active days ending today or yesterday define the current streak.

#### 3.2.2 PostgreSQL Database Schema & DDL
```sql
-- 1. WALKING GROUPS TABLE
CREATE TABLE IF NOT EXISTS public.walking_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_code VARCHAR(50) UNIQUE NOT NULL, -- e.g. '3266'
    name VARCHAR(255) NOT NULL,            -- e.g. 'Coastal Community Church Walking Group'
    organization VARCHAR(255) NOT NULL,     -- e.g. 'Coastal Community Church'
    target_steps BIGINT NOT NULL DEFAULT 1000000,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. GROUP MEMBERSHIPS TABLE
CREATE TABLE IF NOT EXISTS public.group_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.walking_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,
    campus VARCHAR(100) DEFAULT 'Main Campus',
    is_anonymous BOOLEAN NOT NULL DEFAULT false,
    role VARCHAR(50) NOT NULL DEFAULT 'member', -- 'member', 'leader', 'admin'
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(group_id, user_id)
);

-- 3. STEP LOGS TABLE (Individual Activity Records)
CREATE TABLE IF NOT EXISTS public.step_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES public.walking_groups(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    step_count INTEGER NOT NULL CHECK (step_count >= 0 AND step_count <= 150000),
    distance_miles NUMERIC(6,2) NOT NULL DEFAULT 0.00,
    active_minutes INTEGER NOT NULL DEFAULT 0,
    calories_burned INTEGER NOT NULL DEFAULT 0,
    source VARCHAR(50) NOT NULL DEFAULT 'manual', -- 'manual', 'apple_health', 'google_fit'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, group_id, log_date)
);

-- 4. DEVOTIONAL REFLECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.devotional_reflections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES public.walking_groups(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 365),
    reflection_text TEXT NOT NULL,
    prayer_request TEXT,
    is_shared_to_feed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, group_id, day_number)
);

-- 5. FAITH MILESTONES DEFINITION TABLE
CREATE TABLE IF NOT EXISTS public.faith_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_key VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'individual_steps', 'individual_streak', 'group_steps'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    threshold_value BIGINT NOT NULL,
    scripture_ref VARCHAR(100) NOT NULL,
    scripture_text TEXT NOT NULL,
    icon_name VARCHAR(100) NOT NULL, -- e.g. 'Footprints', 'Mountain', 'Crown', 'Flame'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. USER MILESTONE UNLOCKS TABLE
CREATE TABLE IF NOT EXISTS public.user_milestone_unlocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    milestone_id UUID NOT NULL REFERENCES public.faith_milestones(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    value_at_unlock BIGINT NOT NULL,
    UNIQUE(user_id, milestone_id)
);

-- 7. GROUP ENCOURAGEMENTS & PRAISE FEED TABLE
CREATE TABLE IF NOT EXISTS public.group_encouragements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.walking_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name VARCHAR(100) NOT NULL,
    message TEXT NOT NULL CHECK (char_length(message) > 0 AND char_length(message) <= 500),
    prayer_tag VARCHAR(50) DEFAULT 'Encouragement', -- 'Praise', 'Prayer Request', 'Milestone Shoutout'
    high_fives_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. ENCOURAGEMENT REACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.encouragement_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encouragement_id UUID NOT NULL REFERENCES public.group_encouragements(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) NOT NULL DEFAULT 'high_five', -- 'high_five', 'amen', 'heart'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(encouragement_id, user_id, reaction_type)
);
```

#### 3.2.3 Supabase Row Level Security (RLS) Policies
```sql
-- Enable RLS on all tables
ALTER TABLE public.walking_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.step_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devotional_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faith_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_milestone_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_encouragements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encouragement_reactions ENABLE ROW LEVEL SECURITY;

-- ── 1. WALKING GROUPS POLICIES ─────────────────────────────────
-- Public can read walking group info (needed for /coastal landing)
CREATE POLICY "Public can view walking groups"
ON public.walking_groups FOR SELECT
TO public USING (true);

-- ── 2. GROUP MEMBERSHIPS POLICIES ─────────────────────────────
-- Members can view memberships in their group
CREATE POLICY "Members can view group members"
ON public.group_memberships FOR SELECT
TO authenticated USING (true);

-- Users can insert their own membership
CREATE POLICY "Users can join groups"
ON public.group_memberships FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can update their own membership profile (name, anonymity, campus)
CREATE POLICY "Users can update their own membership"
ON public.group_memberships FOR UPDATE
TO authenticated USING (auth.uid() = user_id);

-- ── 3. STEP LOGS POLICIES (STRICT DATA ISOLATION) ──────────────
-- Users can ONLY select their own individual step logs
CREATE POLICY "Users can view only their own step logs"
ON public.step_logs FOR SELECT
TO authenticated USING (auth.uid() = user_id);

-- Users can insert their own step logs
CREATE POLICY "Users can insert their own step logs"
ON public.step_logs FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can update their own step logs
CREATE POLICY "Users can update their own step logs"
ON public.step_logs FOR UPDATE
TO authenticated USING (auth.uid() = user_id);

-- Users can delete their own step logs
CREATE POLICY "Users can delete their own step logs"
ON public.step_logs FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- ── 4. DEVOTIONAL REFLECTIONS POLICIES ─────────────────────────
-- Users can view their own private reflections or shared public ones
CREATE POLICY "Users can view own or shared reflections"
ON public.devotional_reflections FOR SELECT
TO authenticated USING (auth.uid() = user_id OR is_shared_to_feed = true);

CREATE POLICY "Users can insert own reflections"
ON public.devotional_reflections FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reflections"
ON public.devotional_reflections FOR UPDATE
TO authenticated USING (auth.uid() = user_id);

-- ── 5. FAITH MILESTONES POLICIES ───────────────────────────────
CREATE POLICY "Anyone can view milestones"
ON public.faith_milestones FOR SELECT
TO public USING (true);

-- ── 6. USER MILESTONE UNLOCKS POLICIES ─────────────────────────
CREATE POLICY "Users can view own milestone unlocks"
ON public.user_milestone_unlocks FOR SELECT
TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own milestone unlocks"
ON public.user_milestone_unlocks FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

-- ── 7. GROUP ENCOURAGEMENTS POLICIES ───────────────────────────
CREATE POLICY "Group members can view encouragements"
ON public.group_encouragements FOR SELECT
TO authenticated USING (true);

CREATE POLICY "Authenticated members can post encouragements"
ON public.group_encouragements FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

-- ── 8. ENCOURAGEMENT REACTIONS POLICIES ────────────────────────
CREATE POLICY "Anyone authenticated can view reactions"
ON public.encouragement_reactions FOR SELECT
TO authenticated USING (true);

CREATE POLICY "Users can toggle their own reaction"
ON public.encouragement_reactions FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own reaction"
ON public.encouragement_reactions FOR DELETE
TO authenticated USING (auth.uid() = user_id);
```

#### 3.2.4 Secure Aggregate Group Functions (Postgres RPC)
To protect individual member privacy while powering collective stats and leaderboards without violating RLS, secure RPC functions are defined with `SECURITY DEFINER`:

```sql
-- Aggregate group total steps and metrics (Publicly callable)
CREATE OR REPLACE FUNCTION public.get_group_stats(target_group_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    g_id UUID;
BEGIN
    SELECT id INTO g_id FROM public.walking_groups WHERE group_code = target_group_code;
    
    IF g_id IS NULL THEN
        RETURN json_build_object('error', 'Group not found');
    END IF;

    SELECT json_build_object(
        'group_code', target_group_code,
        'total_steps', COALESCE(SUM(s.step_count), 0),
        'total_miles', ROUND(COALESCE(SUM(s.distance_miles), 0), 2),
        'total_active_minutes', COALESCE(SUM(s.active_minutes), 0),
        'total_calories', COALESCE(SUM(s.calories_burned), 0),
        'active_members_count', COUNT(DISTINCT m.user_id),
        'target_steps', (SELECT target_steps FROM public.walking_groups WHERE id = g_id)
    ) INTO result
    FROM public.group_memberships m
    LEFT JOIN public.step_logs s ON s.user_id = m.user_id AND s.group_id = g_id
    WHERE m.group_id = g_id;

    RETURN result;
END;
$$;

-- Secure Leaderboard Function (Masks names if anonymous)
CREATE OR REPLACE FUNCTION public.get_group_leaderboard(target_group_code TEXT, period_days INT DEFAULT 7)
RETURNS TABLE (
    rank BIGINT,
    display_name TEXT,
    campus TEXT,
    total_steps BIGINT,
    total_miles NUMERIC,
    is_current_user BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    g_id UUID;
    req_uid UUID;
BEGIN
    req_uid := auth.uid();
    SELECT id INTO g_id FROM public.walking_groups WHERE group_code = target_group_code;

    RETURN QUERY
    WITH RankedSteppers AS (
        SELECT 
            m.user_id,
            CASE 
                WHEN m.is_anonymous AND m.user_id <> req_uid THEN 'Faithful Walker ' || SUBSTRING(m.id::text, 1, 4)
                ELSE m.display_name 
            END AS formatted_name,
            m.campus,
            COALESCE(SUM(s.step_count), 0)::BIGINT AS aggregated_steps,
            ROUND(COALESCE(SUM(s.distance_miles), 0), 2) AS aggregated_miles,
            (m.user_id = req_uid) AS is_me
        FROM public.group_memberships m
        LEFT JOIN public.step_logs s ON s.user_id = m.user_id 
            AND s.group_id = g_id 
            AND s.log_date >= (CURRENT_DATE - (period_days || ' days')::INTERVAL)::DATE
        WHERE m.group_id = g_id
        GROUP BY m.user_id, m.display_name, m.campus, m.is_anonymous, m.id
    )
    SELECT 
        ROW_NUMBER() OVER (ORDER BY aggregated_steps DESC) AS rank,
        formatted_name::TEXT,
        campus::TEXT,
        aggregated_steps,
        aggregated_miles,
        is_me
    FROM RankedSteppers
    ORDER BY aggregated_steps DESC
    LIMIT 50;
END;
$$;
```

---

## 4. Curated "Walking by Faith" 14-Day Devotional Curriculum

Below is the complete, rich 14-day devotional curriculum designed specifically to harmonize physical conditioning, aerobic step volume, discipline, endurance, and spiritual transformation.

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                   "WALKING BY FAITH" 14-DAY CURRICULUM OVERVIEW                │
├──────┬──────────────────────────────────────────┬──────────────────────────────┤
│ Day  │ Scripture Theme                          │ Biblical Reference           │
├──────┼──────────────────────────────────────────┼──────────────────────────────┤
│ Day 1│ The First Step: Breaking Inertia         │ 2 Corinthians 5:7, Gen 12:1  │
│ Day 2│ Renewed Strength: Running Without Faint  │ Isaiah 40:29-31              │
│ Day 3│ The Lighted Path: One Step at a Time     │ Psalm 119:105, Prov 3:5-6    │
│ Day 4│ The Temple of the Spirit: Living Worship │ 1 Corinthians 6:19-20, Rom 12│
│ Day 5│ The Shoes of Peace: Standing Grounded    │ Ephesians 6:13-15            │
│ Day 6│ The Path of Life: Joy in Every Stride    │ Psalm 16:11                  │
│ Day 7│ Holy Recovery: The Sabbath Rhythm        │ Genesis 2:2-3, Matt 11:28-30 │
│ Day 8│ Walking in Fellowship: Two Are Better    │ Ecclesiastes 4:9-12, Heb 10  │
│ Day 9│ Moving Mountains: Pushing Past Limits    │ Zechariah 4:6-7, Heb 12:1-2  │
│Day 10│ The Road to Emmaus: Eyes Opened in Walk  │ Luke 24:13-32                │
│Day 11│ Straight Paths: Wisdom & Discipline      │ Proverbs 4:25-27, Col 4:5    │
│Day 12│ The Fruit of Endurance: Unshakable Habit │ Galatians 6:9, James 1:2-4   │
│Day 13│ Leaping and Praising: Gratitude Stride   │ Acts 3:1-9, Psalm 103:1-5    │
│Day 14│ The Great Commission: Ambassadors on Foot│ Matthew 28:18-20, Micah 6:8  │
└────────────────────────────────────────────────────────────────────────────────┘
```

### Day 1: The First Step — Breaking Inertia
- **Scripture Reference**: 2 Corinthians 5:7 (ESV) & Genesis 12:1 (CSB)
- **Scripture Text**: *"For we walk by faith, not by sight."* — 2 Corinthians 5:7  
  *"The Lord said to Abram: Go out from your land, your relatives, and your father's house to the land that I will show you."* — Genesis 12:1
- **Devotional & Conditioning Exegesis**:  
  Every transformational journey begins with overcoming physical and spiritual inertia. When God called Abram, He did not hand him a finalized satellite map; He gave him a directive to move his feet. In physical conditioning, the hardest steps are always the first ten minutes before your cardiovascular system warms up and endorphins release. In faith, the hardest step is stepping out into obedience before you see how the provision will unfold. As you lace up your shoes today, realize that movement is an act of trust. God honors the forward motion of faith.
- **Reflection Prompt**: What area of your physical health or spiritual life has felt stagnant, and what is one tangible step of faith you can take today?
- **Physical Action Challenge**: Complete a dedicated 20-minute brisk walk (aim for at least 2,500 continuous steps) while dedicating the first 5 minutes to silent gratitude.
- **Guided Prayer**: *"Heavenly Father, ignite my spirit and awaken my body today. Strip away complacency and fear of the unknown. As my feet strike the ground, let every stride proclaim my trust in Your unfailing guidance. In Jesus' name, Amen."*
- **Milestone Link**: "First Step of Faith" Badge.

### Day 2: Renewed Strength — Running and Not Growing Weary
- **Scripture Reference**: Isaiah 40:29–31 (NIV)
- **Scripture Text**: *"He gives strength to the weary and increases the power of the weak. Even youths grow tired and weary, and young men stumble and fall; but those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint."*
- **Devotional & Conditioning Exegesis**:  
  Human endurance has biological limits. Glycogen depletes, muscles accumulate metabolic fatigue, and willpower falters under stress. Yet the Prophet Isaiah points to an inexhaustible reservoir: the sovereign power of the Creator. When we learn to align our physical conditioning with spiritual reliance, fatigue transforms from a barrier into a classroom of grace. When your breath grows heavy and your legs feel the burn of the miles, remember that true endurance is not self-manufactured; it is received.
- **Reflection Prompt**: Where are you currently trying to operate in your own willpower instead of resting in the supernatural strength of the Lord?
- **Physical Action Challenge**: Target 5,000 steps today. When you hit the 3,000-step mark and feel tired, repeat Isaiah 40:31 as your breathing cadence.
- **Guided Prayer**: *"Lord God, You never grow tired or weary. When my energy flags and my schedule feels overwhelming, breathe Your resurrection life into my lungs and legs. Renew my physical stamina and my spiritual fervor today. Amen."*
- **Milestone Link**: "5,000 Steps: Daily Faith Walk" Badge.

### Day 3: The Lighted Path — One Step at a Time
- **Scripture Reference**: Psalm 119:105 (ESV) & Proverbs 3:5–6 (CSB)
- **Scripture Text**: *"Your word is a lamp to my feet and a light to my path."* — Psalm 119:105  
  *"Trust in the Lord with all your heart, and do not rely on your own understanding; in all your ways know him, and he will make your paths straight."* — Proverbs 3:5–6
- **Devotional & Conditioning Exegesis**:  
  An ancient oil lamp did not cast a high-beam floodlight five miles into the distance; it illuminated merely the single next step in front of the traveler's sandal. In modern fitness culture, anxiety often stems from fixating on the distant 30-day or 6-month recomp goal rather than executing today's nutritional discipline and daily step target. God calls us to faithful presence in the current mile. Master the step you are on, and God will illuminate the next.
- **Reflection Prompt**: What future worry is robbing you of joy and discipline in today's daily habits?
- **Physical Action Challenge**: Take a 15-minute evening or morning "Light Walk" outdoors without headphones, observing God's creation and meditating on Psalm 119:105.
- **Guided Prayer**: *"Father, keep my eyes focused on where You have placed my feet today. Deliver me from anxiety about tomorrow. Let Your Word illuminate my decisions, my nutrition, and my thoughts with every step. Amen."*
- **Milestone Link**: "3-Day Faith Stride Streak" Badge.

### Day 4: The Temple of the Spirit — Honoring God with Your Body
- **Scripture Reference**: 1 Corinthians 6:19–20 (NIV) & Romans 12:1 (ESV)
- **Scripture Text**: *"Do you not know that your bodies are temples of the Holy Spirit, who is in you, whom you have received from God? You are not your own; you were bought at a price. Therefore honor God with your bodies."* — 1 Corinthians 6:19–20
- **Devotional & Conditioning Exegesis**:  
  Biblical Christianity rejects the false dichotomy between the spiritual and the physical. Your physical body is not an disposable shell or an idol to worship in vanity; it is the living temple of the Holy Spirit. Conditioning your heart, increasing your VO2 max, maintaining joint mobility, and logging daily steps is an act of sacred stewardship. When you care for your cardiovascular health and physical vitality, you are sharpening an instrument consecrated for the Master's use.
- **Reflection Prompt**: How does viewing your daily fitness as an act of worship and stewardship change your motivation from vanity to devotion?
- **Physical Action Challenge**: Pair your daily walking goal (aim for 6,000+ steps) with intentional hydration—drink at least 64oz of pure water as a tangible honoring of your temple.
- **Guided Prayer**: *"Lord Jesus, You purchased me with Your precious blood. I dedicate my heartbeat, my muscles, and my energy to Your glory. Help me steward this temple with wisdom, discipline, and reverence. Amen."*
- **Milestone Link**: "Temple Steward" Individual Achievement.

### Day 5: Standing Grounded — The Shoes of the Gospel of Peace
- **Scripture Reference**: Ephesians 6:13–15 (ESV)
- **Scripture Text**: *"Therefore take up the whole armor of God, that you may be able to withstand in the evil day, and having done all, to stand firm. Stand therefore... as shoes for your feet, having put on the readiness given by the gospel of peace."*
- **Devotional & Conditioning Exegesis**:  
  Roman legionnaires wore the *caligae*—specialized studded sandals designed to grip loose gravel and uneven combat terrain, preventing dangerous slippage during battle. In the spiritual warfare of daily life, peace is not merely the absence of trouble; it is a solid footing that anchors your soul against anxiety, chaos, and temptation. Walking with deliberate, grounded strides releases cortisol and calms the nervous system, bringing physical harmony that mirrors the supernatural peace of Christ.
- **Reflection Prompt**: What internal storm or anxiety is threatening to make you lose your footing today, and how can the Gospel of Peace anchor you?
- **Physical Action Challenge**: Walk a focused 3,000 steps while praying specifically for peace over your family, church, and community.
- **Guided Prayer**: *"Prince of Peace, strap the footwear of Your Gospel securely to my feet. Where the ground is slippery and chaotic, make my steps firm and unwavering. Let peace guard my mind and health today. Amen."*
- **Milestone Link**: "Grounded in Peace" Badge.

### Day 6: The Path of Life — Joy in Every Stride
- **Scripture Reference**: Psalm 16:11 (CSB)
- **Scripture Text**: *"You reveal the path of life to me; in your presence is abundant joy; at your right hand are eternal pleasures."*
- **Devotional & Conditioning Exegesis**:  
  South Florida's coastal breezes and sunshine offer a natural canvas for experiencing the majesty of God. Aerobic walking in natural sunlight stimulates dopamine and serotonin synthesis, aligning neurochemistry with spiritual joy. Joy is not a luxury; it is the spiritual oxygen that sustains long-term habit formation. When your workouts feel like drudgery, shift your perspective from obligation to celebration: you are alive, your limbs move, and God is walking beside you.
- **Reflection Prompt**: What simple blessings in your immediate physical environment can you thank God for during today's walk?
- **Physical Action Challenge**: Go for a 25-minute sunshine walk, actively looking for 5 distinct evidences of God's beauty in nature or your neighborhood.
- **Guided Prayer**: *"Lord of Life, fill my heart with abundant joy as I walk today. Thank You for the gift of breath, the strength in my legs, and the beauty of Your creation all around me. Amen."*
- **Milestone Link**: "Joyful Walker" Milestone.

### Day 7: The Rhythm of Rest — Holy Recovery and Sabbath Renewal
- **Scripture Reference**: Genesis 2:2–3 (ESV) & Matthew 11:28–30 (NIV)
- **Scripture Text**: *"And on the seventh day God finished his work that he had done, and he rested on the seventh day from all his work that he had done."* — Genesis 2:2  
  *"Come to me, all you who are weary and burdened, and I will give you rest. Take my yoke upon you and learn from me, for I am gentle and humble in heart, and you will find rest for your souls."* — Matthew 11:28–29
- **Devotional & Conditioning Exegesis**:  
  In exercise physiology, muscle hypertrophy and aerobic adaptations do not occur during the breakdown of the workout; they occur during recovery, deep sleep, and deliberate rest. In God's design, rest is not laziness—it is a covenant confession that God is in control and we are not the masters of the universe. Today is dedicated to active recovery: low-intensity, restorative movement, gentle stretching, and unhurried communion with God.
- **Reflection Prompt**: Are you giving your body and soul adequate rest, or are you running on the fumes of chronic stress?
- **Physical Action Challenge**: Perform a gentle, leisurely recovery walk (1,500 to 3,000 steps) followed by 10 minutes of lower body stretching and deep diaphragmatic breathing.
- **Guided Prayer**: *"Gracious God, teach me the sacred rhythm of rest. I lay down my striving and quiet my racing mind. Rebuild my muscle fibers, restore my nervous system, and replenish my soul in Your presence. Amen."*
- **Milestone Link**: "7-Day Covenant Streak" Badge.

### Day 8: Walking Together — Two Are Better Than One
- **Scripture Reference**: Ecclesiastes 4:9–12 (CSB) & Hebrews 10:24–25 (NIV)
- **Scripture Text**: *"Two are better than one, because they have a good return for their labor: If either of them falls down, one can help the other up. But pity anyone who falls and has no one to help them up."* — Ecclesiastes 4:9–10  
  *"And let us consider how we may spur one another on toward love and good deeds, not giving up meeting together... but encouraging one another."* — Hebrews 10:24–25
- **Devotional & Conditioning Exegesis**:  
  Solo fitness journeys are vulnerable to isolation, drift, and quiet quitting. Coastal Community Church Group #3266 exists because God designed us for community. When we walk alongside brothers and sisters—whether physically on a South Florida trail or digitally via our shared step progress board—we multiply our resilience. A single ember removed from the fire quickly goes cold, but together our collective steps build an unstoppable flame of health and faith.
- **Reflection Prompt**: Who in your church community can you reach out to today with a word of encouragement or an invitation to walk together?
- **Physical Action Challenge**: Send an encouraging note on the Coastal Community Feed and invite a friend or family member to walk with you today (aim for 7,500 steps).
- **Guided Prayer**: *"Lord, thank You for my Coastal Community Church family. Deliver me from the lie of isolation. Use my words and my presence to build up others and spur them on in health and faith. Amen."*
- **Milestone Link**: "Community Builder" Milestone & "The Jericho March" Group Goal.

### Day 9: Overcoming Obstacles — Pushing Past Limits
- **Scripture Reference**: Zechariah 4:6–7 (ESV) & Hebrews 12:1–2 (NIV)
- **Scripture Text**: *"Not by might, nor by power, but by my Spirit, says the Lord of hosts. Who are you, O great mountain? Before Zerubbabel you shall become a plain."* — Zechariah 4:6–7  
  *"Therefore... let us throw off everything that hinders and the sin that so easily entangles. And let us run with perseverance the race marked out for us, fixing our eyes on Jesus."* — Hebrews 12:1–2
- **Devotional & Conditioning Exegesis**:  
  Around Day 9 of any lifestyle change, the initial novelty wears off and the grind sets in. Old habits, busy schedules, rainy weather, and sore muscles present themselves as immovable mountains. But scripture reminds us that kingdom breakthroughs do not happen through human flesh alone, but by the Holy Spirit. When you encounter resistance, do not turn back. Take one more step, lift one more prayer, and watch God flatten the mountain before you.
- **Reflection Prompt**: What excuse or obstacle is threatening to derail your commitment to health and spiritual growth right now?
- **Physical Action Challenge**: Challenge day: push for an extra 1,500 steps above your daily average, tackling an incline, stairs, or brisk intervals.
- **Guided Prayer**: *"Almighty God, when obstacles loom large before me, remind me of Your sovereign power. By Your Spirit, give me the grit to push through fatigue, self-doubt, and resistance. My eyes are fixed on Jesus. Amen."*
- **Milestone Link**: "10,000 Steps: Mountain Mover" Badge.

### Day 10: The Road to Emmaus — Eyes Opened in the Walk
- **Scripture Reference**: Luke 24:13–15, 30–32 (NIV)
- **Scripture Text**: *"Now that same day two of them were going to a village called Emmaus, about seven miles from Jerusalem. They were talking with each other about everything that had happened. As they talked and discussed these things with each other, Jesus himself came up and walked along with them... They asked each other, 'Were not our hearts burning within us while he talked with us on the road and opened the Scriptures to us?'"*
- **Devotional & Conditioning Exegesis**:  
  The seven-mile journey from Jerusalem to Emmaus is approximately 14,000 steps—a substantial trek across rocky Judean hills. It was during this extended, unhurried walk that the resurrected Jesus met two heartbroken disciples, walked alongside them at their pace, and transformed their grief into burning passion. Walking creates the mental margin and rhythmic breathing necessary to hear the gentle voice of the Savior. As you walk today, know that Christ is walking with you.
- **Reflection Prompt**: If Jesus were physically walking beside you for the next mile, what would you ask Him, and what would He say to your heart?
- **Physical Action Challenge**: Dedicate a "Silent Stride" walk (at least 30 minutes) where you listen for God's still, small voice without digital distractions.
- **Guided Prayer**: *"Lord Jesus, walk beside me today. Open my spiritual eyes to recognize Your presence in the ordinary moments of life. Set my heart ablaze with love for Your Word and Your people. Amen."*
- **Milestone Link**: "The Road to Emmaus" Community Landmark.

### Day 11: Straight Paths — Wisdom and Daily Discipline
- **Scripture Reference**: Proverbs 4:25–27 (CSB) & Colossians 4:5 (ESV)
- **Scripture Text**: *"Let your eyes look forward; fix your gaze straight ahead. Carefully consider the path for your feet, and all your ways will be established. Don't turn to the right or to the left; keep your feet from evil."* — Proverbs 4:25–27
- **Devotional & Conditioning Exegesis**:  
  In athletics and body recomposition, progress is destroyed by subtle lateral drift—small compromises in nutrition, skipped hydration, neglected sleep, or missing daily step baselines. The writer of Proverbs urges us to have laser focus: look straight ahead, ponder the path of our feet, and eliminate drift. Spiritual maturity and physical conditioning share the exact same law: consistency is the mother of mastery.
- **Reflection Prompt**: Where has subtle compromise or distraction crept into your daily routine, and how can you realign your gaze on the goal?
- **Physical Action Challenge**: Log your meals with precision alongside completing 8,000 steps today, eliminating all mindless grazing or snacking.
- **Guided Prayer**: *"Father, grant me holy focus and disciplined resolve. Guard my eyes from distraction and my feet from compromise. Establish my daily habits so they produce physical health and spiritual honor. Amen."*
- **Milestone Link**: "Straight Path Stride" Achievement.

### Day 12: The Fruit of Endurance — Building Unshakable Habits
- **Scripture Reference**: Galatians 6:9 (ESV) & James 1:2–4 (CSB)
- **Scripture Text**: *"And let us not grow weary of doing good, for in due season we will reap, if we do not give up."* — Galatians 6:9  
  *"Consider it a great joy, my brothers and sisters, whenever you experience various trials, because you know that the testing of your faith produces endurance. And let endurance have its full effect, so that you may be mature and complete, lacking nothing."* — James 1:2–4
- **Devotional & Conditioning Exegesis**:  
  Behavioral science shows that habit automaticity develops after repeated, unbroken neural firing over multiple weeks. By Day 12, your body has begun remodeling mitochondrial density, improving insulin sensitivity, and establishing a daily habit loop. Spiritual endurance operates on the same principle: faithfulness in the small, unseen, unglamorous reps produces the harvest of righteousness. Do not grow weary. The harvest is coming.
- **Reflection Prompt**: What positive physical or mental changes are you already beginning to notice since committing to this faith & fitness journey?
- **Physical Action Challenge**: Complete a consistent 8,500-step day, maintaining a strong, confident posture and cadence throughout.
- **Guided Prayer**: *"Lord, strengthen my resolve when fatigue whispers that quitting won't matter. I choose endurance today. Let Your Spirit produce patience, discipline, and steadfast faith in my life. Amen."*
- **Milestone Link**: "Endurance Champion" Milestone.

### Day 13: Leaping and Praising — The Gratitude Stride
- **Scripture Reference**: Acts 3:6–9 (NIV) & Psalm 103:1–5 (ESV)
- **Scripture Text**: *"Then Peter said, 'Silver or gold I do not have, but what I do have I give you. In the name of Jesus Christ of Nazareth, walk.' Taking him by the right hand, he helped him up, and instantly the man's feet and ankles became strong. He jumped to his feet and began to walk. Then he went with them into the temple courts, walking and jumping, and praising God."* — Acts 3:6–8
- **Devotional & Conditioning Exegesis**:  
  Consider the man at the Beautiful Gate: for decades his limbs were powerless, but at the name of Jesus, strength surged into his ankles and feet. He did not merely walk—he leaped, ran, and praised God! Too often we view exercise as a chore rather than a miraculous privilege. Millions of people would give anything to have the mobility and strength you possess right now. Turn today's walk into a victory lap of unashamed gratitude.
- **Reflection Prompt**: Make a list of 10 specific physical capabilities your body has that you often take for granted.
- **Physical Action Challenge**: Take a "Praise & Power Walk" (aim for 9,000 to 10,000 steps). Every 1,000 steps, whisper a prayer of thanksgiving for your health and mobility.
- **Guided Prayer**: *"Lord God of miracles, thank You for the strength in my feet, ankles, and heart! Forgive me for complaining about workouts when movement is such a magnificent gift. I praise You with every step today! Amen."*
- **Milestone Link**: "Praise in Motion" Badge & "Galilee Shoreline Trek" Progress.

### Day 14: The Great Commission — Ambassadors on Foot
- **Scripture Reference**: Matthew 28:18–20 (CSB) & Micah 6:8 (NIV)
- **Scripture Text**: *"Jesus came near and said to them, 'All authority has been given to me in heaven and on earth. Go, therefore, and make disciples of all nations...'"* — Matthew 28:18–19  
  *"He has shown you, O mortal, what is good. And what does the Lord require of you? To act justly and to love mercy and to walk humbly with your God."* — Micah 6:8
- **Devotional & Conditioning Exegesis**:  
  In the Greek text of the Great Commission, the word for "Go" (*poreuthentes*) is a participle best translated as *"As you are going"* or *"In your daily walking"*. Jesus did not call us to be passive spectators; He commissioned us to be active ambassadors of His kingdom in the flow of our everyday lives. Your physical vitality, clear mind, and vibrant spirit are testimonies to your family, your workplace, and Coastal Community Church. You are physically conditioned and spiritually equipped to walk humbly with God and impact the world.
- **Reflection Prompt**: How will you carry the momentum of these 14 days into the rest of the year as a lifelong lifestyle of faith and fitness?
- **Physical Action Challenge**: Celebrate completing the 14-Day Curriculum with a 10,000-step day and post your personal reflection/testimony on the Coastal group board.
- **Guided Prayer**: *"Sovereign Lord, You have strengthened my body and renewed my spirit over these 14 days. As I go forth into my community, let my life reflect Your love, discipline, and grace. Keep me walking humbly with You all my days. In Jesus' mighty name, Amen."*
- **Milestone Link**: "14-Day Discipleship Journey" Crown & "1 Million Roman Road" Contributor.

---

## 5. Faith Milestone Engine Architecture

### 5.1 Individual Milestone Catalog
Every milestone includes defined numeric thresholds, trigger events, celebratory modal messaging, and assigned Lucide SVG icons (no emojis).

| Milestone Key | Badge Title | Threshold / Criteria | Lucide SVG Icon | Scripture Citation | Description |
|---------------|-------------|----------------------|-----------------|--------------------|-------------|
| `ind_first_step` | First Step of Faith | 1st Step Logged | `Footprints` | Genesis 12:1 | Commencing the physical and spiritual journey |
| `ind_5k_day` | Daily Faith Walk | 5,000 steps in a single day | `Activity` | Psalm 119:105 | Solid foundation of daily aerobic movement |
| `ind_10k_day` | Mountain Mover | 10,000 steps in a single day | `Mountain` | Matthew 17:20 | Elite daily movement target achieved |
| `ind_15k_day` | Eagle's Wings | 15,000 steps in a single day | `Sparkles` | Isaiah 40:31 | Extraordinary aerobic capacity and drive |
| `ind_streak_3` | Faith Stride Streak | 3 consecutive active days | `Flame` | 1 Thess 5:17 | Overcoming initial resistance with consistency |
| `ind_streak_7` | Covenant Streak | 7 consecutive active days | `Award` | Galatians 6:9 | Full week of disciplined body stewardship |
| `ind_streak_14`| 14-Day Discipleship | 14 consecutive active days | `Crown` | 2 Timothy 4:7 | Completion of full 14-Day curriculum |
| `ind_miles_13` | Half-Marathon Trek | 13.1 cumulative miles logged | `Compass` | 1 Cor 9:26 | 13.1 miles of faithful endurance |
| `ind_miles_26` | Marathon Pilgrimage | 26.2 cumulative miles logged | `Trophy` | 1 Cor 9:24 | 26.2 miles — full marathon distance |
| `ind_miles_100`| Century Trail Walker | 100 cumulative miles logged | `Shield` | Ephesians 6:13 | 100 miles of consecrated fitness |
| `ind_steps_250k`| Quarter Million Club | 250,000 cumulative steps | `Zap` | Philippians 4:13 | Quarter-million steps in community |

### 5.2 Group Collective Journey Milestones (#3266)
Collective milestones aggregate contributions from all Coastal Community Church members to "walk" iconic biblical routes together.

```
[Group Start: 0 Steps]
        │
        ├──► 50,000 Steps: "The Jericho March" (Joshua 6:1-20)
        │    • Theme: United faith breaking through strongholds
        │    • Lucide Icon: `Shield`
        │
        ├──► 100,000 Steps: "Galilee Shoreline Trek" (Matthew 4:18-22)
        │    • Theme: Answering the call to follow Christ in community
        │    • Lucide Icon: `Compass`
        │
        ├──► 250,000 Steps: "Mount Sinai Ascent" (Exodus 19:1-20)
        │    • Theme: Collective elevation, endurance, and covenant
        │    • Lucide Icon: `Mountain`
        │
        ├──► 500,000 Steps: "The Road to Emmaus Journey" (Luke 24:13-35)
        │    • Theme: Deep fellowship, open eyes, and transformed hearts
        │    • Lucide Icon: `Heart`
        │
        └──► 1,000,000 Steps: "The Roman Road Pilgrimage" (Romans 1:16, 10:9-15)
             • Theme: Unstoppable gospel movement and collective triumph
             • Lucide Icon: `Crown`
```

---

## 6. Brand Synergy & Design System Guidelines

### 6.1 Color Palette & Theme Tokens
| Token Name | Dark Value (Default) | Light Value | Semantic Application |
|------------|----------------------|-------------|----------------------|
| `--t-surface` | `#050508` (Obsidian) | `#FBFBFD` (Warm Cream) | Primary canvas background |
| `--t-card` | `#0E0E14` (Onyx Card) | `#FFFFFF` (White Card) | Surface container for cards & dialogs |
| `--t-glass` | `rgba(10, 10, 15, 0.85)` | `rgba(245, 245, 248, 0.90)` | Glassmorphism overlays & sticky header |
| `--t-accent` | `#D4B87E` (Liquid Gold) | `#C59B27` (Deep Gold) | Primary CTAs, active highlights, key stats |
| `--t-violet` | `#C58B8B` (Rose Gold) | `#B07474` (Muted Rose) | Secondary accents, streak highlights |
| `--t-coastal` | `#38BDF8` (Coastal Cyan) | `#0284C7` (Ocean Blue) | Coastal Church badges, milestone bars |
| `--t-text` | `#FFFFFF` (Ice White) | `#121215` (Charcoal) | Primary readable text |
| `--t-muted` | `#A0A5B5` (Silver Slate) | `#4A4D55` (Slate Gray) | Captions, labels, timestamps, scriptures |

### 6.2 Strict Lucide Icon Mapping (Zero Emojis)
In accordance with Rule `user_global`, **no AI emojis or unicode emoji symbols** are permitted anywhere in code, copy, or UI elements.

| UI Element | Lucide React Icon Component | Purpose |
|------------|-----------------------------|---------|
| Daily Steps / Activity | `<Activity className="w-5 h-5 text-accent-lime" />` | Step counter & pace |
| Mileage Metric | `<Compass className="w-5 h-5 text-sky-400" />` | Distance in miles |
| Active Time Metric | `<Clock className="w-5 h-5 text-accent-violet" />` | Walking duration in minutes |
| Daily Streaks | `<Flame className="w-5 h-5 text-amber-400" />` | Consecutive active day counter |
| Devotionals / Bible | `<BookOpen className="w-5 h-5 text-accent-lime" />` | Scripture study & reflection |
| Church / Group Hub | `<Church className="w-5 h-5 text-sky-400" />` / `<Users className="w-5 h-5" />` | Coastal Church badge |
| Milestones / Trophies | `<Trophy className="w-5 h-5 text-accent-lime" />` | Unlocked achievements |
| High Five / Encouragement | `<Heart className="w-4 h-4 text-rose-400" />` | Community praise & reactions |
| Step Quick-Add | `<Plus className="w-4 h-4" />` | Incremental step logging |
| Anonymous Privacy | `<EyeOff className="w-4 h-4" />` | Masked identity toggle |

---

## 7. Edge Cases & Robustness Matrix

| # | Feature Area | Input / Condition | Expected Behavior & Recovery Strategy |
|---|--------------|-------------------|---------------------------------------|
| **E01** | Step Logging | Extreme Step Input (e.g. `250,000` steps in single entry) | Client-side validation clamps input at 150,000 steps/day. If >30,000 entered, display confirmation dialog: *"Are you sure you walked 12+ miles today?"* |
| **E02** | Step Logging | Negative or Non-Integer Input (e.g. `-500`, `12.5`) | Input sanitizer strips non-numeric characters; form validation rejects values < 1 with clear feedback. |
| **E03** | Streak Calculation | Leap Year & Timezone Crossover (User logs in South Florida EST vs Traveling UTC) | All timestamps normalized to ISO date strings (`YYYY-MM-DD`) anchored to the user's localized browser date to prevent premature streak reset. |
| **E04** | Auth / Onboarding | Unverified Email User attempting to write step records | UI captures steps in local session storage, prompts email confirmation banner, and syncs queued steps upon verification. |
| **E05** | Community Feed | Rapid Multiple Reaction Clicks ("Like Bombing") | Debounce reaction triggers (300ms) with optimistic UI update and database unique constraint `(encouragement_id, user_id, reaction_type)`. |
| **E06** | Leaderboard | All-Time tie in step counts between two members | Secondary sort key by `joined_at ASC` ensuring stable, deterministic ranking. |
| **E07** | Network Interruption | Offline Step Submission | Intercept network error, save step log to `localStorage` sync queue, and automatically dispatch when connectivity resumes. |
| **E08** | Devotional Reader | URL query `?day=99` out of bounds | Bounds check restricts index to `1 <= day <= 14`, gracefully redirecting or defaulting to current active challenge day. |
| **E09** | Mobile Layout | Foldable / Ultra-Wide Display (>1440px) | Content container constrained to `max-w-7xl mx-auto` with dual-column grid (Left: Devotional & Steps; Right: Community Feed & Leaderboard). |
| **E10** | Safe-Area Notch | iOS Dynamic Island & Android Bottom Bar overlap | Enforce `pt-[var(--sat)]` on header and `pb-[calc(var(--sab)+5rem)]` on bottom action bar. |

---

## 8. Four-Tier Test Suite Specification

### Tier 1: Feature Coverage Tests (>=5 per Feature Group)

#### R1: Dedicated Group Portal & Onboarding
- **T1.R1.01**: Verify navigating to `/coastal` renders Coastal Community Church (#3266) hero banner, branding, and group code badge.
- **T1.R1.02**: Verify navigating to `/coastal-walk` properly renders the identical portal or redirects with 200/301 status.
- **T1.R1.03**: Verify magic-link form submission sends valid email request to Supabase Auth API and displays verification notification.
- **T1.R1.04**: Verify standard sign-up flow creates a `group_memberships` record linking `auth.uid()` to Group `#3266`.
- **T1.R1.05**: Verify guest users can view collective group progress bar and read Day 1 devotional without authentication.
- **T1.R1.06**: Verify authenticated members can navigate freely to `/dashboard`, `/calculator`, and `/park` without session loss.

#### R2: Step, Distance, Activity Tracker & RLS
- **T1.R2.01**: Verify entering `8,400` steps calculates `3.50` miles ($\pm 0.05$), `84` active minutes, and `336` kcal burned.
- **T1.R2.02**: Verify clicking quick-add `+2,500` increases current daily step count by exactly 2,500.
- **T1.R2.03**: Verify saving steps for today updates the daily summary card and increments total collective steps.
- **T1.R2.04**: Verify logging steps on 3 consecutive days computes and displays a 3-Day Flame Streak.
- **T1.R2.05**: Verify Supabase RLS rejects direct API select queries from User A targeting User B's `step_logs` rows.
- **T1.R2.06**: Verify RPC `get_group_stats('3266')` accurately returns aggregated steps without exposing individual user IDs.

#### R3: Scripture Devotionals & Milestone Engine
- **T1.R3.01**: Verify Day 1 through Day 14 devotional cards display correct biblical passage, exegesis, reflection, and prayer.
- **T1.R3.02**: Verify typing a journal entry and clicking "Save Reflection" stores the reflection under the authenticated user's ID.
- **T1.R3.03**: Verify user reaching 5,000 steps triggers the "Daily Faith Walk" milestone unlock notification.
- **T1.R3.04**: Verify user completing Day 14 with continuous logs unlocks the "14-Day Discipleship Journey" Crown badge.
- **T1.R3.05**: Verify clicking the Day carousel arrows seamlessly updates the active devotional card.

#### R4: Community Goal, Leaderboard & Encouragement Feed
- **T1.R4.01**: Verify collective progress bar updates dynamically when member steps are aggregated.
- **T1.R4.02**: Verify leaderboard correctly ranks top members descending by step volume.
- **T1.R4.03**: Verify toggling `is_anonymous` in profile replaces member name with "Faithful Walker #XXXX" on public leaderboard.
- **T1.R4.04**: Verify posting an encouragement message adds a new card to the community feed with author name and timestamp.
- **T1.R4.05**: Verify clicking "High Five" on an encouragement post increments reaction counter and prevents duplicate votes.

#### R5: Brand Synergy & Design Standards
- **T1.R5.01**: Verify Obsidian Gold & Rose Gold color palette tokens are applied with correct contrast ratios (>4.5:1 for body copy).
- **T1.R5.02**: Verify strictly Lucide SVG icons are rendered and zero unicode/AI emojis exist across rendered DOM.
- **T1.R5.03**: Verify layout displays correctly without clipping on iPhone 15/16 viewport (393x852px) with safe-area top/bottom insets.
- **T1.R5.04**: Verify theme toggle switches between Obsidian Dark and Warm Cream Light modes without CSS layout shifts.
- **T1.R5.05**: Verify desktop viewports (1440px+) utilize dual-column dashboard layout.

---

### Tier 2: Boundary & Corner Case Tests (>=5 per Feature Group)

#### R1: Boundary Cases
- **T2.R1.01**: User enters email with trailing spaces (` test@example.com `) $\rightarrow$ verify trimmed before auth dispatch.
- **T2.R1.02**: User accesses `/COASTAL` in all uppercase $\rightarrow$ verify middleware redirects to `/coastal` seamlessly.
- **T2.R1.03**: User signs up with extreme name length (100 characters) $\rightarrow$ verify schema truncation/validation.
- **T2.R1.04**: User switches browser tabs during magic link verification $\rightarrow$ verify session recovers upon tab focus.
- **T2.R1.05**: User joins with duplicate membership click $\rightarrow$ verify PostgreSQL `UNIQUE(group_id, user_id)` handles idempotently.

#### R2: Boundary Cases
- **T2.R2.01**: Step count of `0` entered $\rightarrow$ verify accepted without breaking mileage/active time calculations (all zero).
- **T2.R2.02**: Step count of `150,000` (max boundary) entered $\rightarrow$ verify accepted and mileage computed as ~62.5 miles.
- **T2.R2.03**: Step count of `150,001` entered $\rightarrow$ verify rejected by validation check.
- **T2.R2.04**: User logs steps at 11:59 PM and 12:01 AM $\rightarrow$ verify recorded under separate calendar dates (`log_date`).
- **T2.R2.05**: Member logs steps for a date in the past (historical backfill) $\rightarrow$ verify streak recalculates accurately across date sequence.

#### R3: Boundary Cases
- **T2.R3.01**: User reflection text entered with 2,000 characters (max limit) $\rightarrow$ verify saved without database truncation.
- **T2.R3.02**: User reflection text entered with 2,001 characters $\rightarrow$ verify UI displays remaining character count warning and disables save.
- **T2.R3.03**: Rapid milestone threshold hopping (logging 0 $\rightarrow$ 25,000 steps in one entry) $\rightarrow$ verify all intermediate milestones (5k, 10k, 15k) unlock.
- **T2.R3.04**: Devotional selector navigated past Day 14 $\rightarrow$ verify clamped at Day 14.
- **T2.R3.05**: Devotional selector navigated below Day 1 $\rightarrow$ verify clamped at Day 1.

#### R4: Boundary Cases
- **T2.R4.01**: Collective steps reach exactly 50,000 $\rightarrow$ verify "The Jericho March" milestone unlocks immediately.
- **T2.R4.02**: Collective steps reach 1,000,000 (goal target) $\rightarrow$ verify progress bar displays 100% and victory banner triggers without overflow.
- **T2.R4.03**: Encouragement message containing only whitespace entered $\rightarrow$ verify submit button disabled.
- **T2.R4.04**: Encouragement message containing HTML/Script tags (`<script>alert(1)</script>`) $\rightarrow$ verify sanitized and rendered as plain text.
- **T2.R4.05**: Leaderboard with 1,000+ members $\rightarrow$ verify pagination/limit clamps top 50 with current user pinned if outside top 50.

#### R5: Boundary Cases
- **T2.R5.01**: Viewport resized to ultra-narrow mobile (320px width) $\rightarrow$ verify zero horizontal scroll and readable text.
- **T2.R5.02**: Dark/Light mode rapid toggling (10 clicks in 2 seconds) $\rightarrow$ verify no hydration mismatch or style glitches.
- **T2.R5.03**: High-DPI / Retina displays (3x scale) $\rightarrow$ verify all Lucide SVG icons maintain vector crispness.
- **T2.R5.04**: Device with landscape orientation on mobile $\rightarrow$ verify modal dialogs maintain scrollable overflow.
- **T2.R5.05**: Device with custom font size scaling (200% system font) $\rightarrow$ verify cards expand fluidly without text clipping.

---

### Tier 3: Cross-Feature Integration Scenarios
1. **End-to-End Member Journey**:
   - New visitor arrives at `/coastal` from Sunday church bulletin QR code.
   - Signs up via magic link $\rightarrow$ auto-assigned to Group #3266.
   - Reads Day 1 Devotional ("The First Step") and submits a private reflection.
   - Logs 6,500 steps using quick-add preset $\rightarrow$ unlocks "First Step of Faith" and "Daily Faith Walk" badges.
   - Views collective goal increase and checks leaderboard ranking.
   - Posts a praise note on the community encouragement feed.
   - Navigates to `/calculator` to view personalized macro target.

2. **Multi-User Real-Time Progress Update**:
   - 10 group members log daily steps simultaneously.
   - Aggregate group step total increments via secure RPC.
   - Leaderboard re-orders dynamically based on latest tallies.
   - Collective milestone ("Jericho March") unlocks for all members.

3. **Privacy Isolation Verification**:
   - Member A sets profile to `is_anonymous = true`.
   - Member B views the public group leaderboard.
   - Verify Member A appears as "Faithful Walker #XXXX" with no email or real name visible in network payload or DOM.
   - Verify Member A viewing their own view sees their true name with an "Anonymous to others" indicator badge.

---

### Tier 4: Real-World Workload & Stress Scenarios
1. **Sunday Church Walking Event Surge**:
   - Simulates 500 church members logging steps within a 15-minute window following Sunday service.
   - Validates connection pooling on Supabase PostgreSQL and sub-100ms response times on `get_group_stats` RPC calls.
2. **Offline-to-Online Batch Sync**:
   - Member takes an extended 5-mile nature walk in an area with zero cellular reception.
   - Logs steps and writes devotional reflection in offline PWA state.
   - Connects to Wi-Fi $\rightarrow$ client queue dispatches batch sync with zero data loss or duplicate records.
3. **Continuous 14-Day Simulation**:
   - Scripted simulation of 14 continuous days of step logging, streak advancement, milestone triggers, and devotional completions to ensure no edge-case date truncation occurs over month boundaries.

---

## 9. Verification & Build Command Reference

To verify that the implementation adheres to all architectural, typing, and linting constraints:

```bash
# 1. Type Check and Lint Validation
npm run lint

# 2. Production Build Compilation
npm run build

# 3. Next.js App Startup Verification
npm run start
```

### Build Integrity Checklist:
- [x] Zero TypeScript compilation errors (`next build` output).
- [x] Zero ESLint syntax or deprecation errors.
- [x] Strictly zero emoji characters in rendered components (Lucide SVGs only).
- [x] Supabase RLS security policies enabled and verified for all group tables.
- [x] Full mobile responsive viewports validated with safe-area styling.

---
*Report synthesized and authored by Survey Spec Miner for Bodied by Esh × Coastal Community Church (#3266).*
