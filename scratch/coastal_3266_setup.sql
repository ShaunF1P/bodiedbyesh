-- ═════════════════════════════════════════════════════════════════════════════
-- COASTAL COMMUNITY CHURCH (#3266) FAITH & FITNESS TRACKER MIGRATION
-- Project: BodiedbyEsh.com
-- Milestone: M1 (Database Schema, Migration, Indexes, RLS & Seed Data)
-- Author: Worker M1_M2
-- Generated: 2026-08-17
-- ═════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Create Core Tables
-- ─────────────────────────────────────────────────────────────────────────────

-- 1.1 Groups Table
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
  accent_color TEXT DEFAULT '#D4B87E',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.2 Group Members Table
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'leader', 'member')),
  avatar_url TEXT,
  campus TEXT DEFAULT 'Main Campus',
  daily_step_goal INT NOT NULL DEFAULT 8000 CHECK (daily_step_goal > 0),
  is_anonymous_leaderboard BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_group_members_group_user UNIQUE (group_id, user_id)
);

-- 1.3 Step Logs Table
CREATE TABLE IF NOT EXISTS public.step_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  steps INT NOT NULL CHECK (steps >= 0 AND steps <= 150000),
  distance_miles NUMERIC(6,2) NOT NULL CHECK (distance_miles >= 0),
  active_minutes INT NOT NULL DEFAULT 0 CHECK (active_minutes >= 0),
  calories_burned INT NOT NULL DEFAULT 0 CHECK (calories_burned >= 0),
  source TEXT NOT NULL DEFAULT 'manual',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_step_logs_user_group_date UNIQUE (user_id, group_id, log_date)
);

-- 1.4 Community Encouragements Table
CREATE TABLE IF NOT EXISTS public.community_encouragements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  message TEXT NOT NULL CHECK (length(trim(message)) > 0 AND length(message) <= 1000),
  prayer_tag TEXT DEFAULT 'Encouragement',
  likes_count INT NOT NULL DEFAULT 0 CHECK (likes_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.5 Encouragement Reactions Table
CREATE TABLE IF NOT EXISTS public.encouragement_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  encouragement_id UUID NOT NULL REFERENCES public.community_encouragements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'prayer', -- 'prayer', 'heart', 'fire', 'crown', 'high_five'
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_encouragement_user_reaction UNIQUE (encouragement_id, user_id, reaction_type)
);

-- 1.6 Faith Devotionals Table ("Walking by Faith")
CREATE TABLE IF NOT EXISTS public.faith_devotionals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  day_number INT NOT NULL CHECK (day_number > 0),
  date_applicable DATE,
  title TEXT NOT NULL,
  scripture_ref TEXT NOT NULL,
  scripture_text TEXT NOT NULL,
  theme TEXT NOT NULL DEFAULT 'Faith & Movement',
  reflection_prompt TEXT NOT NULL,
  prayer_focus TEXT NOT NULL,
  walking_action TEXT NOT NULL DEFAULT 'Take a 20-minute prayer walk.',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_devotional_group_day UNIQUE (group_id, day_number)
);

-- 1.7 Devotional Reflections Table
CREATE TABLE IF NOT EXISTS public.devotional_reflections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  devotional_id TEXT NOT NULL,
  day_number INT,
  reflection_text TEXT NOT NULL CHECK (length(trim(reflection_text)) > 0 AND length(reflection_text) <= 4000),
  is_shared_to_feed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_user_group_devotional UNIQUE (user_id, group_id, devotional_id)
);

-- 1.8 Group Milestones Table (Communal)
CREATE TABLE IF NOT EXISTS public.group_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_steps BIGINT NOT NULL CHECK (target_steps > 0),
  target_miles NUMERIC(10,2) CHECK (target_miles >= 0),
  description TEXT,
  scripture_theme TEXT,
  icon_name TEXT NOT NULL DEFAULT 'Trophy',
  unlocked_at TIMESTAMPTZ,
  is_reached BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_group_milestones_group_steps UNIQUE (group_id, target_steps)
);

