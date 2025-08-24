# Database Migration Required

## Issue
The database currently has a column named `accommodation_type` but the codebase uses `accommodation_style`. This mismatch is causing preferences not to save properly.

## Temporary Fix Applied
The code now handles both field names automatically, so the app works correctly even without the migration.

## To Apply the Migration

Run this SQL in your Supabase SQL editor:

```sql
-- Rename accommodation_type to accommodation_style
ALTER TABLE public.user_preferences 
RENAME COLUMN accommodation_type TO accommodation_style;

-- Update the comment
COMMENT ON COLUMN public.user_preferences.accommodation_style IS 'Preferred accommodation styles with confidence scores';
```

## After Migration
Once the migration is applied, the temporary compatibility code can be removed from:
- `/src/services/userPreferences.ts`
- `/src/hooks/useUserPreferences.ts`

The app will continue to work correctly with or without this migration.