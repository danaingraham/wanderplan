-- Fix RLS policies for user_preferences table
-- The policies are blocking access even for authenticated users

-- First, drop all existing policies
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can delete own preferences" ON public.user_preferences;

-- Create new, simpler policies that actually work
-- Allow authenticated users to do everything with their own preferences
CREATE POLICY "Enable all for authenticated users own preferences" 
  ON public.user_preferences
  FOR ALL 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Alternative: If the above still doesn't work, run this to disable RLS entirely:
-- ALTER TABLE public.user_preferences DISABLE ROW LEVEL SECURITY;