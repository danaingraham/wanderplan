-- Add budget and budget_type columns to user_preferences table

-- Add budget column (single value instead of range)
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS budget INTEGER DEFAULT 200;

-- Add budget_type column
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS budget_type TEXT DEFAULT 'mid_range';

-- Add check constraint for budget_type values
ALTER TABLE public.user_preferences
ADD CONSTRAINT check_budget_type 
CHECK (budget_type IN ('shoestring', 'mid_range', 'luxury', 'ultra_luxury'));

-- Update comments
COMMENT ON COLUMN public.user_preferences.budget IS 'Daily budget per person in USD';
COMMENT ON COLUMN public.user_preferences.budget_type IS 'Budget category: shoestring, mid_range, luxury, ultra_luxury';

-- Migrate existing data: use max of budget_range as the budget value
UPDATE public.user_preferences
SET budget = CASE 
    WHEN budget_range IS NOT NULL AND (budget_range->>'max')::INTEGER > 0 
    THEN (budget_range->>'max')::INTEGER
    ELSE 200
END
WHERE budget IS NULL OR budget = 0;

-- Set budget_type based on existing budget values
UPDATE public.user_preferences
SET budget_type = CASE 
    WHEN budget <= 100 THEN 'shoestring'
    WHEN budget > 100 AND budget <= 300 THEN 'mid_range'
    WHEN budget > 300 AND budget <= 1000 THEN 'luxury'
    WHEN budget > 1000 THEN 'ultra_luxury'
    ELSE 'mid_range'
END
WHERE budget_type IS NULL OR budget_type = 'mid_range';