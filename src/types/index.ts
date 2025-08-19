export interface User {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'user'
  profile_picture_url?: string
  profile_picture?: string // Alias for Google auth compatibility
  google_id?: string // Google OAuth ID
  auth_provider?: 'local' | 'google' // Track auth method
  email_verified?: boolean // Email verification status
  created_date: string
  updated_date: string
}

export interface Trip {
  id: string
  title: string
  destination: string
  start_date?: string
  end_date?: string
  trip_type: 'solo' | 'romantic' | 'family' | 'friends' | 'business'
  group_size: number
  has_kids: boolean
  pace: 'relaxed' | 'moderate' | 'packed'
  preferences: string[]
  is_public: boolean
  original_input?: string
  collaborators: string[]
  latitude?: number
  longitude?: number
  budget?: 'budget' | 'medium' | 'luxury'
  cover_image?: string
  currency?: string
  location?: string | null
  created_by: string
  created_date: string
  updated_date: string
}

export interface Place {
  id: string
  trip_id: string
  name: string
  category: 'restaurant' | 'attraction' | 'hotel' | 'activity' | 'shop' | 'transport' | 'tip' | 'cafe' | 'bar' | 'flight' | 'accommodation'
  address?: string
  latitude?: number
  longitude?: number
  day: number
  order: number
  start_time?: string
  end_time?: string
  duration?: number
  notes?: string
  website?: string
  phone?: string
  is_locked: boolean
  is_reservation: boolean
  place_id?: string
  photo_url?: string
  confirmation_number?: string
  reservation_details?: Record<string, any>
  created_date: string
  updated_date: string
}

export interface DraftTrip {
  id: string
  title?: string
  destination?: string
  start_date?: string
  end_date?: string
  trip_type: string
  group_size: number
  has_kids: boolean
  pace: string
  preferences: string[]
  generation_mode: 'paste' | 'ai'
  original_input?: string
  step: number
  last_updated: string
  created_by: string
}

export interface TripPreferences {
  foodie: boolean
  culture: boolean
  nature: boolean
  nightlife: boolean
  shopping: boolean
  history: boolean
  adventure: boolean
}

export interface MockPlaceData {
  id: string
  name: string
  category: Place['category']
  address: string
  latitude: number
  longitude: number
  photo_url?: string
  website?: string
  phone?: string
  rating?: number
  price_level?: number
  description?: string
}

export interface ChatMessage {
  id: string
  content: string
  sender: 'user' | 'assistant'
  timestamp: string
  trip_id?: string
}

export interface LogisticsItem {
  id: string
  trip_id: string
  type: 'flight' | 'hotel' | 'car_rental' | 'train' | 'accommodation' | 'transport'
  title: string
  description?: string
  startDate: string
  endDate?: string
  startTime?: string
  endTime?: string
  location?: string
  confirmationNumber?: string
  email?: string
  notes?: string
  cost?: number
  currency?: string
  created_date: string
  updated_date: string
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto'
  notifications: boolean
  auto_save: boolean
  default_trip_type: Trip['trip_type']
  default_pace: Trip['pace']
}