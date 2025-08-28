-- ============================================
-- ADD FLEXIBLE GMAIL DETECTION FEATURES
-- ============================================

-- 1. VERIFIED EMAIL SENDERS TABLE
-- Tracks learned email domains and patterns for better detection
CREATE TABLE IF NOT EXISTS public.verified_email_senders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email_domain TEXT NOT NULL,
    sender_address TEXT,
    provider TEXT NOT NULL, -- airbnb, marriott, united, etc.
    provider_type TEXT CHECK (provider_type IN ('accommodation', 'flight', 'restaurant', 'activity', 'transport', 'other')),
    confidence DECIMAL(3,2) DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
    pattern_matched TEXT, -- what pattern identified this sender
    user_verified BOOLEAN DEFAULT false,
    verification_count INTEGER DEFAULT 1,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(email_domain, provider)
);

-- 2. GMAIL TRIPS TABLE
-- Auto-groups bookings into logical trips
CREATE TABLE IF NOT EXISTS public.gmail_trips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Trip summary
    destination TEXT NOT NULL, -- Primary city/region
    destination_lat DECIMAL(10, 8),
    destination_lng DECIMAL(11, 8),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Statistics
    booking_count INTEGER DEFAULT 0,
    accommodation_count INTEGER DEFAULT 0,
    flight_count INTEGER DEFAULT 0,
    restaurant_count INTEGER DEFAULT 0,
    activity_count INTEGER DEFAULT 0,
    transport_count INTEGER DEFAULT 0,
    
    total_spent DECIMAL(10, 2),
    primary_currency VARCHAR(10) DEFAULT 'USD',
    
    -- Trip characteristics (inferred)
    trip_purpose TEXT, -- leisure, business, mixed
    trip_style TEXT[], -- luxury, budget, adventure, cultural, family
    has_international_flight BOOLEAN DEFAULT false,
    
    -- User adjustments
    user_modified BOOLEAN DEFAULT false, -- If user manually adjusted the grouping
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. UPDATE TRAVEL HISTORY TABLE
-- Add fields for flexible detection and trip grouping
ALTER TABLE public.travel_history 
ADD COLUMN IF NOT EXISTS gmail_trip_id UUID REFERENCES public.gmail_trips(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS sender_email TEXT,
ADD COLUMN IF NOT EXISTS sender_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS parser_method TEXT CHECK (parser_method IN ('domain', 'pattern', 'ai', 'hybrid', 'manual')),
ADD COLUMN IF NOT EXISTS detection_confidence DECIMAL(3,2) DEFAULT 0.8;

-- 4. TRIP BOOKING LINK TABLE
-- Many-to-many relationship for manual trip adjustments
CREATE TABLE IF NOT EXISTS public.gmail_trip_bookings (
    gmail_trip_id UUID REFERENCES public.gmail_trips(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.travel_history(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by TEXT DEFAULT 'auto', -- auto, user
    PRIMARY KEY (gmail_trip_id, booking_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Verified senders lookups
CREATE INDEX IF NOT EXISTS idx_verified_senders_domain 
ON public.verified_email_senders(email_domain);

CREATE INDEX IF NOT EXISTS idx_verified_senders_provider 
ON public.verified_email_senders(provider);

-- Trip clustering
CREATE INDEX IF NOT EXISTS idx_travel_history_clustering 
ON public.travel_history(user_id, start_date, location);

CREATE INDEX IF NOT EXISTS idx_travel_history_trip 
ON public.travel_history(gmail_trip_id);

-- Gmail trips lookups
CREATE INDEX IF NOT EXISTS idx_gmail_trips_user_date 
ON public.gmail_trips(user_id, start_date DESC);

CREATE INDEX IF NOT EXISTS idx_gmail_trips_destination 
ON public.gmail_trips(user_id, destination);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_verified_senders_updated_at 
BEFORE UPDATE ON public.verified_email_senders 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_gmail_trips_updated_at 
BEFORE UPDATE ON public.gmail_trips 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to calculate trip statistics
CREATE OR REPLACE FUNCTION calculate_trip_stats(trip_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.gmail_trips gt
    SET 
        booking_count = (
            SELECT COUNT(*) 
            FROM public.travel_history th 
            WHERE th.gmail_trip_id = trip_id
        ),
        accommodation_count = (
            SELECT COUNT(*) 
            FROM public.travel_history th 
            WHERE th.gmail_trip_id = trip_id 
            AND th.type = 'accommodation'
        ),
        flight_count = (
            SELECT COUNT(*) 
            FROM public.travel_history th 
            WHERE th.gmail_trip_id = trip_id 
            AND th.type = 'flight'
        ),
        restaurant_count = (
            SELECT COUNT(*) 
            FROM public.travel_history th 
            WHERE th.gmail_trip_id = trip_id 
            AND th.type = 'restaurant'
        ),
        activity_count = (
            SELECT COUNT(*) 
            FROM public.travel_history th 
            WHERE th.gmail_trip_id = trip_id 
            AND th.type = 'activity'
        ),
        transport_count = (
            SELECT COUNT(*) 
            FROM public.travel_history th 
            WHERE th.gmail_trip_id = trip_id 
            AND th.type = 'transport'
        ),
        total_spent = (
            SELECT COALESCE(SUM(total_cost), 0) 
            FROM public.travel_history th 
            WHERE th.gmail_trip_id = trip_id
        )
    WHERE gt.id = trip_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
ALTER TABLE public.verified_email_senders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gmail_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gmail_trip_bookings ENABLE ROW LEVEL SECURITY;

-- Verified senders - global read, admin write
CREATE POLICY "Anyone can read verified senders" 
ON public.verified_email_senders FOR SELECT 
USING (true);

CREATE POLICY "Only admins can modify verified senders" 
ON public.verified_email_senders FOR ALL 
USING (auth.jwt() ->> 'role' = 'admin');

-- Gmail trips - users see own trips
CREATE POLICY "Users can view own gmail trips" 
ON public.gmail_trips FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own gmail trips" 
ON public.gmail_trips FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gmail trips" 
ON public.gmail_trips FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Trip bookings - users manage own
CREATE POLICY "Users can manage own trip bookings" 
ON public.gmail_trip_bookings FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.gmail_trips gt
        WHERE gt.id = gmail_trip_id 
        AND gt.user_id = auth.uid()
    )
);

-- ============================================
-- SEED COMMON VERIFIED SENDERS
-- ============================================

INSERT INTO public.verified_email_senders (email_domain, provider, provider_type, confidence)
VALUES 
    -- Accommodations
    ('airbnb.com', 'airbnb', 'accommodation', 1.0),
    ('booking.com', 'booking.com', 'accommodation', 1.0),
    ('hotels.com', 'hotels.com', 'accommodation', 1.0),
    ('vrbo.com', 'vrbo', 'accommodation', 1.0),
    ('email-marriott.com', 'marriott', 'accommodation', 0.9),
    ('hilton.com', 'hilton', 'accommodation', 1.0),
    ('ihg.com', 'ihg', 'accommodation', 1.0),
    
    -- Airlines
    ('united.com', 'united', 'flight', 1.0),
    ('delta.com', 'delta', 'flight', 1.0),
    ('aa.com', 'american', 'flight', 1.0),
    ('southwest.com', 'southwest', 'flight', 1.0),
    
    -- Restaurants
    ('opentable.com', 'opentable', 'restaurant', 1.0),
    ('resy.com', 'resy', 'restaurant', 1.0),
    
    -- Transport
    ('uber.com', 'uber', 'transport', 1.0),
    ('lyft.com', 'lyft', 'transport', 1.0),
    
    -- Activities
    ('viator.com', 'viator', 'activity', 1.0),
    ('getyourguide.com', 'getyourguide', 'activity', 1.0)
ON CONFLICT (email_domain, provider) DO NOTHING;