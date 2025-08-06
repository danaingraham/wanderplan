import { Loader } from '@googlemaps/js-api-loader'
import { API_CONFIG, isGoogleMapsConfigured } from '../config/api'
import type { Place } from '../types'

// Extend the Window interface to include google
declare global {
  interface Window {
    google: typeof google;
  }
}

export interface GooglePlace {
  place_id: string
  name: string
  formatted_address: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  types: string[]
  rating?: number
  price_level?: number
  photos?: Array<{
    photo_reference: string
    height: number
    width: number
  }>
  opening_hours?: {
    open_now: boolean
    weekday_text: string[]
  }
}

export interface PlaceDetailsResponse extends GooglePlace {
  formatted_phone_number?: string
  website?: string
  url?: string
  reviews?: Array<{
    author_name: string
    rating: number
    text: string
    time: number
  }>
}

class GooglePlacesService {
  private loader: Loader | null = null
  private placesService: google.maps.places.PlacesService | null = null
  private autocompleteService: google.maps.places.AutocompleteService | null = null
  private initialized = false

  constructor() {
    if (isGoogleMapsConfigured()) {
      this.loader = new Loader({
        apiKey: API_CONFIG.googleMaps.apiKey,
        version: 'weekly',
        libraries: ['places'],
      })
    }
  }

  private async initialize(): Promise<void> {
    if (this.initialized || !this.loader) return

    try {
      console.log('🔄 Loading Google Maps API...')
      await this.loader.load()
      console.log('✅ Google Maps API loaded successfully')
      
      // Ensure google is available on window
      if (!window.google || !window.google.maps || !window.google.maps.places) {
        throw new Error('Google Maps Places API not available')
      }
      
      // Create a dummy div for PlacesService (required by Google Maps API)
      const div = document.createElement('div')
      this.placesService = new window.google.maps.places.PlacesService(div)
      this.autocompleteService = new window.google.maps.places.AutocompleteService()
      
      console.log('✅ Google Places services initialized')
      this.initialized = true
    } catch (error) {
      console.error('❌ Failed to initialize Google Places API:', error)
      throw new Error('Google Places API initialization failed')
    }
  }