-- 1.9 User Milestone Unlocks Table (Personal)
CREATE TABLE IF NOT EXISTS public.user_milestone_unlocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_key TEXT NOT NULL,
  milestone_title TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  value_at_unlock BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_user_milestone_unlock UNIQUE (user_id, milestone_key)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Performance Indexes
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_step_logs_group_date ON public.step_logs (group_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_step_logs_user_group ON public.step_logs (user_id, group_id);
CREATE INDEX IF NOT EXISTS idx_step_logs_log_date ON public.step_logs (log_date);

CREATE INDEX IF NOT EXISTS idx_group_members_group_user ON public.group_members (group_id, user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members (user_id);

CREATE INDEX IF NOT EXISTS idx_encouragements_group_created ON public.community_encouragements (group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_encouragement_reactions_post ON public.encouragement_reactions (encouragement_id);

CREATE INDEX IF NOT EXISTS idx_devotionals_group_day ON public.faith_devotionals (group_id, day_number);
CREATE INDEX IF NOT EXISTS idx_reflections_user_devotional ON public.devotional_reflections (user_id, devotional_id);

CREATE INDEX IF NOT EXISTS idx_milestones_group_reached ON public.group_milestones (group_id, is_reached, target_steps);
CREATE INDEX IF NOT EXISTS idx_user_milestones_user ON public.user_milestone_unlocks (user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Stored Procedures, Aggregations & RPC Functions
-- ─────────────────────────────────────────────────────────────────────────────

-- 3.1 Group Stats Aggregator
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
  v_current_milestone RECORD;
  v_next_milestone RECORD;
BEGIN
  SELECT * INTO v_group FROM public.groups WHERE id = p_group_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Group not found');
  END IF;

  SELECT 
    COALESCE(SUM(steps), 0),
    COALESCE(SUM(distance_miles), 0),
    COALESCE(SUM(active_minutes), 0),
    COUNT(DISTINCT user_id) FILTER (WHERE log_date >= (CURRENT_DATE - (p_days || ' days')::INTERVAL)::DATE)
  INTO v_total_steps, v_total_miles, v_total_minutes, v_active_walkers
  FROM public.step_logs
  WHERE group_id = p_group_id;

  SELECT COUNT(*) INTO v_total_members
  FROM public.group_members
  WHERE group_id = p_group_id;

  SELECT COUNT(*) INTO v_total_encouragements
  FROM public.community_encouragements
  WHERE group_id = p_group_id;

  SELECT 
    COUNT(*) FILTER (WHERE is_reached = true),
    COUNT(*)
  INTO v_milestones_unlocked, v_total_milestones
  FROM public.group_milestones
  WHERE group_id = p_group_id;

  -- Highest reached milestone
  SELECT *
  INTO v_current_milestone
  FROM public.group_milestones
  WHERE group_id = p_group_id AND is_reached = true
  ORDER BY target_steps DESC
  LIMIT 1;

  -- Next upcoming milestone
  SELECT *
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
    'active_members_count', v_active_walkers,
    'total_encouragements', v_total_encouragements,
    'milestones_unlocked', v_milestones_unlocked,
    'total_milestones', v_total_milestones,
    'progress_percentage', CASE 
      WHEN v_group.target_steps > 0 THEN LEAST(100.0, ROUND((v_total_steps::NUMERIC / v_group.target_steps::NUMERIC) * 100.0, 2))
      ELSE 0.0
    END,
    'current_milestone', CASE 
      WHEN v_current_milestone.title IS NOT NULL THEN jsonb_build_object(
        'id', v_current_milestone.id,
        'title', v_current_milestone.title,
        'target_steps', v_current_milestone.target_steps,
        'target_miles', v_current_milestone.target_miles,
        'description', v_current_milestone.description,
        'scripture_theme', v_current_milestone.scripture_theme,
        'is_reached', true,
        'unlocked_at', v_current_milestone.unlocked_at
      )
      ELSE NULL
    END,
    'next_milestone', CASE 
      WHEN v_next_milestone.title IS NOT NULL THEN jsonb_build_object(
        'id', v_next_milestone.id,
        'title', v_next_milestone.title,
        'target_steps', v_next_milestone.target_steps,
        'target_miles', v_next_milestone.target_miles,
        'description', v_next_milestone.description,
        'scripture_theme', v_next_milestone.scripture_theme,
        'remaining_steps', GREATEST(0, v_next_milestone.target_steps - v_total_steps),
        'is_reached', false
      )
      ELSE NULL
    END
  );

  RETURN v_result;
END;
$$;

-- 3.2 Privacy-Preserving Leaderboard
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
  campus TEXT,
  is_anonymous BOOLEAN,
  total_steps BIGINT,
  total_miles NUMERIC(8,2),
  active_days INT,
  streak_days INT,
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
      WHEN gm.is_anonymous_leaderboard = true AND auth.uid() != gm.user_id THEN 'Faithful Walker'
      ELSE gm.display_name
    END AS display_name,
    CASE 
      WHEN gm.is_anonymous_leaderboard = true AND auth.uid() != gm.user_id THEN NULL
      ELSE gm.avatar_url
    END AS avatar_url,
    gm.campus,
    gm.is_anonymous_leaderboard AS is_anonymous,
    COALESCE(us.total_steps, 0)::BIGINT AS total_steps,
    COALESCE(us.total_miles, 0)::NUMERIC(8,2) AS total_miles,
    COALESCE(us.active_days, 0)::INT AS active_days,
    COALESCE(us.active_days, 0)::INT AS streak_days,
    (auth.uid() = gm.user_id) AS is_current_user
  FROM public.group_members gm
  LEFT JOIN user_stats us ON us.user_id = gm.user_id
  WHERE gm.group_id = p_group_id
  ORDER BY COALESCE(us.total_steps, 0) DESC, gm.joined_at ASC
  LIMIT p_limit;
END;
$$;

-- 3.3 Walking Streak Calculator
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

-- 3.4 Auto-Join Group RPC
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

  SELECT * INTO v_group FROM public.groups WHERE slug = p_group_slug AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Group not found or inactive');
  END IF;

  SELECT * INTO v_member FROM public.group_members WHERE group_id = v_group.id AND user_id = v_user_id;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'is_new', false,
      'member', row_to_json(v_member),
      'group', row_to_json(v_group)
    );
  END IF;

  IF p_display_name IS NOT NULL AND length(trim(p_display_name)) > 0 THEN
    v_resolved_name := trim(p_display_name);
  ELSE
    SELECT name INTO v_resolved_name FROM public.client_profiles WHERE user_id = v_user_id;
    IF v_resolved_name IS NULL OR length(trim(v_resolved_name)) = 0 THEN
      SELECT COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1), 'Faith Walker')
      INTO v_resolved_name
      FROM auth.users
      WHERE id = v_user_id;
    END IF;
  END IF;

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

