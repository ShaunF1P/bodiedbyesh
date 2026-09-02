-- ==============================================================================
-- Park Schedule Persistence DDL & RLS Security Policies
-- Bodied by Esh Platform
-- Table: public.park_config
-- ==============================================================================

-- Create park_config table
CREATE TABLE IF NOT EXISTS public.park_config (
  id text PRIMARY KEY DEFAULT 'primary',
  active_park jsonb NOT NULL,
  schedule jsonb NOT NULL,
  what_to_bring jsonb NOT NULL,
  coach_notes text,
  is_accepting_new_clients boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed initial row from production baseline
INSERT INTO public.park_config (
  id,
  active_park,
  schedule,
  what_to_bring,
  coach_notes,
  is_accepting_new_clients,
  updated_at
)
VALUES (
  'primary',
  '{"name": "Merrit Park", "city": "Delray Beach, FL", "address": "601 N Congress Ave, Delray Beach, FL 33445", "meetingSpot": "Grassy area near the east pavilion by the playground", "googleMapsUrl": "https://maps.google.com/?q=Merrit+Park+Delray+Beach+FL"}'::jsonb,
  '[{"day": "Monday & Wednesday", "time": "6:15 PM", "duration": "60 min"}, {"day": "Tuesday & Thursday", "time": "6:15 PM", "duration": "60 min"}]'::jsonb,
  '["Personal training mat", "Water bottle (hydration is non-negotiable)", "Booty bands", "Training gloves (if needed)"]'::jsonb,
  'Limited spots available! Sessions start exactly 10 minutes after kids drop-off. Arrive 5 minutes early to warm up. Rain policy: if it is lightning, we reschedule via SMS within 1 hour.',
  true,
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE public.park_config ENABLE ROW LEVEL SECURITY;

-- 1. Public Read Policy: Allow anyone (authenticated or anonymous) to view active park schedule
DROP POLICY IF EXISTS "Allow public read park config" ON public.park_config;
CREATE POLICY "Allow public read park config" ON public.park_config
  FOR SELECT USING (true);

-- 2. Admin Write Policy: Allow users with 'admin' role in app_metadata to insert/update park config
DROP POLICY IF EXISTS "Allow admin write park config" ON public.park_config;
CREATE POLICY "Allow admin write park config" ON public.park_config
  FOR ALL USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- 3. Service Role Bypass Policy: Full access for server-side service role operations
DROP POLICY IF EXISTS "Allow service role full access park config" ON public.park_config;
CREATE POLICY "Allow service role full access park config" ON public.park_config
  FOR ALL USING (true);
