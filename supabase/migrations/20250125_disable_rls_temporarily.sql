-- Migration: Temporarily disable RLS to test if it's causing issues
-- Date: 2025-01-25
-- Description: Disables RLS on user_preferences table for debugging

-- Disable RLS temporarily
ALTER TABLE public.user_preferences DISABLE ROW LEVEL SECURITY;

-- Grant full access to authenticated users
GRANT ALL ON public.user_preferences TO authenticated;
GRANT ALL ON public.user_preferences TO anon;

-- Add a comment to remember this is temporary
COMMENT ON TABLE public.user_preferences IS 'TEMPORARY: RLS disabled for debugging - remember to re-enable!';