-- 3.5 Daily Devotional Fetcher
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
  SELECT * INTO v_devotional
  FROM public.faith_devotionals
  WHERE (group_id = p_group_id OR group_id IS NULL)
    AND date_applicable = p_target_date
  LIMIT 1;

  IF FOUND THEN
    RETURN row_to_json(v_devotional)::jsonb;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.faith_devotionals
  WHERE group_id = p_group_id OR group_id IS NULL;

  IF v_count = 0 THEN
    RETURN NULL;
  END IF;

  v_day_index := (EXTRACT(DOY FROM p_target_date)::INT % v_count) + 1;

  SELECT * INTO v_devotional
  FROM public.faith_devotionals
  WHERE (group_id = p_group_id OR group_id IS NULL)
    AND day_number = v_day_index
  LIMIT 1;

  IF FOUND THEN
    RETURN row_to_json(v_devotional)::jsonb;
  END IF;

  SELECT * INTO v_devotional
  FROM public.faith_devotionals
  WHERE (group_id = p_group_id OR group_id IS NULL)
  ORDER BY day_number ASC
  LIMIT 1;

  RETURN row_to_json(v_devotional)::jsonb;
END;
$$;

-- 3.6 Automated Milestone Trigger
CREATE OR REPLACE FUNCTION public.trg_check_group_milestones()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_total_steps BIGINT;
BEGIN
  SELECT COALESCE(SUM(steps), 0)
  INTO v_group_total_steps
  FROM public.step_logs
  WHERE group_id = NEW.group_id;

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

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Row-Level Security (RLS) Policies
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.step_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_encouragements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encouragement_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faith_devotionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devotional_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_milestone_unlocks ENABLE ROW LEVEL SECURITY;

