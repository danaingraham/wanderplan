export type BookingType = 'accommodation' | 'flight' | 'restaurant' | 'activity' | 'car_rental' | 'train' | 'cruise';
export type BookingStatus = 'confirmed' | 'cancelled' | 'pending' | 'completed';
export type ParserType = 'specific' | 'ai_fallback';

export interface TravelBooking {
  id: string;
  user_id: string;
  
  // Booking metadata
  provider: string; // airbnb, booking.com, united, etc.
  booking_type: BookingType;
  confirmation_number?: string;
  booking_status: BookingStatus;
  
  // Core details
  title: string; // Hotel name, flight number, restaurant name
  location_name?: string; // City, airport code
  location_address?: string;
  location_lat?: number;
  location_lng?: number;
  
  // Date/time
  start_date: string; // ISO date
  end_date?: string;
  start_time?: string; // HH:MM
  end_time?: string;
  timezone?: string;
  
  // Pricing
  total_price?: number;
  currency?: string;
  price_per_night?: number; // For accommodations
  
  // Additional provider-specific details
  details?: BookingDetails;
  
  // Email source
  email_id?: string;
  email_date?: string;
  email_subject?: string;
  
  // Parsing metadata
  parsed_at: string;
  parser_version?: string;
  parser_confidence?: number; // 0.0 to 1.0
  is_ai_parsed?: boolean;
  
  created_at: string;
  updated_at: string;
}

// Provider-specific detail types
export interface BookingDetails {
  // Accommodation details
  property_type?: string; // hotel, apartment, house
  room_type?: string;
  num_guests?: number;
  num_rooms?: number;
  amenities?: string[];
  check_in_time?: string;
  check_out_time?: string;
  host_name?: string;
  
  // Flight details
  airline?: string;
  flight_number?: string;
  departure_airport?: string;
  arrival_airport?: string;
  departure_gate?: string;
  arrival_gate?: string;
  seat_number?: string;
  cabin_class?: string; // economy, business, first
  aircraft_type?: string;
  
  // Restaurant details
  party_size?: number;
  cuisine_type?: string;
  meal_period?: string; // breakfast, lunch, dinner
  special_requests?: string;
  
  // Car rental details
  car_type?: string;
  pickup_location?: string;
  dropoff_location?: string;
  
  // Generic fields
  [key: string]: any;
}

export interface ParsedEmailData {
  booking: Partial<TravelBooking>;
  confidence: number;
  parser_used: string;
  parsing_time_ms: number;
  errors?: string[];
}

export interface ParserMetadata {
  id: string;
  provider: string;
  parser_type: ParserType;
  total_attempts: number;
  successful_parses: number;
  failed_parses: number;
  accuracy_rate: number; // Calculated percentage
  avg_parse_time_ms?: number;
  min_parse_time_ms?: number;
  max_parse_time_ms?: number;
  last_parsed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface LearnedPreference {
  id: string;
  user_id: string;
  preference_type: 'cuisine' | 'accommodation_style' | 'activity_type' | 'budget_range' | 'airline' | 'hotel_chain';
  preference_value: string;
  booking_id?: string;
  confidence_score: number;
  occurrence_count: number;
  first_seen_at: string;
  last_seen_at: string;
  created_at: string;
}

// Parser interface
export interface EmailParser {
  provider: string;
  canParse(email: EmailMessage): boolean;
  parse(email: EmailMessage): Promise<ParsedEmailData>;
}

export interface EmailMessage {
  id: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  body_text?: string;
  body_html?: string;
  headers?: Record<string, string>;
}