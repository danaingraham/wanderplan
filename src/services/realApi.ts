import { googlePlacesService } from './googlePlaces'
import { openaiService } from './openai'
import { isGoogleMapsConfigured, isOpenAIConfigured } from '../config/api'
import type { Trip, Place } from '../types'

export interface GenerateItineraryRequest {
  destination: string
  start_date: string
  end_date: string
  trip_type: string
  group_size: number
  has_kids: boolean
  pace: string
  preferences: string[]
  original_input?: string
}

export interface GenerateItineraryResponse {
  success: boolean
  data?: {
    trip: Omit<Trip, 'id' | 'created_by' | 'created_date' | 'updated_date'>
    places: Array<Omit<Place, 'id' | 'trip_id'>>
  }
  error?: string
}

class RealApiService {
  async generateItinerary(request: GenerateItineraryRequest): Promise<GenerateItineraryResponse> {
    try {
      console.log('Generating itinerary with real APIs...', request)

      // Get destination coordinates first
      let destinationCoords: { lat: number; lng: number } | undefined

      if (isGoogleMapsConfigured()) {
        try {
          const predictions = await googlePlacesService.getAutocompletePredictions(request.destination)
          if (predictions.length > 0) {
            const placeDetails = await googlePlacesService.getPlaceDetails(predictions[0].place_id)
            destinationCoords = placeDetails.geometry.location
          }
        } catch (error) {
          console.warn('Failed to get destination coordinates:', error)
        }
      }

      // Generate AI itinerary suggestions
      let aiSuggestions: Array<{
        day: number
        places: Array<{
          name: string
          address: string
          category: 'restaurant' | 'attraction' | 'hotel'
          description: string
          estimatedDuration: number
          suggestedTime: string
          whyRecommended: string
        }>
      }> = []

      if (isOpenAIConfigured()) {
        try {
          aiSuggestions = await openaiService.generateItinerary({
            destination: request.destination,
            startDate: request.start_date,
            endDate: request.end_date,
            tripType: request.trip_type,
            groupSize: request.group_size,
            hasKids: request.has_kids,
            pace: request.pace,
            preferences: request.preferences,
          })
        } catch (error) {
          console.warn('Failed to get AI suggestions, using fallback:', error)
        }
      }

      // Enhance AI suggestions with real Google Places data
      const enhancedPlaces: Array<Omit<Place, 'id' | 'trip_id'>> = []

      for (const daySuggestion of aiSuggestions) {
        for (const place of daySuggestion.places) {
          let enhancedPlace: Omit<Place, 'id' | 'trip_id'> = {
            name: place.name,
            address: place.address,
            latitude: destinationCoords?.lat || 0,
            longitude: destinationCoords?.lng || 0,
            category: place.category,
            day: daySuggestion.day,
            order: 0,
            start_time: place.suggestedTime,
            duration: place.estimatedDuration,
            notes: `${place.description}\n\n${place.whyRecommended}`,
            is_locked: false,
            is_reservation: false,
            created_date: new Date().toISOString(),
            updated_date: new Date().toISOString(),
          }

          // Try to enhance with real Google Places data
          if (isGoogleMapsConfigured()) {
            try {
              const searchQuery = `${place.name} ${request.destination}`
              const googlePlaces = await googlePlacesService.searchPlaces(searchQuery, destinationCoords)
              
              if (googlePlaces.length > 0) {
                const googlePlace = googlePlaces[0]
                enhancedPlace = {
                  ...enhancedPlace,
                  name: googlePlace.name,
                  address: googlePlace.formatted_address,
                  latitude: googlePlace.geometry.location.lat,
                  longitude: googlePlace.geometry.location.lng,
                  place_id: googlePlace.place_id,
                  notes: enhancedPlace.notes + (googlePlace.rating ? `\n\nRating: ${googlePlace.rating}/5` : ''),
                }
              }
            } catch (error) {
              console.warn(`Failed to enhance place "${place.name}" with Google data:`, error)
            }
          }

          enhancedPlaces.push(enhancedPlace)
        }
      }

      // Create trip data
      const tripData: Omit<Trip, 'id' | 'created_by' | 'created_date' | 'updated_date'> = {
        title: '', // Will be filled in by TripCreation component
        destination: request.destination,
        start_date: request.start_date,
        end_date: request.end_date,
        trip_type: request.trip_type as 'solo' | 'romantic' | 'family' | 'friends' | 'business',
        group_size: request.group_size,
        has_kids: request.has_kids,
        pace: request.pace as 'relaxed' | 'moderate' | 'packed',
        preferences: request.preferences,
        is_public: false,
        is_guide: false,
        collaborators: [],
        latitude: destinationCoords?.lat,
        longitude: destinationCoords?.lng,
      }

      // If no AI suggestions or Google Places available, create fallback
      if (enhancedPlaces.length === 0) {
        console.log('Creating fallback itinerary...')
        const days = Math.ceil(
          (new Date(request.end_date).getTime() - new Date(request.start_date).getTime()) / (1000 * 60 * 60 * 24)
        ) + 1

        // Create basic fallback places
        for (let day = 1; day <= Math.min(days, 3); day++) {
          enhancedPlaces.push(
            {
              name: `Explore ${request.destination} - Day ${day}`,
              address: request.destination,
              latitude: destinationCoords?.lat || 0,
              longitude: destinationCoords?.lng || 0,
              category: 'attraction',
              day,
              order: 0,
              start_time: '10:00',
              duration: 180,
              notes: 'Plan your exploration of the city. Add specific places you want to visit.',
              is_locked: false,
              is_reservation: false,
              created_date: new Date().toISOString(),
              updated_date: new Date().toISOString(),
            },
            {
              name: `Local Restaurant - Day ${day}`,
              address: request.destination,
              latitude: destinationCoords?.lat || 0,
              longitude: destinationCoords?.lng || 0,
              category: 'restaurant',
              day,
              order: 1,
              start_time: '19:00',
              duration: 90,
              notes: 'Discover local cuisine. Research and add specific restaurants you want to try.',
              is_locked: false,
              is_reservation: false,
              created_date: new Date().toISOString(),
              updated_date: new Date().toISOString(),
            }
          )
        }
      }

      return {
        success: true,
        data: {
          trip: tripData,
          places: enhancedPlaces,
        },
      }
    } catch (error) {
      console.error('Failed to generate itinerary:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  async searchPlaces(query: string, location?: { lat: number; lng: number }): Promise<Array<{
    id: string
    name: string
    address: string
    latitude: number
    longitude: number
    category: 'restaurant' | 'attraction' | 'hotel'
    rating?: number
    photos?: string[]
  }>> {
    if (!isGoogleMapsConfigured()) {
      console.warn('Google Places not configured, returning empty results')
      return []
    }

    try {
      const places = await googlePlacesService.searchPlaces(query, location)
      
      return places.map(place => ({
        id: place.place_id,
        name: place.name,
        address: place.formatted_address,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        category: this.categorizePlace(place.types),
        rating: place.rating,
        photos: place.photos?.map(photo => photo.photo_reference).slice(0, 3),
      }))
    } catch (error) {
      console.error('Places search failed:', error)
      return []
    }
  }

  async getDestinationSuggestions(input: string): Promise<Array<{
    place_id: string
    description: string
    structured_formatting: {
      main_text: string
      secondary_text: string
    }
  }>> {
    console.log('🔍 RealApiService: Getting destination suggestions for:', input)
    
    if (!isGoogleMapsConfigured()) {
      console.warn('⚠️ RealApiService: Google Places not configured for autocomplete')
      return []
    }

    try {
      console.log('📞 RealApiService: Calling Google Places service...')
      const predictions = await googlePlacesService.getAutocompletePredictions(input)
      console.log('📍 RealApiService: Got predictions from Google Places:', predictions)
      
      const result = predictions.map(prediction => ({
        place_id: prediction.place_id,
        description: prediction.description,
        structured_formatting: prediction.structured_formatting,
      }))
      
      console.log('✅ RealApiService: Returning processed suggestions:', result)
      return result
    } catch (error) {
      console.error('❌ RealApiService: Destination suggestions failed:', error)
      return []
    }
  }

  private categorizePlace(types: string[]): 'restaurant' | 'attraction' | 'hotel' {
    const typeSet = new Set(types)
    
    if (typeSet.has('restaurant') || typeSet.has('food') || typeSet.has('meal_takeaway') || typeSet.has('cafe')) {
      return 'restaurant'
    }
    
    if (typeSet.has('lodging')) {
      return 'hotel'
    }
    
    return 'attraction'
  }

  // Method to check if real APIs are available
  isConfigured(): { googlePlaces: boolean; openai: boolean } {
    return {
      googlePlaces: isGoogleMapsConfigured(),
      openai: isOpenAIConfigured(),
    }
  }
}

export const realApiService = new RealApiService()