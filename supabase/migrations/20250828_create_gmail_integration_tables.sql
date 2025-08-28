-- Migration: Create Gmail Integration Tables
-- Date: 2025-08-28
-- Description: Creates all necessary tables for Gmail integration and preference tracking

-- ============================================
-- 1. GMAIL CONNECTIONS TABLE
-- ============================================
-- Stores OAuth tokens and sync metadata for Gmail connections
CREATE TABLE IF NOT EXISTS public.gmail_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- OAuth tokens (encrypted in production)
    access_token TEXT, -- Should be encrypted with AES-256 in production
    refresh_token TEXT, -- Should be encrypted with AES-256 in production
    token_expiry TIMESTAMP WITH TIME ZONE,
    
    -- Sync metadata
    last_sync_date TIMESTAMP WITH TIME ZONE,
    last_sync_status VARCHAR(50) DEFAULT 'pending', -- pending, success, failed, in_progress
    last_error_message TEXT,
    
    -- Quota management
    daily_quota_used INTEGER DEFAULT 0,
    quota_reset_time TIMESTAMP WITH TIME ZONE,
    sync_enabled BOOLEAN DEFAULT true,
    
    -- Gmail specific
    gmail_history_id TEXT, -- Gmail's history ID for incremental sync
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. TRAVEL HISTORY TABLE
-- ============================================
-- Stores parsed travel bookings from emails
CREATE TABLE IF NOT EXISTS public.travel_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Booking type and provider
    type TEXT NOT NULL CHECK (type IN ('accommodation', 'flight', 'restaurant', 'activity', 'transport', 'other')),
    provider TEXT, -- airbnb, booking.com, united, etc.
    
    -- Core booking details
    name TEXT NOT NULL, -- Hotel name, flight number, restaurant name, etc.
    location TEXT, -- City, airport code, address
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Dates
    start_date DATE NOT NULL,
    end_date DATE,
    booking_date DATE,
    
    -- Financial
    total_cost DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'USD',
    
    -- Deduplication and verification
    confirmation_hash TEXT, -- One-way hash of confirmation number for deduplication
    confidence_score DECIMAL(3, 2) DEFAULT 0.8, -- 0.00 to 1.00
    
    -- Source tracking
    source TEXT DEFAULT 'gmail_parser', -- gmail_parser, ai_parsed, manual, import
    email_id TEXT, -- Gmail message ID reference
    
    -- Privacy: No PII stored (no confirmation numbers, no personal details)
    -- Location generalized to city level
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. PREFERENCE CACHE TABLE
-- ============================================
-- Caches calculated preferences for performance
CREATE TABLE IF NOT EXISTS public.preference_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Cached preference data
    cached_preferences JSONB NOT NULL DEFAULT '{}',
    /* Example structure:
    {
        "budget_range": {"min": 100, "max": 300, "currency": "USD", "confidence": 0.85},
        "cuisines": [
            {"name": "Italian", "score": 0.9, "occurrences": 15},
            {"name": "Japanese", "score": 0.8, "occurrences": 12}
        ],
        "accommodation_style": [
            {"type": "hotel", "score": 0.7, "occurrences": 8},
            {"type": "airbnb", "score": 0.9, "occurrences": 20}
        ],
        "activity_types": ["museums", "hiking", "food_tours"],
        "pace_preference": "moderate",
        "travel_style": ["cultural", "foodie", "nature"],
        "frequent_destinations": [
            {"city": "New York", "visits": 5, "last_visit": "2024-12-01"},
            {"city": "Paris", "visits": 3, "last_visit": "2024-08-15"}
        ],
        "seasonal_patterns": {
            "summer": ["beach", "hiking"],
            "winter": ["ski", "city_break"]
        }
    }
    */
    
    -- Cache metadata
    calculation_method VARCHAR(50) DEFAULT 'travel_history', -- travel_history, manual, hybrid
    confidence_level DECIMAL(3, 2) DEFAULT 0.5, -- Overall confidence 0.00 to 1.00
    data_points_used INTEGER DEFAULT 0, -- Number of bookings analyzed
    
    -- Cache invalidation
    cache_key TEXT NOT NULL, -- Hash to detect when recalculation needed
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes'),
    last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. GMAIL SYNC LOG TABLE
