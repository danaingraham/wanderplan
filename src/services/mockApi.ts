import type { 
  SearchPlaceRequest, 
  SearchPlaceResponse, 
  GenerateItineraryRequest, 
  GenerateItineraryResponse,
  ChatRequest,
  ChatResponse,
  ApiResponse 
} from '../types/api'
import type { Trip, Place } from '../types'
import { searchPlaces, getPlacesByDestination } from '../data/mockPlaces'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export class MockApiService {
  static async searchPlaces(request: SearchPlaceRequest): Promise<ApiResponse<SearchPlaceResponse>> {
    await delay(500)
    
    try {
      const places = searchPlaces(request.query, request.location)
      
      return {
        success: true,
        data: {
          places,
          total: places.length
        }
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to search places',
        data: { places: [], total: 0 }
      }
    }
  }

  static async generateItinerary(request: GenerateItineraryRequest): Promise<ApiResponse<GenerateItineraryResponse>> {
    await delay(2000)
    
    try {
      console.log('MockAPI: Generating itinerary for destination:', request.destination)
      const places = getPlacesByDestination(request.destination)
      console.log('MockAPI: Found places:', places.length)
      
      // Always ensure we have places (fallback to Paris if needed)
      if (places.length === 0) {
        console.warn('MockAPI: No places found, using fallback')
        // This should not happen anymore due to the fallback logic in getPlacesByDestination
        return {
          success: false,
          error: `No places found for destination: ${request.destination}. Try Paris, Tokyo, New York, or London.`,
          data: {
            trip: {} as any,
            places: [],
            message: 'Unable to generate itinerary'
          }
        }
      }

      const startDate = new Date(request.start_date)
      const endDate = new Date(request.end_date)
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

      const trip: Omit<Trip, 'id' | 'created_by' | 'created_date' | 'updated_date'> = {
        title: `${request.destination} Adventure`,
        destination: request.destination,
        start_date: request.start_date,
        end_date: request.end_date,
        trip_type: request.trip_type as Trip['trip_type'],
        group_size: request.group_size,
        has_kids: request.has_kids,
        pace: request.pace as Trip['pace'],
        preferences: request.preferences,
        is_guide: false,
        is_public: false,
        original_input: request.original_input,
        collaborators: [],
        latitude: places[0]?.latitude,
        longitude: places[0]?.longitude
      }

      const generatedPlaces: Omit<Place, 'id' | 'trip_id' | 'created_date' | 'updated_date'>[] = []
      
      places.slice(0, Math.min(places.length, days * 3)).forEach((place, index) => {
        const day = Math.floor(index / 3) + 1
        const order = (index % 3) + 1
        
        let startTime = '09:00'
        let duration = 120
        
        if (place.category === 'restaurant') {
          startTime = order === 1 ? '12:00' : order === 2 ? '18:00' : '09:00'
          duration = 90
        } else if (place.category === 'attraction') {
          startTime = order === 1 ? '10:00' : order === 2 ? '14:00' : '16:00'
          duration = 120
        }

        generatedPlaces.push({
          name: place.name,
          category: place.category,
          address: place.address,
          latitude: place.latitude,
          longitude: place.longitude,
          day,
          order,
          start_time: startTime,
          duration,
          notes: place.description,
          website: place.website,
          phone: place.phone,
          is_locked: false,
          is_reservation: place.category === 'restaurant',
          place_id: place.id,
          photo_url: place.photo_url
        })
      })

      return {
        success: true,
        data: {
          trip,
          places: generatedPlaces,
          message: `Generated ${days}-day itinerary for ${request.destination} with ${generatedPlaces.length} places`
        }
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to generate itinerary',
        data: {
          trip: {} as any,
          places: [],
          message: 'Unable to generate itinerary'
        }
      }
    }
  }

  static async chat(request: ChatRequest): Promise<ApiResponse<ChatResponse>> {
    await delay(1000)
    
    try {
      const message = request.message.toLowerCase()
      let response = "I'm here to help you plan your trip! What would you like to know?"
      const suggestions: string[] = []

      if (message.includes('restaurant') || message.includes('food') || message.includes('eat')) {
        response = "I can help you find great restaurants! What type of cuisine are you interested in?"
        suggestions.push("Find Italian restaurants", "Show vegetarian options", "Best local cuisine")
      } else if (message.includes('attraction') || message.includes('visit') || message.includes('see')) {
        response = "There are many amazing attractions to visit! What are you most interested in?"
        suggestions.push("Historical sites", "Museums", "Outdoor activities")
      } else if (message.includes('hotel') || message.includes('stay') || message.includes('accommodation')) {
        response = "I can help you find the perfect place to stay! What's your budget range?"
        suggestions.push("Luxury hotels", "Budget options", "Boutique accommodations")
      } else if (message.includes('time') || message.includes('schedule') || message.includes('itinerary')) {
        response = "I can help optimize your schedule! Would you like me to adjust timing or add more activities?"
        suggestions.push("Add more time at attractions", "Include travel time", "Add rest breaks")
      }

      return {
        success: true,
        data: {
          message: response,
          suggestions
        }
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to process chat request',
        data: {
          message: "Sorry, I'm having trouble right now. Please try again.",
          suggestions: []
        }
      }
    }
  }
}