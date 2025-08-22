-- Rollback Migration: Remove user_preferences table
-- Date: 2025-01-23
-- Description: Rollback script to remove user_preferences table if needed

-- Remove triggers first
DROP TRIGGER IF EXISTS on_auth_user_created_preferences ON auth.users;
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;

-- Remove functions
DROP FUNCTION IF EXISTS initialize_user_preferences() CASCADE;
DROP FUNCTION IF EXISTS update_user_preferences_updated_at() CASCADE;

-- Remove policies
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can delete own preferences" ON public.user_preferences;

-- Remove indexes
DROP INDEX IF EXISTS idx_user_preferences_user_id;
DROP INDEX IF EXISTS idx_user_preferences_updated;

-- Remove table
DROP TABLE IF EXISTS public.user_preferences CASCADE;

-- Note: This is a destructive operation that will delete all user preference data
-- Only run this if you need to completely remove the personalization feature