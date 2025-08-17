-- Trip Guides Schema
-- This schema defines the structure for the trip guide system

-- Trip Guides main table
CREATE TABLE IF NOT EXISTS trip_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Metadata fields
  destination_city VARCHAR(255) NOT NULL,
  destination_country VARCHAR(255) NOT NULL,
  destination_region VARCHAR(255),
  trip_type VARCHAR(50) NOT NULL CHECK (trip_type IN ('adventure', 'relaxation', 'cultural', 'business', 'family', 'romantic', 'solo', 'group')),
  travel_month INTEGER CHECK (travel_month >= 1 AND travel_month <= 12),
  travel_year INTEGER CHECK (travel_year >= 2020 AND travel_year <= 2100),
  trip_duration INTEGER, -- in days
  group_size INTEGER,
  budget VARCHAR(10) CHECK (budget IN ('$', '$$', '$$$', '$$$$')),
  
  -- Content fields
  cover_image TEXT,
  tags TEXT[],
  highlights TEXT[],
  packing_tips TEXT[],
  local_tips TEXT[],
  best_time_to_visit TEXT,
  avoid_these TEXT[],
  
  -- Publishing status
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Accommodation Recommendations
CREATE TABLE IF NOT EXISTS guide_accommodations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID REFERENCES trip_guides(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('hotel', 'airbnb', 'hostel', 'resort', 'other')),
  neighborhood VARCHAR(255),
  description TEXT,
  price_range VARCHAR(10) CHECK (price_range IN ('$', '$$', '$$$', '$$$$')),
  
  -- Additional details
  author_notes TEXT,
  pros TEXT[],
  cons TEXT[],
  amenities TEXT[],
  rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
  
  -- JSON fields for complex data
  images JSONB DEFAULT '[]'::jsonb,
  booking_links JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity Recommendations
CREATE TABLE IF NOT EXISTS guide_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID REFERENCES trip_guides(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('sightseeing', 'adventure', 'cultural', 'shopping', 'nightlife', 'relaxation', 'dining', 'nature')),
  description TEXT,
  location VARCHAR(255),
  duration VARCHAR(100), -- e.g., "2-3 hours"
  
  -- Timing and cost
  best_time_to_visit VARCHAR(255),
  cost VARCHAR(100),
  
  -- Booking info
  booking_required BOOLEAN DEFAULT false,
  booking_link TEXT,
  
  -- Additional details
  tips TEXT[],
  rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
  difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'moderate', 'challenging')),
  accessibility TEXT,
  
  -- JSON fields
  images JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dining Recommendations
