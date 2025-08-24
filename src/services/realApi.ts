import { googlePlacesService } from './googlePlaces'
import { itineraryGenerator } from './itineraryGenerator'
import { userPreferencesService } from './userPreferences'
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
  user_id?: string  // Optional user ID for loading preferences
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

      // Load user preferences if user ID is provided
      let userPreferences = null
      if (request.user_id) {
        console.log('🔍 Loading user preferences for:', request.user_id)
        userPreferences = await userPreferencesService.getPreferences(request.user_id)
        if (userPreferences) {
          console.log('✅ User preferences loaded:', {
            dietary_restrictions: userPreferences.dietary_restrictions,
            budget_range: userPreferences.budget_range,
            pace_preference: userPreferences.pace_preference,
            travel_style: userPreferences.travel_style
          })
        } else {
          console.log('ℹ️ No saved preferences found for user')
        }
      }

      // Merge user preferences into the request
      const enhancedRequest = userPreferencesService.mergePreferencesIntoRequest(
        request,
        userPreferences
      )
      console.log('🔀 Enhanced request with preferences:', enhancedRequest)

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

      // Generate itinerary suggestions using the enhanced request with preferences
      let aiSuggestions = await itineraryGenerator.generate({
        destination: enhancedRequest.destination,
        startDate: enhancedRequest.start_date,
        endDate: enhancedRequest.end_date,
        tripType: enhancedRequest.trip_type,
        groupSize: enhancedRequest.group_size,
        hasKids: enhancedRequest.has_kids,
        pace: enhancedRequest.pace || enhancedRequest.pace_preference || 'moderate', // Use preference if no explicit pace
        preferences: enhancedRequest.preferences,
        originalInput: enhancedRequest.original_input,
        // Pass merged preferences to the generator
        dietaryRestrictions: enhancedRequest.dietary_restrictions,
        budgetContext: enhancedRequest.budget_context,
        accessibilityNeeds: enhancedRequest.accessibility_needs,
        cuisinePreferences: enhancedRequest.cuisine_preferences,
        accommodationPreferences: enhancedRequest.accommodation_preferences
      })

      // Enhance AI suggestions with real Google Places data
      const enhancedPlaces: Array<Omit<Place, 'id' | 'trip_id'>> = []
      
      console.log('🤖 Processing AI suggestions:', aiSuggestions.length, 'days')
      console.log('🔍 FULL AI SUGGESTIONS:', JSON.stringify(aiSuggestions, null, 2))
      
      let globalOrder = 0; // Global order counter across all days

      for (const daySuggestion of aiSuggestions) {
        console.log(`📅 Processing Day ${daySuggestion.day} with ${daySuggestion.places.length} places`)
        console.log(`📅 Day ${daySuggestion.day} places:`, JSON.stringify(daySuggestion.places, null, 2))
        
        for (let placeIndex = 0; placeIndex < daySuggestion.places.length; placeIndex++) {
          const place = daySuggestion.places[placeIndex]
          let enhancedPlace: Omit<Place, 'id' | 'trip_id'> = {
            name: place.name,
            address: place.address,
            latitude: destinationCoords?.lat || 0,
            longitude: destinationCoords?.lng || 0,
            category: place.category,
            day: daySuggestion.day,
            order: globalOrder++, // Use global order counter
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
                  photo_url: googlePlace.photos && googlePlace.photos.length > 0 ? googlePlace.photos[0].photo_reference : undefined,
                  notes: enhancedPlace.notes + (googlePlace.rating ? `\n\nRating: ${googlePlace.rating}/5` : ''),
                }
              }
            } catch (error) {
              console.warn(`Failed to enhance place "${place.name}" with Google data:`, error)
            }
          }

          console.log(`✅ Added place ${globalOrder - 1}: ${enhancedPlace.name} (Day ${enhancedPlace.day}, Order ${enhancedPlace.order})`)
          enhancedPlaces.push(enhancedPlace)
        }
      }

      console.log(`🎯 FINAL ENHANCED PLACES: ${enhancedPlaces.length} total places`)
      console.log('🔍 ENHANCED PLACES DETAILS:', JSON.stringify(enhancedPlaces, null, 2))

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
        collaborators: [],
        latitude: destinationCoords?.lat,
        longitude: destinationCoords?.lng,
      }

      // Log the final result
      const totalDays = new Set(enhancedPlaces.map(p => p.day)).size
      console.log(`📊 Final itinerary: ${enhancedPlaces.length} places across ${totalDays} days`)
      
      // Ensure we have at least some places
      if (enhancedPlaces.length === 0) {
        console.error('❌ No places were generated!')
        throw new Error('Failed to generate any itinerary items')
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