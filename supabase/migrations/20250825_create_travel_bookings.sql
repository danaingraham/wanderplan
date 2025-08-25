-- Create travel_bookings table for storing parsed email data
CREATE TABLE IF NOT EXISTS public.travel_bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Booking metadata
    provider VARCHAR(100) NOT NULL, -- airbnb, booking.com, united, etc.
    booking_type VARCHAR(50) NOT NULL, -- accommodation, flight, restaurant, activity
    confirmation_number VARCHAR(100),
    booking_status VARCHAR(50) DEFAULT 'confirmed', -- confirmed, cancelled, pending
    
    -- Core booking details
    title TEXT NOT NULL, -- Hotel name, flight number, restaurant name, etc.
    location_name TEXT, -- City, airport code, address
    location_address TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    
    -- Date/time information
    start_date DATE NOT NULL,
    end_date DATE,
    start_time TIME,
    end_time TIME,
    timezone VARCHAR(50),
    
    -- Pricing information
    total_price DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'USD',
    price_per_night DECIMAL(10, 2), -- For accommodations
    
    -- Additional details (JSONB for flexibility)
    details JSONB DEFAULT '{}', -- Stores provider-specific data
    
    -- Email source
    email_id VARCHAR(255), -- Gmail message ID
    email_date TIMESTAMP WITH TIME ZONE,
    email_subject TEXT,
    
    -- Parsing metadata
    parsed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    parser_version VARCHAR(20) DEFAULT 'v1.0',
    parser_confidence DECIMAL(3, 2), -- 0.00 to 1.00
    is_ai_parsed BOOLEAN DEFAULT FALSE,
    
    -- Indexes for performance
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_travel_bookings_user_id ON public.travel_bookings(user_id);
CREATE INDEX idx_travel_bookings_start_date ON public.travel_bookings(start_date);
CREATE INDEX idx_travel_bookings_provider ON public.travel_bookings(provider);
CREATE INDEX idx_travel_bookings_booking_type ON public.travel_bookings(booking_type);
CREATE INDEX idx_travel_bookings_email_id ON public.travel_bookings(email_id);

-- Create parsing_metadata table for tracking parser performance
CREATE TABLE IF NOT EXISTS public.parsing_metadata (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Provider information
    provider VARCHAR(100) NOT NULL,
    parser_type VARCHAR(50) NOT NULL, -- specific, ai_fallback
    
    -- Performance metrics
    total_attempts INTEGER DEFAULT 0,
    successful_parses INTEGER DEFAULT 0,
    failed_parses INTEGER DEFAULT 0,
    accuracy_rate DECIMAL(5, 2) GENERATED ALWAYS AS (
        CASE 
            WHEN total_attempts > 0 
            THEN (successful_parses::DECIMAL / total_attempts::DECIMAL) * 100
            ELSE 0
        END
    ) STORED,
    
    -- Timing metrics
    avg_parse_time_ms INTEGER,
    min_parse_time_ms INTEGER,
    max_parse_time_ms INTEGER,
    
    -- Tracking
    last_parsed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(provider, parser_type)
);

-- Create travel_preferences_learned table for tracking learned preferences
CREATE TABLE IF NOT EXISTS public.travel_preferences_learned (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- What was learned
    preference_type VARCHAR(50) NOT NULL, -- cuisine, accommodation_style, activity_type, budget_range
    preference_value TEXT NOT NULL,
    
    -- Evidence
    booking_id UUID REFERENCES public.travel_bookings(id) ON DELETE CASCADE,
    confidence_score DECIMAL(3, 2) DEFAULT 0.5, -- 0.00 to 1.00
    occurrence_count INTEGER DEFAULT 1,
    
    -- Tracking
    first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, preference_type, preference_value)
);

-- Create index for preference queries
CREATE INDEX idx_travel_preferences_learned_user_id ON public.travel_preferences_learned(user_id);
CREATE INDEX idx_travel_preferences_learned_type ON public.travel_preferences_learned(preference_type);

-- Add RLS policies
ALTER TABLE public.travel_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parsing_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_preferences_learned ENABLE ROW LEVEL SECURITY;

-- Users can only see their own bookings
CREATE POLICY "Users can view own bookings" ON public.travel_bookings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookings" ON public.travel_bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings" ON public.travel_bookings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookings" ON public.travel_bookings
    FOR DELETE USING (auth.uid() = user_id);

-- Users can only see their own learned preferences
CREATE POLICY "Users can view own learned preferences" ON public.travel_preferences_learned
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own learned preferences" ON public.travel_preferences_learned
    FOR ALL USING (auth.uid() = user_id);

-- Parsing metadata is read-only for users, writable by service role
CREATE POLICY "Anyone can read parsing metadata" ON public.parsing_metadata
    FOR SELECT USING (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_travel_bookings_updated_at BEFORE UPDATE ON public.travel_bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parsing_metadata_updated_at BEFORE UPDATE ON public.parsing_metadata
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();