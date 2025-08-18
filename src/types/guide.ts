export type TripType = 'adventure' | 'relaxation' | 'cultural' | 'business' | 'family' | 'romantic' | 'solo' | 'group'
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'brunch' | 'snack' | 'dessert'
export type PriceRange = '$' | '$$' | '$$$' | '$$$$'
export type AccommodationType = 'hotel' | 'airbnb' | 'hostel' | 'resort' | 'other'
export type ActivityCategory = 'sightseeing' | 'adventure' | 'cultural' | 'shopping' | 'nightlife' | 'relaxation' | 'dining' | 'nature'

export interface Image {
  id: string
  url: string
  caption?: string
  isHero?: boolean
}

export interface BookingLink {
  provider: string
  url: string
  priceEstimate?: string
}

export interface GuideAuthor {
  id: string
  name: string
  profilePicture?: string
}

export interface GuideDestination {
  city: string
  country: string
  region?: string
}

export interface TravelDate {
  month: number
  year: number
}

export interface GuideMetadata {
  author: GuideAuthor
  destination: GuideDestination
  tripType: TripType
  travelDate: TravelDate
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
  isPublished: boolean
  tags?: string[]
  coverImage?: string
  tripDuration?: number
  groupSize?: number
  budget?: PriceRange
}

export interface AccommodationRecommendation {
  id: string
  name: string
  type: AccommodationType
  neighborhood: string
  description: string
  priceRange: PriceRange
  images: Image[]
  bookingLinks: BookingLink[]
  pros?: string[]
  cons?: string[]
  authorNotes?: string
  amenities?: string[]
  rating?: number
  // Google Places integration
  place_id?: string
  google_rating?: number
  google_photos?: string[]
  verified_address?: string
  latitude?: number
  longitude?: number
  phone?: string
  website?: string
  opening_hours?: {
    open_now?: boolean
    weekday_text?: string[]
  }
}

export interface ActivityRecommendation {
  id: string
  name: string
  category: ActivityCategory
  description: string
  location: string
  duration: string
  bestTimeToVisit?: string
  cost?: string
  images: Image[]
  tips?: string[]
  bookingRequired: boolean
  bookingLink?: string
  rating?: number
  difficulty?: 'easy' | 'moderate' | 'challenging'
  accessibility?: string
  // Google Places integration
  place_id?: string
  google_rating?: number
  google_photos?: string[]
  verified_address?: string
  latitude?: number
  longitude?: number
  phone?: string
  website?: string
  price_level?: number
  opening_hours?: {
    open_now?: boolean
    weekday_text?: string[]
  }
}

export interface DiningRecommendation {
  id: string
  name: string
  cuisine: string
  mealTypes: MealType[]
  neighborhood: string
  priceRange: PriceRange
  description: string
  mustTryDishes?: string[]
  images: Image[]
  reservationLink?: string
  reservationRequired: boolean
  authorNotes?: string
  atmosphere?: string
  dietaryOptions?: string[]
  rating?: number
  // Google Places integration
  place_id?: string
  google_rating?: number
  google_photos?: string[]
  verified_address?: string
  latitude?: number
  longitude?: number
  phone?: string
  website?: string
  price_level?: number
  opening_hours?: {
    open_now?: boolean
    weekday_text?: string[]
  }
}

export interface TripGuide {
  id: string
  metadata: GuideMetadata
  accommodations: AccommodationRecommendation[]
  activities: ActivityRecommendation[]
  dining: DiningRecommendation[]
  itineraryId?: string
  highlights?: string[]
  packingTips?: string[]
  transportation?: TransportationTip[]
  localTips?: string[]
  bestTimeToVisit?: string
  avoidThese?: string[]
}

export interface TransportationTip {
  id: string
  type: 'public' | 'taxi' | 'rideshare' | 'rental' | 'walking' | 'bike'
  description: string
  cost?: string
  tips?: string[]
}

export interface TripItinerary {
  id: string
  userId: string
  destination: string
  startDate: Date
  endDate: Date
  days: ItineraryDay[]
  accommodations: Accommodation[]
  flights?: Flight[]
  budget?: Budget
  notes?: string[]
}

export interface ItineraryDay {
  date: Date
  activities: Activity[]
  meals: Meal[]
}

export interface Activity {
  id: string
  name: string
  startTime?: string
  endTime?: string
  location?: string
  notes?: string
  category?: ActivityCategory
  cost?: number
}

export interface Meal {
  id: string
  restaurantName: string
  mealType: MealType
  time?: string
  location?: string
  notes?: string
  cost?: number
}

export interface Accommodation {
  id: string
  name: string
  checkInDate: Date
  checkOutDate: Date
  location: string
  type: AccommodationType
  confirmationNumber?: string
  notes?: string
  cost?: number
}

export interface Flight {
  id: string
  airline: string
  flightNumber: string
  departure: FlightDetails
  arrival: FlightDetails
  confirmationNumber?: string
  cost?: number
}

export interface FlightDetails {
  airport: string
  city: string
  dateTime: Date
  terminal?: string
  gate?: string
}

export interface Budget {
  total: number
  currency: string
  breakdown?: BudgetBreakdown
}

export interface BudgetBreakdown {
  accommodation: number
  transportation: number
  food: number
  activities: number
  shopping?: number
  other?: number
}

export interface GuideSearchFilters {
  destination?: string
  tripType?: TripType
  priceRange?: PriceRange
  duration?: {
    min?: number
    max?: number
  }
  tags?: string[]
  author?: string
}

export interface GuideCreateRequest {
  metadata: Partial<GuideMetadata>
  fromItineraryId?: string
}

export interface GuideUpdateRequest {
  metadata?: Partial<GuideMetadata>
  accommodations?: AccommodationRecommendation[]
  activities?: ActivityRecommendation[]
  dining?: DiningRecommendation[]
  highlights?: string[]
  packingTips?: string[]
  transportation?: TransportationTip[]
  localTips?: string[]
  bestTimeToVisit?: string
  avoidThese?: string[]
}

export interface EnrichmentRequest {
  type: 'accommodation' | 'activity' | 'dining'
  name: string
  location: string
  additionalInfo?: Record<string, any>
}

export interface EnrichmentResponse {
  images?: Image[]
  bookingLinks?: BookingLink[]
  rating?: number
  priceInfo?: string
  operatingHours?: string
  menuHighlights?: string[]
}