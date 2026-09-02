-- =============================================================================
-- Bodied by Esh — Digital Clinical Client Intake Persistence DDL & RLS Policies
-- Target Table: public.client_intakes
-- =============================================================================

-- 1. Create client_intakes table
CREATE TABLE IF NOT EXISTS public.client_intakes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  track TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  intake_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  waiver_signed BOOLEAN NOT NULL DEFAULT false,
  waiver_signature TEXT,
  waiver_signed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'enrolled', 'archived')),
  coach_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create Performance & Search Indexes
CREATE INDEX IF NOT EXISTS idx_client_intakes_track ON public.client_intakes (track);
CREATE INDEX IF NOT EXISTS idx_client_intakes_status ON public.client_intakes (status);
CREATE INDEX IF NOT EXISTS idx_client_intakes_client_email ON public.client_intakes (LOWER(client_email));
CREATE INDEX IF NOT EXISTS idx_client_intakes_created_at ON public.client_intakes (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_intakes_intake_data ON public.client_intakes USING gin (intake_data);

-- 3. Automatic updated_at Trigger Function
CREATE OR REPLACE FUNCTION public.trg_set_updated_at_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_client_intakes_update ON public.client_intakes;
CREATE TRIGGER on_client_intakes_update
  BEFORE UPDATE ON public.client_intakes
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_set_updated_at_timestamp();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.client_intakes ENABLE ROW LEVEL SECURITY;

-- 4.1 Public Insert Policy: Allow anonymous client submissions from intake forms
DROP POLICY IF EXISTS "Allow public insert client intakes" ON public.client_intakes;
CREATE POLICY "Allow public insert client intakes" ON public.client_intakes
  FOR INSERT TO public
  WITH CHECK (true);

-- 4.2 Admin Read Policy: Allow authenticated users with admin role in app_metadata to read all intakes
DROP POLICY IF EXISTS "Allow admin read client intakes" ON public.client_intakes;
CREATE POLICY "Allow admin read client intakes" ON public.client_intakes
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 4.3 Admin Update Policy: Allow admins to update intake status & coach notes
DROP POLICY IF EXISTS "Allow admin update client intakes" ON public.client_intakes;
CREATE POLICY "Allow admin update client intakes" ON public.client_intakes
  FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 4.4 Admin Delete Policy: Allow admins to delete archived intakes
DROP POLICY IF EXISTS "Allow admin delete client intakes" ON public.client_intakes;
CREATE POLICY "Allow admin delete client intakes" ON public.client_intakes
  FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 4.5 Service Role Bypass Policy: Full access for server-side API route handlers
DROP POLICY IF EXISTS "Allow service role full access client intakes" ON public.client_intakes;
CREATE POLICY "Allow service role full access client intakes" ON public.client_intakes
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