  async searchPlaces(query: string, location?: { lat: number; lng: number }): Promise<GooglePlace[]> {
    if (!isGoogleMapsConfigured()) {
      throw new Error('Google Maps API key not configured')
    }

    await this.initialize()
    
    if (!this.placesService) {
      throw new Error('Places service not initialized')
    }

    return new Promise((resolve, reject) => {
      const request: google.maps.places.TextSearchRequest = {
        query,
        ...(location && {
          location: new window.google.maps.LatLng(location.lat, location.lng),
          radius: 50000, // 50km radius
        }),
      }

      this.placesService!.textSearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          const places: GooglePlace[] = results.map(place => ({
            place_id: place.place_id!,
            name: place.name!,
            formatted_address: place.formatted_address!,
            geometry: {
              location: {
                lat: place.geometry!.location!.lat(),
                lng: place.geometry!.location!.lng(),
              },
            },
            types: place.types || [],
            rating: place.rating,
            price_level: place.price_level,
            photos: place.photos?.map(photo => ({
              photo_reference: photo.getUrl({ maxWidth: 400, maxHeight: 300 }),
              height: photo.height,
              width: photo.width,
            })),
            opening_hours: place.opening_hours ? {
              open_now: place.opening_hours.open_now || false,
              weekday_text: place.opening_hours.weekday_text || [],
            } : undefined,
          }))
          resolve(places)
        } else {
          reject(new Error(`Places search failed: ${status}`))
        }
      })
    })
  }

  async getPlaceDetails(placeId: string): Promise<PlaceDetailsResponse> {
    if (!isGoogleMapsConfigured()) {
      throw new Error('Google Maps API key not configured')
    }

    await this.initialize()
    
    if (!this.placesService) {
      throw new Error('Places service not initialized')
    }

    return new Promise((resolve, reject) => {
      const request: google.maps.places.PlaceDetailsRequest = {
        placeId,
        fields: [
          'place_id', 'name', 'formatted_address', 'geometry', 'types',
          'rating', 'price_level', 'photos', 'opening_hours',
          'formatted_phone_number', 'website', 'url', 'reviews'
        ],
      }

      this.placesService!.getDetails(request, (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          const placeDetails: PlaceDetailsResponse = {
            place_id: place.place_id!,
            name: place.name!,
            formatted_address: place.formatted_address!,
            geometry: {
              location: {
                lat: place.geometry!.location!.lat(),
                lng: place.geometry!.location!.lng(),
              },
            },
            types: place.types || [],
            rating: place.rating,
            price_level: place.price_level,
            photos: place.photos?.map(photo => ({
              photo_reference: photo.getUrl({ maxWidth: 400, maxHeight: 300 }),
              height: photo.height,
              width: photo.width,
            })),
            opening_hours: place.opening_hours ? {
              open_now: place.opening_hours.open_now || false,
              weekday_text: place.opening_hours.weekday_text || [],
            } : undefined,
            formatted_phone_number: place.formatted_phone_number,
            website: place.website,
            url: place.url,
            reviews: place.reviews?.map(review => ({
              author_name: review.author_name,
              rating: review.rating || 0,
              text: review.text,
              time: review.time,
            })),
          }
          resolve(placeDetails)
        } else {
          reject(new Error(`Place details failed: ${status}`))
        }
      })
    })
  }

  async getAutocompletePredictions(input: string): Promise<google.maps.places.AutocompletePrediction[]> {
    console.log('🔍 GooglePlacesService: Getting autocomplete predictions for:', input)
    
    if (!isGoogleMapsConfigured()) {
      console.error('❌ GooglePlacesService: Google Maps API key not configured')
      throw new Error('Google Maps API key not configured')
    }

    console.log('🔄 GooglePlacesService: Initializing service...')
    await this.initialize()
    
    if (!this.autocompleteService) {
      console.error('❌ GooglePlacesService: Autocomplete service not initialized')
      throw new Error('Autocomplete service not initialized')
    }

    console.log('✅ GooglePlacesService: Service initialized, making API request...')
    return new Promise((resolve) => {
      const request: google.maps.places.AutocompletionRequest = {
        input,
        types: ['(cities)'],
      }

      // Set a timeout to prevent hanging
      const timeout = setTimeout(() => {
        console.warn('⏰ GooglePlacesService: API request timed out after 10 seconds')
        resolve([])
      }, 10000)

      this.autocompleteService!.getPlacePredictions(request, (predictions, status) => {
        clearTimeout(timeout)
        console.log('📍 GooglePlacesService: API Response status:', status)
        console.log('📍 GooglePlacesService: Predictions:', predictions)
        
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          console.log('✅ GooglePlacesService: Success! Returning', predictions.length, 'predictions')
          resolve(predictions)
        } else {
          console.warn('⚠️ GooglePlacesService: No predictions or API error, status:', status)
          console.warn('⚠️ GooglePlacesService: Returning empty array')
          resolve([]) // Return empty array instead of error for better UX
        }
      })
    })
  }

  // Get photo URL from photo reference
  getPhotoUrl(photoReference: string, maxWidth: number = 400): string {
    // Google Places photos are already returned as full URLs from getUrl()
    // So photoReference is actually the full URL in our case
    return photoReference
  }

  // Convert Google Place to our internal Place format
  convertToPlace(googlePlace: GooglePlace, tripId: string, day: number): Omit<Place, 'id'> {
    const getCategory = (types: string[]): Place['category'] => {
      if (types.some(type => ['restaurant', 'food', 'meal_takeaway'].includes(type))) {
        return 'restaurant'
      }
      if (types.some(type => ['lodging'].includes(type))) {
        return 'hotel'
      }
      return 'attraction'
    }

    return {
      trip_id: tripId,
      name: googlePlace.name,
      address: googlePlace.formatted_address,
      latitude: googlePlace.geometry.location.lat,
      longitude: googlePlace.geometry.location.lng,
      category: getCategory(googlePlace.types),
      day,
      start_time: '',
      duration: 120, // Default 2 hours
      notes: '',
      place_id: googlePlace.place_id,
      order: 0,
      is_locked: false,
      is_reservation: false,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    }
  }
}

export const googlePlacesService = new GooglePlacesService()