import { googlePlacesService, type PlaceDetailsResponse } from './googlePlaces'
import type { 
  AccommodationRecommendation, 
  ActivityRecommendation, 
  DiningRecommendation,
  PriceRange 
} from '../types/guide'

/**
 * Converts Google price level (1-4) to our price range format ($-$$$$)
 */
export function convertPriceLevel(priceLevel?: number): PriceRange {
  if (!priceLevel) return '$$'
  const levels: PriceRange[] = ['$', '$$', '$$$', '$$$$']
  return levels[Math.min(priceLevel - 1, 3)]
}

/**
 * Enriches an accommodation with Google Places data
 */
export function enrichAccommodation(
  accommodation: Partial<AccommodationRecommendation>,
  placeDetails: PlaceDetailsResponse
): AccommodationRecommendation {
  return {
    id: accommodation.id || crypto.randomUUID(),
    name: placeDetails.name,
    type: accommodation.type || 'hotel',
    neighborhood: accommodation.neighborhood || placeDetails.formatted_address.split(',')[1]?.trim() || '',
    description: accommodation.description || '',
    priceRange: convertPriceLevel(placeDetails.price_level),
    images: accommodation.images || [],
    bookingLinks: accommodation.bookingLinks || [],
    // Google Places data
    place_id: placeDetails.place_id,
    google_rating: placeDetails.rating,
    google_photos: placeDetails.photos?.map(p => p.photo_reference) || [],
    verified_address: placeDetails.formatted_address,
    latitude: placeDetails.geometry.location.lat,
    longitude: placeDetails.geometry.location.lng,
    phone: placeDetails.formatted_phone_number,
    website: placeDetails.website,
    opening_hours: placeDetails.opening_hours,
    // Keep any existing data
    ...accommodation,
    rating: accommodation.rating || placeDetails.rating
  }
}

/**
 * Enriches an activity with Google Places data
 */
export function enrichActivity(
  activity: Partial<ActivityRecommendation>,
  placeDetails: PlaceDetailsResponse
): ActivityRecommendation {
  // Determine category based on Google place types
  const getCategory = () => {
    if (activity.category) return activity.category
    const types = placeDetails.types || []
    if (types.some(t => ['museum', 'art_gallery', 'church', 'synagogue', 'mosque', 'hindu_temple'].includes(t))) {
      return 'cultural'
    }
    if (types.some(t => ['park', 'zoo', 'aquarium'].includes(t))) {
      return 'nature'
    }
    if (types.some(t => ['shopping_mall', 'store', 'clothing_store'].includes(t))) {
      return 'shopping'
    }
    if (types.some(t => ['night_club', 'bar'].includes(t))) {
      return 'nightlife'
    }
    if (types.some(t => ['spa', 'beauty_salon'].includes(t))) {
      return 'relaxation'
    }
    if (types.some(t => ['amusement_park', 'stadium'].includes(t))) {
      return 'adventure'
    }
    return 'sightseeing'
  }

  return {
    id: activity.id || crypto.randomUUID(),
    name: placeDetails.name,
    category: getCategory(),
    description: activity.description || '',
    location: placeDetails.formatted_address,
    duration: activity.duration || '2-3 hours',
    images: activity.images || [],
    tips: activity.tips || [],
    bookingRequired: activity.bookingRequired || false,
    // Google Places data
    place_id: placeDetails.place_id,
    google_rating: placeDetails.rating,
    google_photos: placeDetails.photos?.map(p => p.photo_reference) || [],
    verified_address: placeDetails.formatted_address,
    latitude: placeDetails.geometry.location.lat,
    longitude: placeDetails.geometry.location.lng,
    phone: placeDetails.formatted_phone_number,
    website: placeDetails.website,
    price_level: placeDetails.price_level,
    opening_hours: placeDetails.opening_hours,
    // Keep any existing data
    ...activity,
    rating: activity.rating || placeDetails.rating
  }
}

/**
 * Enriches a dining recommendation with Google Places data
 */
export function enrichDining(
  dining: Partial<DiningRecommendation>,
  placeDetails: PlaceDetailsResponse
): DiningRecommendation {
  // Try to determine cuisine from place types
  const getCuisine = () => {
    if (dining.cuisine) return dining.cuisine
    const types = placeDetails.types || []
    // Check for specific cuisine types
    for (const type of types) {
      if (type.includes('restaurant')) {
        const cuisine = type.replace('_restaurant', '').replace('_', ' ')
        if (cuisine !== 'restaurant') {
          return cuisine.charAt(0).toUpperCase() + cuisine.slice(1)
        }
      }
    }
    return 'International'
  }

  return {
    id: dining.id || crypto.randomUUID(),
    name: placeDetails.name,
    cuisine: getCuisine(),
    mealTypes: dining.mealTypes || ['lunch', 'dinner'],
    neighborhood: dining.neighborhood || placeDetails.formatted_address.split(',')[1]?.trim() || '',
    priceRange: convertPriceLevel(placeDetails.price_level),
    description: dining.description || '',
    images: dining.images || [],
    reservationRequired: dining.reservationRequired || false,
    // Google Places data
    place_id: placeDetails.place_id,
    google_rating: placeDetails.rating,
    google_photos: placeDetails.photos?.map(p => p.photo_reference) || [],
    verified_address: placeDetails.formatted_address,
    latitude: placeDetails.geometry.location.lat,
    longitude: placeDetails.geometry.location.lng,
    phone: placeDetails.formatted_phone_number,
    website: placeDetails.website,
    price_level: placeDetails.price_level,
    opening_hours: placeDetails.opening_hours,
    // Keep any existing data
    ...dining,
    rating: dining.rating || placeDetails.rating
  }
}

/**
 * Batch enriches multiple place names with Google data
 */
export async function batchEnrichPlaces(
  placeNames: string[],
  destination: string,
  destinationCoords?: { lat: number; lng: number }
): Promise<PlaceDetailsResponse[]> {
  const enrichedPlaces: PlaceDetailsResponse[] = []
  
  for (const name of placeNames) {
    try {
      const searchQuery = `${name} ${destination}`
      const results = await googlePlacesService.searchPlaces(searchQuery, destinationCoords)
      
      if (results.length > 0) {
        // Get details for the first result
        const placeDetails = await googlePlacesService.getPlaceDetails(results[0].place_id)
        enrichedPlaces.push(placeDetails)
      }
    } catch (error) {
      console.error(`Failed to enrich place "${name}":`, error)
    }
  }
  
  return enrichedPlaces
}