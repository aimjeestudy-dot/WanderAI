-- ============================================================
-- Supabase Schema for Personalized Travel Itinerary Planner
-- Paste this script into your Supabase Dashboard -> SQL Editor
-- ============================================================

-- 1. Create table for saved itineraries
CREATE TABLE IF NOT EXISTS public.itineraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    destination TEXT NOT NULL,
    duration_days INTEGER NOT NULL CHECK (duration_days >= 1 AND duration_days <= 30),
    budget_level TEXT NOT NULL,
    travel_style TEXT NOT NULL,
    number_of_travelers INTEGER NOT NULL DEFAULT 1,
    estimated_total_cost TEXT,
    notes TEXT DEFAULT '',
    is_demo_mode BOOLEAN DEFAULT FALSE,
    data JSONB NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_itineraries_destination ON public.itineraries (destination);
CREATE INDEX IF NOT EXISTS idx_itineraries_created_at ON public.itineraries (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_itineraries_user_id ON public.itineraries (user_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;

-- 4. Policies (Idempotent drops to allow safe re-running)
DROP POLICY IF EXISTS "Allow public read access" ON public.itineraries;
DROP POLICY IF EXISTS "Allow public insert access" ON public.itineraries;
DROP POLICY IF EXISTS "Allow public update access" ON public.itineraries;
DROP POLICY IF EXISTS "Allow public delete access" ON public.itineraries;

-- 4a. SELECT: Allow public read access (for sharing and exploring itineraries)
CREATE POLICY "Allow public read access"
ON public.itineraries
FOR SELECT
USING (true);

-- 4b. INSERT: Allow guest creation or authenticated creation
CREATE POLICY "Allow public insert access"
ON public.itineraries
FOR INSERT
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- 4c. UPDATE: Allow updating guest itineraries or user's own itineraries
CREATE POLICY "Allow public update access"
ON public.itineraries
FOR UPDATE
USING (user_id IS NULL OR user_id = auth.uid())
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- 4d. DELETE: Allow deleting guest itineraries or user's own itineraries
CREATE POLICY "Allow public delete access"
ON public.itineraries
FOR DELETE
USING (user_id IS NULL OR user_id = auth.uid());

-- 5. Grant explicit table permissions to anon and authenticated roles
-- (PostgreSQL requires table privileges before RLS policies can take effect)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.itineraries TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
