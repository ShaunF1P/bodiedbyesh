-- ═══ DATABASE PATCH: CLIENT PROFILES RLS & CASE-INSENSITIVE AUTO-LINK ═══
-- Run this script in the Supabase SQL Editor to enable Row-Level Security (RLS),
-- configure policies for client portal access, and fix case sensitivity issues.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Enable RLS on client_profiles
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Drop existing RLS policies on client_profiles (if they exist)
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow select for owner" ON public.client_profiles;
DROP POLICY IF EXISTS "Allow update for owner" ON public.client_profiles;
DROP POLICY IF EXISTS "Allow insert for owner" ON public.client_profiles;
DROP POLICY IF EXISTS "Allow all for service role" ON public.client_profiles;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Create clean RLS policies for client_profiles
-- ─────────────────────────────────────────────────────────────────────────────

-- Allow authenticated clients to read their own profile
CREATE POLICY "Allow select for owner" ON public.client_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR LOWER(email) = LOWER(auth.jwt() ->> 'email'));

-- Allow authenticated clients to update their own profile (e.g. upload photo, update name)
CREATE POLICY "Allow update for owner" ON public.client_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR LOWER(email) = LOWER(auth.jwt() ->> 'email'))
  WITH CHECK (auth.uid() = user_id OR LOWER(email) = LOWER(auth.jwt() ->> 'email'));

-- Allow authenticated clients to insert their own profile (fallback during initial signup)
CREATE POLICY "Allow insert for owner" ON public.client_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR LOWER(email) = LOWER(auth.jwt() ->> 'email'));

-- Allow service role full access (bypasses RLS by default, but good practice to declare)
CREATE POLICY "Allow all for service role" ON public.client_profiles
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Fix Casing & Casing-mismatch inhandle_new_user_signup trigger
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Check if a profile with this email already exists (pre-created by Coach Esh)
  -- Uses LOWER() to ensure case-insensitivity (e.g., matching "Brina@gmail.com" with "brina@gmail.com")
  IF EXISTS (SELECT 1 FROM public.client_profiles WHERE LOWER(email) = LOWER(new.email)) THEN
    UPDATE public.client_profiles
    SET user_id = new.id,
        name = COALESCE(new.raw_user_meta_data->>'full_name', name)
    WHERE LOWER(email) = LOWER(new.email);
  ELSE
    -- Create a brand new profile
    INSERT INTO public.client_profiles (user_id, email, name)
    VALUES (
      new.id,
      LOWER(new.email),
      COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
    );
  END IF;
  RETURN new;
END;
$$;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();