-- 4.1 Groups RLS
DROP POLICY IF EXISTS "Allow public read active groups" ON public.groups;
CREATE POLICY "Allow public read active groups" ON public.groups
  FOR SELECT TO public
  USING (is_active = true);

DROP POLICY IF EXISTS "Allow service role full access groups" ON public.groups;
CREATE POLICY "Allow service role full access groups" ON public.groups
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- 4.2 Group Members RLS
DROP POLICY IF EXISTS "Allow select group members" ON public.group_members;
CREATE POLICY "Allow select group members" ON public.group_members
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_members.group_id AND g.is_active = true
    )
  );

DROP POLICY IF EXISTS "Allow insert own group membership" ON public.group_members;
CREATE POLICY "Allow insert own group membership" ON public.group_members
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow update own group membership" ON public.group_members;
CREATE POLICY "Allow update own group membership" ON public.group_members
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow delete own group membership" ON public.group_members;
CREATE POLICY "Allow delete own group membership" ON public.group_members
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow service role full access group members" ON public.group_members;
CREATE POLICY "Allow service role full access group members" ON public.group_members
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- 4.3 Step Logs RLS
DROP POLICY IF EXISTS "Allow select step logs" ON public.step_logs;
CREATE POLICY "Allow select step logs" ON public.step_logs
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = step_logs.group_id AND gm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Allow insert own step logs" ON public.step_logs;
CREATE POLICY "Allow insert own step logs" ON public.step_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = step_logs.group_id AND gm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Allow update own step logs" ON public.step_logs;
CREATE POLICY "Allow update own step logs" ON public.step_logs
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow delete own step logs" ON public.step_logs;
CREATE POLICY "Allow delete own step logs" ON public.step_logs
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow service role full access step logs" ON public.step_logs;
CREATE POLICY "Allow service role full access step logs" ON public.step_logs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- 4.4 Community Encouragements RLS
DROP POLICY IF EXISTS "Allow read group encouragements" ON public.community_encouragements;
CREATE POLICY "Allow read group encouragements" ON public.community_encouragements
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = community_encouragements.group_id AND gm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Allow insert own encouragement" ON public.community_encouragements;
CREATE POLICY "Allow insert own encouragement" ON public.community_encouragements
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = community_encouragements.group_id AND gm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Allow delete own encouragement" ON public.community_encouragements;
CREATE POLICY "Allow delete own encouragement" ON public.community_encouragements
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow service role full access encouragements" ON public.community_encouragements;
CREATE POLICY "Allow service role full access encouragements" ON public.community_encouragements
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- 4.5 Encouragement Reactions RLS
DROP POLICY IF EXISTS "Allow select reactions" ON public.encouragement_reactions;
CREATE POLICY "Allow select reactions" ON public.encouragement_reactions
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow insert own reaction" ON public.encouragement_reactions;
CREATE POLICY "Allow insert own reaction" ON public.encouragement_reactions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow delete own reaction" ON public.encouragement_reactions;
CREATE POLICY "Allow delete own reaction" ON public.encouragement_reactions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow service role full access reactions" ON public.encouragement_reactions;
CREATE POLICY "Allow service role full access reactions" ON public.encouragement_reactions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- 4.6 Faith Devotionals RLS
DROP POLICY IF EXISTS "Allow public read faith devotionals" ON public.faith_devotionals;
CREATE POLICY "Allow public read faith devotionals" ON public.faith_devotionals
  FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "Allow service role full access devotionals" ON public.faith_devotionals;