CREATE TABLE IF NOT EXISTS guide_dining (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID REFERENCES trip_guides(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  cuisine VARCHAR(100),
  meal_types TEXT[] CHECK (array_length(meal_types, 1) > 0),
  neighborhood VARCHAR(255),
  price_range VARCHAR(10) CHECK (price_range IN ('$', '$$', '$$$', '$$$$')),
  description TEXT,
  
  -- Food details
  must_try_dishes TEXT[],
  dietary_options TEXT[],
  atmosphere VARCHAR(255),
  
  -- Reservation info
  reservation_required BOOLEAN DEFAULT false,
  reservation_link TEXT,
  
  -- Additional details
  author_notes TEXT,
  rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
  
  -- JSON fields
  images JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transportation Tips
CREATE TABLE IF NOT EXISTS guide_transportation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID REFERENCES trip_guides(id) ON DELETE CASCADE,
  
  type VARCHAR(50) NOT NULL CHECK (type IN ('public', 'taxi', 'rideshare', 'rental', 'walking', 'bike')),
  description TEXT NOT NULL,
  cost VARCHAR(100),
  tips TEXT[],
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guide Views/Analytics
CREATE TABLE IF NOT EXISTS guide_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID REFERENCES trip_guides(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  action VARCHAR(50) NOT NULL CHECK (action IN ('view', 'save', 'share', 'use_for_trip')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guide Ratings/Reviews
CREATE TABLE IF NOT EXISTS guide_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID REFERENCES trip_guides(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  helpful_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one review per user per guide
  UNIQUE(guide_id, user_id)
);

-- Indexes for better query performance
CREATE INDEX idx_trip_guides_author ON trip_guides(author_id);
CREATE INDEX idx_trip_guides_destination ON trip_guides(destination_city, destination_country);
CREATE INDEX idx_trip_guides_published ON trip_guides(is_published, published_at);
CREATE INDEX idx_trip_guides_trip_type ON trip_guides(trip_type);
CREATE INDEX idx_trip_guides_tags ON trip_guides USING GIN(tags);

CREATE INDEX idx_guide_accommodations_guide ON guide_accommodations(guide_id);
CREATE INDEX idx_guide_activities_guide ON guide_activities(guide_id);
CREATE INDEX idx_guide_dining_guide ON guide_dining(guide_id);
CREATE INDEX idx_guide_transportation_guide ON guide_transportation(guide_id);

CREATE INDEX idx_guide_analytics_guide ON guide_analytics(guide_id);
CREATE INDEX idx_guide_analytics_user ON guide_analytics(user_id);
CREATE INDEX idx_guide_reviews_guide ON guide_reviews(guide_id);
CREATE INDEX idx_guide_reviews_user ON guide_reviews(user_id);

-- Row Level Security (RLS) Policies
ALTER TABLE trip_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_dining ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_transportation ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_reviews ENABLE ROW LEVEL SECURITY;

-- Policies for trip_guides
CREATE POLICY "Public guides are viewable by everyone" ON trip_guides
  FOR SELECT USING (is_published = true);

CREATE POLICY "Users can view their own guides" ON trip_guides
  FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "Users can create their own guides" ON trip_guides
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own guides" ON trip_guides
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own guides" ON trip_guides
  FOR DELETE USING (auth.uid() = author_id);

-- Similar policies for related tables (simplified for brevity)
CREATE POLICY "View published guide details" ON guide_accommodations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trip_guides 
      WHERE trip_guides.id = guide_accommodations.guide_id 
      AND (trip_guides.is_published = true OR trip_guides.author_id = auth.uid())
    )
  );

CREATE POLICY "Manage own guide accommodations" ON guide_accommodations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM trip_guides 
      WHERE trip_guides.id = guide_accommodations.guide_id 
      AND trip_guides.author_id = auth.uid()
    )
  );

-- Apply similar policies to other guide detail tables
CREATE POLICY "View published guide activities" ON guide_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trip_guides 
      WHERE trip_guides.id = guide_activities.guide_id 
      AND (trip_guides.is_published = true OR trip_guides.author_id = auth.uid())
    )
  );

CREATE POLICY "Manage own guide activities" ON guide_activities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM trip_guides 
      WHERE trip_guides.id = guide_activities.guide_id 
      AND trip_guides.author_id = auth.uid()
    )
  );

CREATE POLICY "View published guide dining" ON guide_dining
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trip_guides 
      WHERE trip_guides.id = guide_dining.guide_id 
      AND (trip_guides.is_published = true OR trip_guides.author_id = auth.uid())
    )
  );

CREATE POLICY "Manage own guide dining" ON guide_dining
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM trip_guides 
      WHERE trip_guides.id = guide_dining.guide_id 
      AND trip_guides.author_id = auth.uid()
    )
  );

-- Analytics can be inserted by authenticated users
CREATE POLICY "Users can track analytics" ON guide_analytics
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Reviews policies
CREATE POLICY "View all reviews" ON guide_reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON guide_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON guide_reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON guide_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_trip_guides_updated_at BEFORE UPDATE ON trip_guides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guide_accommodations_updated_at BEFORE UPDATE ON guide_accommodations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guide_activities_updated_at BEFORE UPDATE ON guide_activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guide_dining_updated_at BEFORE UPDATE ON guide_dining
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guide_transportation_updated_at BEFORE UPDATE ON guide_transportation
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guide_reviews_updated_at BEFORE UPDATE ON guide_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();