-- ============================================
-- Tracks sync operations for debugging and monitoring
CREATE TABLE IF NOT EXISTS public.gmail_sync_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Sync details
    sync_type VARCHAR(50) NOT NULL, -- initial, incremental, retry
    sync_status VARCHAR(50) NOT NULL, -- started, completed, failed, partial
    
    -- Metrics
    emails_fetched INTEGER DEFAULT 0,
    emails_parsed INTEGER DEFAULT 0,
    bookings_found INTEGER DEFAULT 0,
    
    -- Performance
    duration_ms INTEGER,
    quota_used INTEGER DEFAULT 0,
    
    -- Error tracking
    error_message TEXT,
    error_details JSONB,
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Gmail connections indexes
CREATE INDEX idx_gmail_connections_user_id ON public.gmail_connections(user_id);
CREATE INDEX idx_gmail_connections_sync_date ON public.gmail_connections(last_sync_date);

-- Travel history indexes
CREATE INDEX idx_travel_history_user_id ON public.travel_history(user_id);
CREATE INDEX idx_travel_history_dates ON public.travel_history(start_date, end_date);
CREATE INDEX idx_travel_history_type ON public.travel_history(type);
CREATE INDEX idx_travel_history_provider ON public.travel_history(provider);
CREATE INDEX idx_travel_history_confirmation ON public.travel_history(confirmation_hash);

-- Preference cache indexes
CREATE INDEX idx_preference_cache_user_id ON public.preference_cache(user_id);
CREATE INDEX idx_preference_cache_expires ON public.preference_cache(expires_at);

-- Sync log indexes
CREATE INDEX idx_gmail_sync_log_user_id ON public.gmail_sync_log(user_id);
CREATE INDEX idx_gmail_sync_log_status ON public.gmail_sync_log(sync_status);
CREATE INDEX idx_gmail_sync_log_started ON public.gmail_sync_log(started_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.gmail_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preference_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gmail_sync_log ENABLE ROW LEVEL SECURITY;

-- Gmail connections policies
CREATE POLICY "Users can view own gmail connections" 
    ON public.gmail_connections FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own gmail connections" 
    ON public.gmail_connections FOR ALL 
    USING (auth.uid() = user_id);

-- Travel history policies
CREATE POLICY "Users can view own travel history" 
    ON public.travel_history FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own travel history" 
    ON public.travel_history FOR ALL 
    USING (auth.uid() = user_id);

-- Preference cache policies
CREATE POLICY "Users can view own preference cache" 
    ON public.preference_cache FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own preference cache" 
    ON public.preference_cache FOR ALL 
    USING (auth.uid() = user_id);

-- Sync log policies
CREATE POLICY "Users can view own sync logs" 
    ON public.gmail_sync_log FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sync logs" 
    ON public.gmail_sync_log FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

-- Create or replace the update_updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to update updated_at automatically
CREATE TRIGGER update_gmail_connections_updated_at 
    BEFORE UPDATE ON public.gmail_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_travel_history_updated_at 
    BEFORE UPDATE ON public.travel_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_preference_cache_updated_at 
    BEFORE UPDATE ON public.preference_cache
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant permissions to authenticated users
GRANT ALL ON public.gmail_connections TO authenticated;
GRANT ALL ON public.travel_history TO authenticated;
GRANT ALL ON public.preference_cache TO authenticated;
GRANT ALL ON public.gmail_sync_log TO authenticated;

-- Grant permissions to service role (for backend operations)
GRANT ALL ON public.gmail_connections TO service_role;
GRANT ALL ON public.travel_history TO service_role;
GRANT ALL ON public.preference_cache TO service_role;
GRANT ALL ON public.gmail_sync_log TO service_role;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE public.gmail_connections IS 'Stores Gmail OAuth tokens and sync metadata for each user';
COMMENT ON TABLE public.travel_history IS 'Stores parsed travel bookings from Gmail emails with privacy-first approach';
COMMENT ON TABLE public.preference_cache IS 'Caches calculated user preferences for performance optimization';
COMMENT ON TABLE public.gmail_sync_log IS 'Tracks Gmail sync operations for debugging and monitoring';

COMMENT ON COLUMN public.gmail_connections.access_token IS 'OAuth access token - must be encrypted in production';
COMMENT ON COLUMN public.gmail_connections.refresh_token IS 'OAuth refresh token - must be encrypted in production';
COMMENT ON COLUMN public.travel_history.confirmation_hash IS 'One-way hash of confirmation number for deduplication without storing PII';
COMMENT ON COLUMN public.preference_cache.cached_preferences IS 'JSON object containing all calculated preferences with confidence scores';