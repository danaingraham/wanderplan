-- Fix RLS policies for profiles table
-- Run this in your Supabase SQL editor

-- Enable RLS on profiles table if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Create policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Create policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Create a trigger to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, created_at, updated_at)
    VALUES (new.id, new.email, now(), now())
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also fix RLS for trips table
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own trips" ON trips;
DROP POLICY IF EXISTS "Users can insert own trips" ON trips;
DROP POLICY IF EXISTS "Users can update own trips" ON trips;
DROP POLICY IF EXISTS "Users can delete own trips" ON trips;

CREATE POLICY "Users can view own trips" ON trips
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trips" ON trips
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips" ON trips
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips" ON trips
    FOR DELETE
    USING (auth.uid() = user_id);

-- Also fix RLS for places table
ALTER TABLE places ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view places for their trips" ON places;
DROP POLICY IF EXISTS "Users can insert places for their trips" ON places;
DROP POLICY IF EXISTS "Users can update places for their trips" ON places;
DROP POLICY IF EXISTS "Users can delete places for their trips" ON places;

CREATE POLICY "Users can view places for their trips" ON places
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM trips 
            WHERE trips.id = places.trip_id 
            AND trips.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert places for their trips" ON places
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM trips 
            WHERE trips.id = places.trip_id 
            AND trips.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update places for their trips" ON places
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM trips 
            WHERE trips.id = places.trip_id 
            AND trips.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM trips 
            WHERE trips.id = places.trip_id 
            AND trips.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete places for their trips" ON places
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM trips 
            WHERE trips.id = places.trip_id 
            AND trips.user_id = auth.uid()
        )
    );

-- Create the profile for the existing user if it doesn't exist
INSERT INTO profiles (id, email, created_at, updated_at)
SELECT 
    '58ae891a-1004-42ac-8442-b247afb29ebf',
    'danabressler@gmail.com',
    now(),
    now()
WHERE NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = '58ae891a-1004-42ac-8442-b247afb29ebf'
);