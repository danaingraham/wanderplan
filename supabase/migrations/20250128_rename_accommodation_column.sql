-- Rename accommodation_type to accommodation_style to match the rest of the codebase
ALTER TABLE public.user_preferences 
RENAME COLUMN accommodation_type TO accommodation_style;

-- Update the comment
COMMENT ON COLUMN public.user_preferences.accommodation_style IS 'Preferred accommodation styles with confidence scores';

-- Update any existing data to ensure it's in the correct JSONB format
-- This handles any rows that might have the old string array format
UPDATE public.user_preferences
SET accommodation_style = 
  CASE 
    WHEN accommodation_style IS NULL THEN '[]'::JSONB
    WHEN jsonb_typeof(accommodation_style::JSONB) = 'array' THEN
      (SELECT jsonb_agg(
        CASE
          WHEN jsonb_typeof(elem) = 'string' THEN
            jsonb_build_object(
              'style', elem,
              'confidence', 1.0,
              'last_seen', NOW(),
              'count', 1
            )
          ELSE elem
        END
      )
      FROM jsonb_array_elements(accommodation_style::JSONB) AS elem)
    ELSE accommodation_style::JSONB
  END
WHERE accommodation_style IS NOT NULL;