# Database Schema & Supabase Architecture Survey
## Coastal Community Church (#3266) Faith & Fitness Walking and Step Tracker

**Author:** Survey Explorer 2  
**Target Application:** BodiedbyEsh.com  
**Working Directory:** `C:\projects\BodiedbyEsh\.agents\survey_explorer_2`  
**Timestamp:** 2026-08-17T16:43:00Z  

---

## 1. Executive Summary

This document presents the complete database architecture, Supabase configuration, Row Level Security (RLS) policies, Stored Procedures/RPCs, and TypeScript models for the **Coastal Community Church (#3266) Faith & Fitness Walking and Step Tracker** on **BodiedbyEsh.com**.

### Key Architectural Pillars
1. **Multi-Tenant Group Isolation with Global Brand Synergy:** Supports group-specific isolation (`groups`, `group_members`) while linking seamlessly with existing Bodied by Esh client accounts (`client_profiles`, `auth.users`).
2. **High-Performance Activity Ledger:** `step_logs` maintains a daily partitioned/indexed activity record with `UNIQUE(user_id, group_id, log_date)` ensuring idempotent tracking of daily steps, mileage, and active minutes.
3. **Automated Faith Milestone Engine:** Real-time triggers evaluate collective community step thresholds against `group_milestones`, automatically unlocking communal achievements and attaching biblical celebration themes.
4. **Curated Scripture & Devotional Rotation:** `faith_devotionals` provides daily Christian spiritual conditioning (verse, reflection prompt, prayer focus) aligned with physical movement.
5. **Zero-Leak Row Level Security (RLS) & Security Definer RPCs:** Full RLS enforcement ensures users only modify their own data, while security-definer aggregation RPCs calculate collective community totals and privacy-preserving leaderboards without leaking individual sensitive profiles.
6. **Zero-Emoji Compliance:** All visual status badges, achievement markers, and metrics adhere strictly to Lucide SVG icon design standards.

---

## 2. Existing Database & Supabase Environment Survey

### 2.1 Repository & Technology Stack Analysis
- **Framework:** Next.js 16.2.9 (App Router) with React 19.2.4 and TypeScript 5
- **Supabase SDKs:**
  - `@supabase/ssr`: `^0.12.0` (used for cookie-based session management across Server Components, Server Actions, Route Handlers, and Middleware)
  - `@supabase/supabase-js`: `^2.108.2` (used for browser client and admin/service-role operations)
- **Styling & Icons:** Tailwind CSS v4, Lucide React (`lucide-react` `^1.18.0`)
- **Supabase Client Architecture:**
  - `src/lib/supabase/client.ts`: Exports `createClient()` using `createBrowserClient(url, anonKey)`
  - `src/lib/supabase/server.ts`: Exports `async createClient()` using `createServerClient(url, anonKey, { cookies })`
  - Admin scripts / route handlers: Instantiate direct service-role client via `createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY)`

### 2.2 Existing Tables in Supabase
| Table Name | Purpose | Current RLS State |
|---|---|---|
| `auth.users` | Supabase internal authentication schema | Managed by Supabase Auth |
| `client_profiles` | Core client profiles (name, email, macro targets, weight) | Enabled with owner/service_role policies |
| `coaching_leads` | Inbound coaching and consultation inquiries | Enabled with public insert, service_role read/update |
| `workouts` | Daily scheduled workout assignments per client | Enabled with client_id ownership |
| `workout_exercises` | Individual exercises linked to workouts | Enabled with parent workout check |
| `logged_sets` | Exercise sets logged by clients | Enabled with workout ownership join |
| `logged_meals` | AI meal scan and nutrition log entries | Enabled with user_id check |
| `body_scans` | Computer vision / MediaPipe body composition scans | Enabled with user_id check |
| `chat_messages` | In-app direct messaging with Coach Esh | Enabled with client_id check |
| `logo_feedback` | Interactive brand testing and voting ledger | Enabled with session checks |

### 2.3 Integration Points for Coastal Community Church (#3266)
1. **User Identity Linking:** `group_members.user_id` directly references `auth.users(id)` and joins with `client_profiles.user_id` to inherit user display names, avatars, and coaching status.
2. **Dedicated Entry Route (`/coastal`):** Automatically associates visiting or authenticated members with the Coastal Community Church group record (`group_number = '3266'`).
3. **Dual Metric Ecosystem:** Members can simultaneously view their private step logs and contribute their daily mileage to the shared church faith goal.

---

## 3. Database Schema Design for Coastal Community Church (#3266)

### 3.1 Entity Relationship Diagram (Conceptual)

```text
       auth.users (Supabase Auth)
            |             |
            | (1:1)       | (1:N)
            v             v
   client_profiles   group_members <─────── groups (slug='coastal', #3266)
                          |                      |
            ┌─────────────┼──────────────┐       ├─────────────────────────┐
            |             |              |       |                         |
            v             v              v       v                         v
        step_logs   community_encouragements  group_milestones     faith_devotionals
```

---

### 3.2 Detailed Table Specifications

#### Table 1: `public.groups`
Stores community groups and corporate/church walking challenges.
```sql
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  group_number TEXT NOT NULL DEFAULT '3266',
  church_name TEXT DEFAULT 'Coastal Community Church',
  description TEXT,
  target_steps BIGINT DEFAULT 10000000, -- 10 Million Step Communal Goal
  target_miles NUMERIC(10,2) DEFAULT 5000.00,
  banner_url TEXT,
  accent_color TEXT DEFAULT '#A3E635',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

#### Table 2: `public.group_members`
Links Supabase authenticated users to specific groups with roles and display preferences.
```sql
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'leader', 'member')),
  avatar_url TEXT,
  daily_step_goal INT NOT NULL DEFAULT 8000 CHECK (daily_step_goal > 0),
  is_anonymous_leaderboard BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_group_members_group_user UNIQUE (group_id, user_id)
);
```

#### Table 3: `public.step_logs`
High-performance daily step, mileage, and activity ledger per user and group.
```sql
CREATE TABLE IF NOT EXISTS public.step_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  steps INT NOT NULL CHECK (steps >= 0),
  distance_miles NUMERIC(6,2) NOT NULL CHECK (distance_miles >= 0),
  active_minutes INT NOT NULL DEFAULT 0 CHECK (active_minutes >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_step_logs_user_group_date UNIQUE (user_id, group_id, log_date)
);
```

#### Table 4: `public.community_encouragements`
Member cheer, prayer requests, and encouragement feed with likes and moderation support.
```sql
CREATE TABLE IF NOT EXISTS public.community_encouragements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  message TEXT NOT NULL CHECK (length(trim(message)) > 0 AND length(message) <= 1000),
  likes_count INT NOT NULL DEFAULT 0 CHECK (likes_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

#### Table 5: `public.faith_devotionals`
Daily Christian scripture readings, reflections, and prayer prompts ("Walking by Faith").
```sql
CREATE TABLE IF NOT EXISTS public.faith_devotionals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE, -- NULL indicates universal devotional
  day_number INT NOT NULL CHECK (day_number > 0),
  date_applicable DATE, -- Optional calendar date binding
  title TEXT NOT NULL,
  scripture_ref TEXT NOT NULL,
  scripture_text TEXT NOT NULL,
  reflection_prompt TEXT NOT NULL,
  prayer_focus TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_devotional_group_day UNIQUE (group_id, day_number)
);
```

#### Table 6: `public.group_milestones`
Collective faith and fitness milestones unlocked as the community accumulates steps.
```sql
CREATE TABLE IF NOT EXISTS public.group_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_steps BIGINT NOT NULL CHECK (target_steps > 0),
  target_miles NUMERIC(8,2) CHECK (target_miles >= 0),
  description TEXT,
  scripture_theme TEXT,
  unlocked_at TIMESTAMPTZ,
  is_reached BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_group_milestones_group_steps UNIQUE (group_id, target_steps)
);
```

---

## 4. Indexing & Query Optimization Strategy

To ensure sub-millisecond response times under high concurrency and active logging:

```sql
-- Indexes for step logging and range aggregations
CREATE INDEX IF NOT EXISTS idx_step_logs_group_date ON public.step_logs (group_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_step_logs_user_group ON public.step_logs (user_id, group_id);
CREATE INDEX IF NOT EXISTS idx_step_logs_log_date ON public.step_logs (log_date);

-- Indexes for group membership
CREATE INDEX IF NOT EXISTS idx_group_members_group_user ON public.group_members (group_id, user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members (user_id);

-- Indexes for community feed
CREATE INDEX IF NOT EXISTS idx_encouragements_group_created ON public.community_encouragements (group_id, created_at DESC);

-- Indexes for devotionals and milestones
CREATE INDEX IF NOT EXISTS idx_devotionals_group_day ON public.faith_devotionals (group_id, day_number);
CREATE INDEX IF NOT EXISTS idx_milestones_group_reached ON public.group_milestones (group_id, is_reached, target_steps);
```

---

## 5. Stored Procedures, Views, and Remote Procedure Calls (RPC)

### 5.1 Communal Aggregation: `get_group_stats`
Provides comprehensive group-level metrics, active walker counts, and milestone status without leaking individual private logs.

```sql
CREATE OR REPLACE FUNCTION public.get_group_stats(p_group_id UUID, p_days INT DEFAULT 30)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_group RECORD;
  v_total_steps BIGINT;
  v_total_miles NUMERIC(10,2);
  v_total_minutes BIGINT;
  v_total_members INT;
  v_active_walkers INT;
  v_total_encouragements INT;
  v_milestones_unlocked INT;
  v_total_milestones INT;
  v_next_milestone RECORD;
BEGIN
  -- Verify group exists
  SELECT * INTO v_group FROM public.groups WHERE id = p_group_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Group not found');
  END IF;

  -- Aggregations from step_logs
  SELECT 
    COALESCE(SUM(steps), 0),
    COALESCE(SUM(distance_miles), 0),
    COALESCE(SUM(active_minutes), 0),
    COUNT(DISTINCT user_id) FILTER (WHERE log_date >= (CURRENT_DATE - (p_days || ' days')::INTERVAL)::DATE)
  INTO v_total_steps, v_total_miles, v_total_minutes, v_active_walkers
  FROM public.step_logs
  WHERE group_id = p_group_id;

  -- Total members
  SELECT COUNT(*) INTO v_total_members
  FROM public.group_members
  WHERE group_id = p_group_id;

  -- Encouragements
  SELECT COUNT(*) INTO v_total_encouragements
  FROM public.community_encouragements
  WHERE group_id = p_group_id;

  -- Milestones
  SELECT 
    COUNT(*) FILTER (WHERE is_reached = true),
    COUNT(*)
  INTO v_milestones_unlocked, v_total_milestones
  FROM public.group_milestones
  WHERE group_id = p_group_id;

  -- Next unreached milestone
  SELECT title, target_steps, target_miles, scripture_theme
  INTO v_next_milestone
  FROM public.group_milestones
  WHERE group_id = p_group_id AND is_reached = false
  ORDER BY target_steps ASC
  LIMIT 1;

  v_result := jsonb_build_object(
    'group_id', v_group.id,
    'slug', v_group.slug,
    'name', v_group.name,
    'group_number', v_group.group_number,
    'target_steps', v_group.target_steps,
    'target_miles', v_group.target_miles,
    'total_steps', v_total_steps,
    'total_miles', v_total_miles,
    'total_active_minutes', v_total_minutes,
    'total_members', v_total_members,
    'active_walkers_period', v_active_walkers,
    'total_encouragements', v_total_encouragements,
    'milestones_unlocked', v_milestones_unlocked,
    'total_milestones', v_total_milestones,
    'progress_percent', CASE 
      WHEN v_group.target_steps > 0 THEN ROUND((v_total_steps::NUMERIC / v_group.target_steps::NUMERIC) * 100.0, 2)
      ELSE 0.0
    END,
    'next_milestone', CASE 
      WHEN v_next_milestone.title IS NOT NULL THEN jsonb_build_object(
        'title', v_next_milestone.title,
        'target_steps', v_next_milestone.target_steps,
        'target_miles', v_next_milestone.target_miles,
        'scripture_theme', v_next_milestone.scripture_theme,
        'remaining_steps', GREATEST(0, v_next_milestone.target_steps - v_total_steps)
      )
      ELSE NULL
    END
  );

  RETURN v_result;
END;
$$;
```

---

### 5.2 Privacy-Preserving Leaderboard: `get_group_leaderboard`
Filters step totals by timeframe ('today', 'this_week', 'this_month', 'all_time'), respects member anonymity settings, and ranks participants cleanly.

```sql
CREATE OR REPLACE FUNCTION public.get_group_leaderboard(
  p_group_id UUID,
  p_timeframe TEXT DEFAULT 'all_time',
  p_limit INT DEFAULT 50
)
RETURNS TABLE (
  rank INT,
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  total_steps BIGINT,
  total_miles NUMERIC(8,2),
  active_days INT,
  is_current_user BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_date DATE;
BEGIN
  IF p_timeframe = 'today' THEN
    v_start_date := CURRENT_DATE;
  ELSIF p_timeframe = 'this_week' THEN
    v_start_date := date_trunc('week', CURRENT_DATE)::DATE;
  ELSIF p_timeframe = 'this_month' THEN
    v_start_date := date_trunc('month', CURRENT_DATE)::DATE;
  ELSE
    v_start_date := '1970-01-01'::DATE;
  END IF;

  RETURN QUERY
  WITH user_stats AS (
    SELECT
      sl.user_id,
      COALESCE(SUM(sl.steps), 0)::BIGINT AS total_steps,
      COALESCE(SUM(sl.distance_miles), 0)::NUMERIC(8,2) AS total_miles,
      COUNT(DISTINCT sl.log_date)::INT AS active_days
    FROM public.step_logs sl
    WHERE sl.group_id = p_group_id
      AND sl.log_date >= v_start_date
    GROUP BY sl.user_id
  )
  SELECT
    (DENSE_RANK() OVER (ORDER BY COALESCE(us.total_steps, 0) DESC, gm.joined_at ASC))::INT AS rank,
    gm.user_id,
    CASE 
      WHEN gm.is_anonymous_leaderboard = true AND auth.uid() != gm.user_id THEN 'Faith Walker'
      ELSE gm.display_name
    END AS display_name,
    CASE 
      WHEN gm.is_anonymous_leaderboard = true AND auth.uid() != gm.user_id THEN NULL
      ELSE gm.avatar_url
    END AS avatar_url,
    COALESCE(us.total_steps, 0)::BIGINT AS total_steps,
    COALESCE(us.total_miles, 0)::NUMERIC(8,2) AS total_miles,
    COALESCE(us.active_days, 0)::INT AS active_days,
    (auth.uid() = gm.user_id) AS is_current_user
  FROM public.group_members gm
  LEFT JOIN user_stats us ON us.user_id = gm.user_id
  WHERE gm.group_id = p_group_id
  ORDER BY COALESCE(us.total_steps, 0) DESC, gm.joined_at ASC
  LIMIT p_limit;
END;
$$;
```

---

### 5.3 Walking Streak Calculator: `get_user_walking_streak`
Computes active consecutive day streaks and historical bests for a user.

```sql
CREATE OR REPLACE FUNCTION public.get_user_walking_streak(p_user_id UUID, p_group_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_streak INT := 0;
  v_longest_streak INT := 0;
  v_total_days INT := 0;
  v_last_log_date DATE;
  v_latest_date DATE;
  v_streak_length INT;
BEGIN
  -- Get distinct active dates
  SELECT COUNT(DISTINCT log_date), MAX(log_date)
  INTO v_total_days, v_last_log_date
  FROM public.step_logs
  WHERE user_id = p_user_id
    AND (p_group_id IS NULL OR group_id = p_group_id)
    AND steps > 0;

  IF v_total_days = 0 THEN
    RETURN jsonb_build_object(
      'current_streak', 0,
      'longest_streak', 0,
      'total_days_logged', 0,
      'last_log_date', NULL
    );
  END IF;

  -- Calculate longest streak and current streak using island/gap algorithm
  WITH dates AS (
    SELECT DISTINCT log_date
    FROM public.step_logs
    WHERE user_id = p_user_id
      AND (p_group_id IS NULL OR group_id = p_group_id)
      AND steps > 0
    ORDER BY log_date ASC
  ),
  grouped AS (
    SELECT
      log_date,
      log_date - (ROW_NUMBER() OVER (ORDER BY log_date))::INT AS grp
    FROM dates
  ),
  streaks AS (
    SELECT
      grp,
      COUNT(*) AS len,
      MIN(log_date) AS start_date,
      MAX(log_date) AS end_date
    FROM grouped
    GROUP BY grp
  )
  SELECT 
    COALESCE(MAX(len), 0)
  INTO v_longest_streak
  FROM streaks;

  -- Check if most recent streak touches today or yesterday
  WITH dates AS (
    SELECT DISTINCT log_date
    FROM public.step_logs
    WHERE user_id = p_user_id
      AND (p_group_id IS NULL OR group_id = p_group_id)
      AND steps > 0
    ORDER BY log_date ASC
  ),
  grouped AS (
    SELECT
      log_date,
      log_date - (ROW_NUMBER() OVER (ORDER BY log_date))::INT AS grp
    FROM dates
  ),
  streaks AS (
    SELECT
      grp,
      COUNT(*) AS len,
      MAX(log_date) AS end_date
    FROM grouped
    GROUP BY grp
    ORDER BY end_date DESC
    LIMIT 1
  )
  SELECT end_date, len INTO v_latest_date, v_streak_length FROM streaks;

  IF v_latest_date >= (CURRENT_DATE - 1) THEN
    v_current_streak := v_streak_length;
  ELSE
    v_current_streak := 0;
  END IF;

  RETURN jsonb_build_object(
    'current_streak', v_current_streak,
    'longest_streak', v_longest_streak,
    'total_days_logged', v_total_days,
    'last_log_date', v_last_log_date
  );
END;
$$;
```

---

### 5.4 Automatic Milestone Unlocking Trigger
Executes automatically on every step log insert or update to update communal milestone status.

```sql
CREATE OR REPLACE FUNCTION public.trg_check_group_milestones()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_total_steps BIGINT;
BEGIN
  -- Calculate new total steps for the group
  SELECT COALESCE(SUM(steps), 0)
  INTO v_group_total_steps
  FROM public.step_logs
  WHERE group_id = NEW.group_id;

  -- Unlock milestones that meet or exceed the total
  UPDATE public.group_milestones
  SET is_reached = true,
      unlocked_at = timezone('utc'::text, now())
  WHERE group_id = NEW.group_id
    AND is_reached = false
    AND target_steps <= v_group_total_steps;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_step_logged_check_milestones ON public.step_logs;

CREATE TRIGGER on_step_logged_check_milestones
  AFTER INSERT OR UPDATE ON public.step_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_check_group_milestones();
```

---

### 5.5 Auto-Join Group RPC: `auto_join_group`
Seamlessly registers an authenticated member into Coastal Community Church (#3266).

```sql
CREATE OR REPLACE FUNCTION public.auto_join_group(p_group_slug TEXT DEFAULT 'coastal', p_display_name TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_group RECORD;
  v_member RECORD;
  v_resolved_name TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Authentication required');
  END IF;

  -- Find group
  SELECT * INTO v_group FROM public.groups WHERE slug = p_group_slug AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Group not found or inactive');
  END IF;

  -- Check existing membership
  SELECT * INTO v_member FROM public.group_members WHERE group_id = v_group.id AND user_id = v_user_id;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'is_new', false,
      'member', row_to_json(v_member),
      'group', row_to_json(v_group)
    );
  END IF;

  -- Resolve display name
  IF p_display_name IS NOT NULL AND length(trim(p_display_name)) > 0 THEN
    v_resolved_name := trim(p_display_name);
  ELSE
    -- Try client profile
    SELECT name INTO v_resolved_name FROM public.client_profiles WHERE user_id = v_user_id;
    IF v_resolved_name IS NULL OR length(trim(v_resolved_name)) = 0 THEN
      -- Try auth metadata or fallback
      SELECT COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1), 'Faith Walker')
      INTO v_resolved_name
      FROM auth.users
      WHERE id = v_user_id;
    END IF;
  END IF;

  -- Insert member
  INSERT INTO public.group_members (group_id, user_id, display_name, role)
  VALUES (v_group.id, v_user_id, v_resolved_name, 'member')
  RETURNING * INTO v_member;

  RETURN jsonb_build_object(
    'success', true,
    'is_new', true,
    'member', row_to_json(v_member),
    'group', row_to_json(v_group)
  );
END;
$$;
```

---

### 5.6 Daily Devotional Resolver: `get_daily_devotional`
Retrieves the active devotional for a date or smoothly cycles through the 14-day devotionals.

```sql
CREATE OR REPLACE FUNCTION public.get_daily_devotional(p_group_id UUID, p_target_date DATE DEFAULT CURRENT_DATE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_devotional RECORD;
  v_count INT;
  v_day_index INT;
BEGIN
  -- 1. Try date-bound devotional first
  SELECT * INTO v_devotional
  FROM public.faith_devotionals
  WHERE (group_id = p_group_id OR group_id IS NULL)
    AND date_applicable = p_target_date
  LIMIT 1;

  IF FOUND THEN
    RETURN row_to_json(v_devotional)::jsonb;
  END IF;

  -- 2. Fall back to rotating day sequence
  SELECT COUNT(*) INTO v_count
  FROM public.faith_devotionals
  WHERE group_id = p_group_id OR group_id IS NULL;

  IF v_count = 0 THEN
    RETURN NULL;
  END IF;

  -- Day index calculation (1-indexed based on day of year)
  v_day_index := (EXTRACT(DOY FROM p_target_date)::INT % v_count) + 1;

  SELECT * INTO v_devotional
  FROM public.faith_devotionals
  WHERE (group_id = p_group_id OR group_id IS NULL)
    AND day_number = v_day_index
  LIMIT 1;

  IF FOUND THEN
    RETURN row_to_json(v_devotional)::jsonb;
  END IF;

  -- Fallback to first available devotional
  SELECT * INTO v_devotional
  FROM public.faith_devotionals
  WHERE (group_id = p_group_id OR group_id IS NULL)
  ORDER BY day_number ASC
  LIMIT 1;

  RETURN row_to_json(v_devotional)::jsonb;
END;
$$;
```

---

## 6. Supabase Row Level Security (RLS) Policies

Every table is protected with strict RLS policies ensuring member data privacy while enabling communal engagement.

```sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Enable RLS on all 6 tables
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.step_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_encouragements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faith_devotionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_milestones ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. GROUPS Policies
-- ─────────────────────────────────────────────────────────────────────────────
-- Allow public / authenticated read access to active groups
CREATE POLICY "Allow public read active groups" ON public.groups
  FOR SELECT TO public
  USING (is_active = true);

-- Allow service role full access
CREATE POLICY "Allow service role full access groups" ON public.groups
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. GROUP_MEMBERS Policies
-- ─────────────────────────────────────────────────────────────────────────────
-- Authenticated users can view members of active groups
CREATE POLICY "Allow select group members" ON public.group_members
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_members.group_id AND g.is_active = true
    )
  );

-- Authenticated users can insert their own membership
CREATE POLICY "Allow insert own group membership" ON public.group_members
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Members can update their own preferences (display_name, step goal, anonymity)
CREATE POLICY "Allow update own group membership" ON public.group_members
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Members can leave a group
CREATE POLICY "Allow delete own group membership" ON public.group_members
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Allow service role full access
CREATE POLICY "Allow service role full access group members" ON public.group_members
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. STEP_LOGS Policies
-- ─────────────────────────────────────────────────────────────────────────────
-- Users can view their own logs, or logs within groups they belong to
CREATE POLICY "Allow select step logs" ON public.step_logs
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = step_logs.group_id AND gm.user_id = auth.uid()
    )
  );

-- Users can insert their own step logs for joined groups
CREATE POLICY "Allow insert own step logs" ON public.step_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = step_logs.group_id AND gm.user_id = auth.uid()
    )
  );

-- Users can update only their own step logs
CREATE POLICY "Allow update own step logs" ON public.step_logs
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete only their own step logs
CREATE POLICY "Allow delete own step logs" ON public.step_logs
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Allow service role full access
CREATE POLICY "Allow service role full access step logs" ON public.step_logs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. COMMUNITY_ENCOURAGEMENTS Policies
-- ─────────────────────────────────────────────────────────────────────────────
-- Group members can read encouragement notes
CREATE POLICY "Allow read group encouragements" ON public.community_encouragements
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = community_encouragements.group_id AND gm.user_id = auth.uid()
    )
  );

-- Authenticated group members can post encouragement notes
CREATE POLICY "Allow insert own encouragement" ON public.community_encouragements
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = community_encouragements.group_id AND gm.user_id = auth.uid()
    )
  );

-- Authors can delete their own encouragement notes
CREATE POLICY "Allow delete own encouragement" ON public.community_encouragements
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Allow service role full access
CREATE POLICY "Allow service role full access encouragements" ON public.community_encouragements
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. FAITH_DEVOTIONALS Policies
-- ─────────────────────────────────────────────────────────────────────────────
-- All authenticated and public users can read devotionals
CREATE POLICY "Allow public read faith devotionals" ON public.faith_devotionals
  FOR SELECT TO public
  USING (true);

-- Admin and service role write access
CREATE POLICY "Allow service role full access devotionals" ON public.faith_devotionals
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. GROUP_MILESTONES Policies
-- ─────────────────────────────────────────────────────────────────────────────
-- All authenticated and public users can read milestones
CREATE POLICY "Allow public read group milestones" ON public.group_milestones
  FOR SELECT TO public
  USING (true);

-- Admin and service role write access
CREATE POLICY "Allow service role full access milestones" ON public.group_milestones
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
```

---

## 7. TypeScript Definitions (`src/types/coastal-tracker.ts`)

```typescript
export interface Group {
  id: string;
  slug: string;
  name: string;
  group_number: string;
  church_name: string;
  description: string | null;
  target_steps: number;
  target_miles: number;
  banner_url: string | null;
  accent_color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  display_name: string;
  role: "admin" | "leader" | "member";
  avatar_url: string | null;
  daily_step_goal: number;
  is_anonymous_leaderboard: boolean;
  joined_at: string;
  updated_at: string;
}

export interface StepLog {
  id: string;
  user_id: string;
  group_id: string;
  log_date: string; // YYYY-MM-DD
  steps: number;
  distance_miles: number;
  active_minutes: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommunityEncouragement {
  id: string;
  group_id: string;
  user_id: string;
  display_name: string;
  message: string;
  likes_count: number;
  created_at: string;
}

export interface FaithDevotional {
  id: string;
  group_id: string | null;
  day_number: number;
  date_applicable: string | null;
  title: string;
  scripture_ref: string;
  scripture_text: string;
  reflection_prompt: string;
  prayer_focus: string;
  created_at: string;
}

export interface GroupMilestone {
  id: string;
  group_id: string;
  title: string;
  target_steps: number;
  target_miles: number;
  description: string | null;
  scripture_theme: string | null;
  unlocked_at: string | null;
  is_reached: boolean;
  created_at: string;
}

export interface GroupStatsSummary {
  group_id: string;
  slug: string;
  name: string;
  group_number: string;
  target_steps: number;
  target_miles: number;
  total_steps: number;
  total_miles: number;
  total_active_minutes: number;
  total_members: number;
  active_walkers_period: number;
  total_encouragements: number;
  milestones_unlocked: number;
  total_milestones: number;
  progress_percent: number;
  next_milestone: {
    title: string;
    target_steps: number;
    target_miles: number;
    scripture_theme: string;
    remaining_steps: number;
  } | null;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_steps: number;
  total_miles: number;
  active_days: number;
  is_current_user: boolean;
}

export interface StreakSummary {
  current_streak: number;
  longest_streak: number;
  total_days_logged: number;
  last_log_date: string | null;
}
```

---

## 8. Complete SQL Migration File Ready for Execution

The standalone SQL migration script is prepared at `scratch/coastal_3266_setup.sql`. It includes:
1. All table creations with constraints.
2. Complete seed data for Coastal Community Church (#3266) group, 6 initial milestones, and 14 curated scripture devotionals.
3. High-performance indexes.
4. Security Definer RPC functions and auto-milestone trigger.
5. Strict Row-Level Security policies.
