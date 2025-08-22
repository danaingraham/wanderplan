-- Migration: Create user_preferences table for personalization
-- Date: 2025-01-23
-- Description: Adds user preference storage with confidence scoring and privacy settings

-- Create user_preferences table with confidence scoring
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Inferred preferences with confidence scores
  budget_range JSONB DEFAULT '{"min": null, "max": null, "currency": "USD", "confidence": 0}'::jsonb,
  preferred_cuisines JSONB[] DEFAULT ARRAY[]::JSONB[],
  activity_types JSONB[] DEFAULT ARRAY[]::JSONB[],
  accommodation_style JSONB[] DEFAULT ARRAY[]::JSONB[],
  travel_style TEXT[] DEFAULT ARRAY[]::TEXT[],
  pace_preference TEXT CHECK (pace_preference IN ('relaxed', 'moderate', 'packed', NULL)),
  
  -- Statistics with temporal decay
  avg_trip_duration INTEGER,
  frequent_destinations JSONB DEFAULT '[]'::jsonb,
  seasonal_patterns JSONB DEFAULT '{}'::jsonb,
  
  -- Explicit preferences (user-set, always confidence: 1.0)
  dietary_restrictions TEXT[] DEFAULT ARRAY[]::TEXT[],
  accessibility_needs TEXT,
  preferred_chains JSONB DEFAULT '{}'::jsonb,
  avoided_chains JSONB DEFAULT '{}'::jsonb,
  
  -- Privacy settings
  learning_enabled BOOLEAN DEFAULT true,
  data_retention_days INTEGER DEFAULT 730, -- 2 years default
  
  -- Metadata
  last_calculated_at TIMESTAMP WITH TIME ZONE,
  calculation_version TEXT DEFAULT 'v1.0',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_updated ON public.user_preferences(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only view their own preferences
CREATE POLICY "Users can view own preferences" 
  ON public.user_preferences 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can only insert their own preferences
CREATE POLICY "Users can insert own preferences" 
  ON public.user_preferences 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own preferences
CREATE POLICY "Users can update own preferences" 
  ON public.user_preferences 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own preferences
CREATE POLICY "Users can delete own preferences" 
  ON public.user_preferences 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER update_user_preferences_updated_at 
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW 
  EXECUTE FUNCTION update_user_preferences_updated_at();

-- Create function to initialize preferences for new users
CREATE OR REPLACE FUNCTION initialize_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create preferences when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created_preferences ON auth.users;
CREATE TRIGGER on_auth_user_created_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION initialize_user_preferences();

-- Grant necessary permissions
GRANT ALL ON public.user_preferences TO authenticated;
GRANT ALL ON public.user_preferences TO service_role;

-- Add helpful comments
COMMENT ON TABLE public.user_preferences IS 'Stores user travel preferences for personalized recommendations';
COMMENT ON COLUMN public.user_preferences.budget_range IS 'User budget preferences with confidence score {min, max, currency, confidence}';
COMMENT ON COLUMN public.user_preferences.preferred_cuisines IS 'Array of cuisine preferences [{cuisine, confidence, sample_size}]';
COMMENT ON COLUMN public.user_preferences.learning_enabled IS 'Whether to learn from user travel history';
COMMENT ON COLUMN public.user_preferences.data_retention_days IS 'How long to retain user travel history data';