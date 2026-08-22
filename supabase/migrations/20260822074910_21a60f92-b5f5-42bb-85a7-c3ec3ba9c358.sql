ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS sensitivity TEXT NOT NULL DEFAULT 'moderate',
  ADD COLUMN IF NOT EXISTS prefer_cleaner TEXT NOT NULL DEFAULT 'sometimes',
  ADD COLUMN IF NOT EXISTS max_extra_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS onboarded BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS home_city TEXT;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_sensitivity_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_sensitivity_check CHECK (sensitivity IN ('low','moderate','high','very_high'));
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_prefer_cleaner_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_prefer_cleaner_check CHECK (prefer_cleaner IN ('yes','sometimes','no'));

CREATE TABLE IF NOT EXISTS public.saved_places (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  address TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lon DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_places TO authenticated;
GRANT ALL ON public.saved_places TO service_role;

ALTER TABLE public.saved_places ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own saved places" ON public.saved_places;
CREATE POLICY "Users manage their own saved places" ON public.saved_places
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.route_history
  ADD COLUMN IF NOT EXISTS eco_score NUMERIC,
  ADD COLUMN IF NOT EXISTS chosen_route_kind TEXT;