-- Migration: Simplify user_preferences table
-- Date: 2025-01-25
-- Description: Drops complex table and creates simpler structure that matches our code

-- Drop the old complex table and its dependencies
DROP TRIGGER IF EXISTS on_auth_user_created_preferences ON auth.users;
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;
DROP FUNCTION IF EXISTS initialize_user_preferences();
DROP FUNCTION IF EXISTS update_user_preferences_updated_at();
DROP TABLE IF EXISTS public.user_preferences;

-- Create simplified user_preferences table
CREATE TABLE public.user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Basic preferences
  travel_pace TEXT DEFAULT 'moderate',
  budget_range JSONB DEFAULT '{"min": 50, "max": 200}'::jsonb,
  accommodation_type TEXT[] DEFAULT ARRAY[]::TEXT[],
  activity_preferences JSONB DEFAULT '{}'::jsonb,
  dietary_restrictions TEXT[] DEFAULT ARRAY[]::TEXT[],
  accessibility_needs TEXT[] DEFAULT ARRAY[]::TEXT[],
  trip_style TEXT[] DEFAULT ARRAY[]::TEXT[],
  transportation_preference TEXT[] DEFAULT ARRAY[]::TEXT[],
  language_preferences TEXT[] DEFAULT ARRAY['en']::TEXT[],
  weather_preference TEXT DEFAULT 'moderate',
  
  -- Settings
  notification_settings JSONB DEFAULT '{"email": true, "push": false, "reminders": true, "updates": true}'::jsonb,
  privacy_settings JSONB DEFAULT '{"share_trips": false, "share_reviews": true, "data_collection": true, "data_retention": 365}'::jsonb,
  
  -- Confidence scores (optional, for future use)
  confidence_scores JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX idx_user_preferences_updated_at ON public.user_preferences(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (simplified)
CREATE POLICY "Users can view own preferences" 
  ON public.user_preferences 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" 
  ON public.user_preferences 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" 
  ON public.user_preferences 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences" 
  ON public.user_preferences 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.user_preferences TO authenticated;
GRANT ALL ON public.user_preferences TO service_role;

-- Add comments
COMMENT ON TABLE public.user_preferences IS 'Simplified user travel preferences table';
COMMENT ON COLUMN public.user_preferences.travel_pace IS 'User travel pace: slow, moderate, or fast';
COMMENT ON COLUMN public.user_preferences.budget_range IS 'Daily budget range {min, max} in USD';
COMMENT ON COLUMN public.user_preferences.accommodation_type IS 'Preferred accommodation types';