CREATE POLICY "Allow service role full access devotionals" ON public.faith_devotionals
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- 4.7 Devotional Reflections RLS
DROP POLICY IF EXISTS "Allow read own or shared reflections" ON public.devotional_reflections;
CREATE POLICY "Allow read own or shared reflections" ON public.devotional_reflections
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR is_shared_to_feed = true);

DROP POLICY IF EXISTS "Allow insert own reflections" ON public.devotional_reflections;
CREATE POLICY "Allow insert own reflections" ON public.devotional_reflections
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow update own reflections" ON public.devotional_reflections;
CREATE POLICY "Allow update own reflections" ON public.devotional_reflections
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow delete own reflections" ON public.devotional_reflections;
CREATE POLICY "Allow delete own reflections" ON public.devotional_reflections
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 4.8 Group Milestones RLS
DROP POLICY IF EXISTS "Allow public read group milestones" ON public.group_milestones;
CREATE POLICY "Allow public read group milestones" ON public.group_milestones
  FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "Allow service role full access milestones" ON public.group_milestones;
CREATE POLICY "Allow service role full access milestones" ON public.group_milestones
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- 4.9 User Milestone Unlocks RLS
DROP POLICY IF EXISTS "Allow read own user milestones" ON public.user_milestone_unlocks;
CREATE POLICY "Allow read own user milestones" ON public.user_milestone_unlocks
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow insert own user milestones" ON public.user_milestone_unlocks;
CREATE POLICY "Allow insert own user milestones" ON public.user_milestone_unlocks
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Seed Initial Data for Coastal Community Church (#3266)
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_group_id UUID;
BEGIN
  -- Insert or fetch group
  INSERT INTO public.groups (slug, name, group_number, church_name, description, target_steps, target_miles, accent_color)
  VALUES (
    'coastal',
    'Coastal Community Church',
    '3266',
    'Coastal Community Church',
    'Walking by faith and conditioning in fellowship. Official Coastal Community Church (#3266) step and activity community.',
    10000000,
    5000.00,
    '#D4B87E'
  )
  ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      group_number = EXCLUDED.group_number,
      description = EXCLUDED.description
  RETURNING id INTO v_group_id;

  -- Insert Communal Milestones
  INSERT INTO public.group_milestones (group_id, title, target_steps, target_miles, description, scripture_theme, icon_name)
  VALUES
    (
      v_group_id,
      'The Jericho March',
      50000,
      25.00,
      'United faith breaking through strongholds. 50,000 steps walked together in community.',
      'Joshua 6:1-20 — By faith the walls of Jericho fell after the army had marched around them.',
      'Shield'
    ),
    (
      v_group_id,
      'Galilee Shoreline Trek',
      100000,
      50.00,
      'Answering the call to follow Christ in community. 100,000 steps of shared commitment.',
      'Matthew 4:18-22 — Follow me, and I will make you fishers of men.',
      'Compass'
    ),
    (
      v_group_id,
      'Mount Sinai Ascent',
      250000,
      125.00,
      'Collective elevation, endurance, and covenant stamina across our fellowship.',
      'Exodus 19:1-20 — The Lord called Moses to the top of the mountain.',
      'Mountain'
    ),
    (
      v_group_id,
      'The Road to Emmaus Journey',
      500000,
      250.00,
      'Deep fellowship, open eyes, and transformed hearts. Half a million steps walked in faith.',
      'Luke 24:13-35 — Were not our hearts burning within us while he talked with us on the road?',
      'Heart'
    ),
    (
      v_group_id,
      'The Roman Road Pilgrimage',
      1000000,
      500.00,
      'One Million Steps! Unstoppable gospel movement and collective triumph.',
      'Romans 1:16, 10:9-15 — How beautiful are the feet of those who bring good news!',
      'Crown'
    ),
    (
      v_group_id,
      'Promised Land Crossing',
      2500000,
      1250.00,
      '2.5 Million steps connecting hearts, building physical stamina, and claiming God''s promises.',
      'Joshua 1:9 — Be strong and courageous. The Lord your God is with you wherever you go.',
      'Trophy'
    )
  ON CONFLICT (group_id, target_steps) DO NOTHING;

  -- Insert 14-Day Curated Faith Devotionals
  INSERT INTO public.faith_devotionals (group_id, day_number, title, scripture_ref, scripture_text, theme, reflection_prompt, prayer_focus, walking_action)
  VALUES
    (
      v_group_id,
      1,
      'The First Step: Breaking Inertia',
      '2 Corinthians 5:7 & Genesis 12:1',
      'For we walk by faith, not by sight. — 2 Corinthians 5:7. The Lord said to Abram: Go out from your land to the land that I will show you. — Genesis 12:1',
      'Overcoming Inertia & Stepping Out in Faith',
      'What area of your physical health or spiritual life has felt stagnant, and what is one tangible step of faith you can take today?',
      'Heavenly Father, ignite my spirit and awaken my body today. Strip away complacency and fear of the unknown. As my feet strike the ground, let every stride proclaim my trust in Your unfailing guidance. In Jesus'' name, Amen.',
      'Complete a dedicated 20-minute brisk walk (aim for at least 2,500 continuous steps) while dedicating the first 5 minutes to silent gratitude.'
    ),
    (
      v_group_id,
      2,
      'Renewed Strength: Running Without Faint',
      'Isaiah 40:29-31',
      'He gives strength to the weary and increases the power of the weak. Even youths grow tired and weary, and young men stumble and fall; but those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.',
      'Divine Energy & Physical Endurance',
      'Where are you currently trying to operate in your own willpower instead of resting in the supernatural strength of the Lord?',
      'Lord God, You never grow tired or weary. When my energy flags and my schedule feels overwhelming, breathe Your resurrection life into my lungs and legs. Renew my physical stamina and my spiritual fervor today. Amen.',
      'Target 5,000 steps today. When you hit the 3,000-step mark and feel tired, repeat Isaiah 40:31 as your breathing cadence.'
    ),
    (
      v_group_id,
      3,
      'The Lighted Path: One Step at a Time',
      'Psalm 119:105 & Proverbs 3:5-6',
      'Your word is a lamp to my feet and a light to my path. — Psalm 119:105. Trust in the Lord with all your heart, and do not rely on your own understanding; in all your ways know him, and he will make your paths straight. — Proverbs 3:5-6',
      'Trusting God''s Guidance Mile by Mile',
      'What future worry is robbing you of joy and discipline in today''s daily habits?',
      'Father, keep my eyes focused on where You have placed my feet today. Deliver me from anxiety about tomorrow. Let Your Word illuminate my decisions, my nutrition, and my thoughts with every step. Amen.',
      'Take a 15-minute evening or morning "Light Walk" outdoors without headphones, observing God''s creation and meditating on Psalm 119:105.'
    ),
    (
      v_group_id,
      4,
      'The Temple of the Spirit: Living Worship',
      '1 Corinthians 6:19-20 & Romans 12:1',
      'Do you not know that your bodies are temples of the Holy Spirit, who is in you, whom you have received from God? You are not your own; you were bought at a price. Therefore honor God with your bodies.',
      'Body Stewardship & Consecrated Health',
      'How does viewing your daily fitness as an act of worship and stewardship change your motivation from vanity to devotion?',
      'Lord Jesus, You purchased me with Your precious blood. I dedicate my heartbeat, my muscles, and my energy to Your glory. Help me steward this temple with wisdom, discipline, and reverence. Amen.',
      'Pair your daily walking goal (aim for 6,000+ steps) with intentional hydration—drink at least 64oz of pure water as a tangible honoring of your temple.'
    ),
    (
      v_group_id,
      5,
      'The Shoes of Peace: Standing Grounded',
      'Ephesians 6:13-15',
      'Therefore take up the whole armor of God, that you may be able to withstand in the evil day, and having done all, to stand firm. Stand therefore... as shoes for your feet, having put on the readiness given by the gospel of peace.',
      'Spiritual Armor & Mindful Cadence',
      'What internal storm or anxiety is threatening to make you lose your footing today, and how can the Gospel of Peace anchor you?',
      'Prince of Peace, strap the footwear of Your Gospel securely to my feet. Where the ground is slippery and chaotic, make my steps firm and unwavering. Let peace guard my mind and health today. Amen.',
      'Walk a focused 3,000 steps while praying specifically for peace over your family, church, and community.'
    ),
    (
      v_group_id,
      6,
      'The Path of Life: Joy in Every Stride',
      'Psalm 16:11',
      'You reveal the path of life to me; in your presence is abundant joy; at your right hand are eternal pleasures.',
      'Gratitude, Sunlight & Daily Joy',
      'What simple blessings in your immediate physical environment can you thank God for during today''s walk?',
      'Lord of Life, fill my heart with abundant joy as I walk today. Thank You for the gift of breath, the strength in my legs, and the beauty of Your creation all around me. Amen.',
      'Go for a 25-minute sunshine walk, actively looking for 5 distinct evidences of God''s beauty in nature or your neighborhood.'
    ),
    (
      v_group_id,
      7,
      'Holy Recovery: The Sabbath Rhythm',
      'Genesis 2:2-3 & Matthew 11:28-30',
      'And on the seventh day God finished his work that he had done, and he rested on the seventh day from all his work. — Genesis 2:2. Come to me, all you who are weary and burdened, and I will give you rest. — Matthew 11:28',
      'Restorative Movement & Sabbath Renewal',
      'Are you giving your body and soul adequate rest, or are you running on the fumes of chronic stress?',
      'Gracious God, teach me the sacred rhythm of rest. I lay down my striving and quiet my racing mind. Rebuild my muscle fibers, restore my nervous system, and replenish my soul in Your presence. Amen.',
      'Perform a gentle, leisurely recovery walk (1,500 to 3,000 steps) followed by 10 minutes of lower body stretching and deep diaphragmatic breathing.'
    ),
    (
      v_group_id,
      8,
      'Walking in Fellowship: Two Are Better',
      'Ecclesiastes 4:9-12 & Hebrews 10:24-25',
      'Two are better than one, because they have a good return for their labor: If either of them falls down, one can help the other up. — Ecclesiastes 4:9-10. And let us consider how we may spur one another on toward love and good deeds. — Hebrews 10:24',
      'Community Accountability & Collective Strength',
      'Who in your church community can you reach out to today with a word of encouragement or an invitation to walk together?',
      'Lord, thank You for my Coastal Community Church family. Deliver me from the lie of isolation. Use my words and my presence to build up others and spur them on in health and faith. Amen.',
      'Send an encouraging note on the Coastal Community Feed and invite a friend or family member to walk with you today (aim for 7,500 steps).'
    ),
    (
      v_group_id,
      9,
      'Moving Mountains: Pushing Past Limits',
      'Zechariah 4:6-7 & Hebrews 12:1-2',
      'Not by might, nor by power, but by my Spirit, says the Lord of hosts. Who are you, O great mountain? Before Zerubbabel you shall become a plain. — Zechariah 4:6-7. Let us run with perseverance the race marked out for us. — Hebrews 12:1',
      'Overcoming Obstacles with Holy Grit',
      'What excuse or obstacle is threatening to derail your commitment to health and spiritual growth right now?',
      'Almighty God, when obstacles loom large before me, remind me of Your sovereign power. By Your Spirit, give me the grit to push through fatigue, self-doubt, and resistance. My eyes are fixed on Jesus. Amen.',
      'Challenge day: push for an extra 1,500 steps above your daily average, tackling an incline, stairs, or brisk intervals.'
    ),
    (
      v_group_id,
      10,
      'The Road to Emmaus: Eyes Opened in the Walk',
      'Luke 24:13-32',
      'Now that same day two of them were going to a village called Emmaus, about seven miles from Jerusalem... As they talked and discussed these things with each other, Jesus himself came up and walked along with them... Were not our hearts burning within us while he talked with us on the road?',
      'Encountering Christ in Daily Movement',
      'If Jesus were physically walking beside you for the next mile, what would you ask Him, and what would He say to your heart?',
      'Lord Jesus, walk beside me today. Open my spiritual eyes to recognize Your presence in the ordinary moments of life. Set my heart ablaze with love for Your Word and Your people. Amen.',
      'Dedicate a "Silent Stride" walk (at least 30 minutes) where you listen for God''s still, small voice without digital distractions.'
    ),
    (
      v_group_id,
      11,
      'Straight Paths: Wisdom and Daily Discipline',
      'Proverbs 4:25-27 & Colossians 4:5',
      'Let your eyes look forward; fix your gaze straight ahead. Carefully consider the path for your feet, and all your ways will be established. Don''t turn to the right or to the left; keep your feet from evil.',
      'Daily Habits & Consistency',
      'Where has subtle compromise or distraction crept into your daily routine, and how can you realign your gaze on the goal?',
      'Father, grant me holy focus and disciplined resolve. Guard my eyes from distraction and my feet from compromise. Establish my daily habits so they produce physical health and spiritual honor. Amen.',
      'Log your meals with precision alongside completing 8,000 steps today, eliminating all mindless grazing or snacking.'
    ),
    (
      v_group_id,
      12,
      'The Fruit of Endurance: Unshakable Habits',
      'Galatians 6:9 & James 1:2-4',
      'And let us not grow weary of doing good, for in due season we will reap, if we do not give up. — Galatians 6:9. Let endurance have its full effect, so that you may be mature and complete, lacking nothing. — James 1:4',
      'Steadfast Persistence & Habit Mastery',
      'What positive physical or mental changes are you already beginning to notice since committing to this faith & fitness journey?',
      'Lord, strengthen my resolve when fatigue whispers that quitting won''t matter. I choose endurance today. Let Your Spirit produce patience, discipline, and steadfast faith in my life. Amen.',
      'Complete a consistent 8,500-step day, maintaining a strong, confident posture and cadence throughout.'
    ),
    (
      v_group_id,
      13,
      'Leaping and Praising: The Gratitude Stride',
      'Acts 3:1-9 & Psalm 103:1-5',
      'Then Peter said, "Silver or gold I do not have, but what I do have I give you. In the name of Jesus Christ of Nazareth, walk." Taking him by the right hand, he helped him up, and instantly the man''s feet and ankles became strong. He jumped to his feet and began to walk. Then he went with them into the temple courts, walking and jumping, and praising God.',
      'Celebrating Physical Mobility & Praise',
      'Make a list of 10 specific physical capabilities your body has that you often take for granted.',
      'Lord God of miracles, thank You for the strength in my feet, ankles, and heart! Forgive me for complaining about workouts when movement is such a magnificent gift. I praise You with every step today! Amen.',
      'Take a "Praise & Power Walk" (aim for 9,000 to 10,000 steps). Every 1,000 steps, whisper a prayer of thanksgiving for your health and mobility.'
    ),
    (
      v_group_id,
      14,
      'The Great Commission: Ambassadors on Foot',
      'Matthew 28:18-20 & Micah 6:8',
      'Jesus came near and said to them, "All authority has been given to me in heaven and on earth. Go, therefore, and make disciples of all nations..." — Matthew 28:18-19. And what does the Lord require of you? To act justly and to love mercy and to walk humbly with your God. — Micah 6:8',
      'Lifelong Commission & Community Impact',
      'How will you carry the momentum of these 14 days into the rest of the year as a lifelong lifestyle of faith and fitness?',
      'Sovereign Lord, You have strengthened my body and renewed my spirit over these 14 days. As I go forth into my community, let my life reflect Your love, discipline, and grace. Keep me walking humbly with You all my days. In Jesus'' mighty name, Amen.',
      'Celebrate completing the 14-Day Curriculum with a 10,000-step day and post your personal reflection/testimony on the Coastal group board.'
    )
  ON CONFLICT (group_id, day_number) DO NOTHING;

END $$;
