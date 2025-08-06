import { openaiService } from './openai'
import { isOpenAIConfigured } from '../config/api'
import type { ItinerarySuggestion } from './openai'

export interface ItineraryGeneratorRequest {
  destination: string
  startDate: string
  endDate: string
  tripType: string
  groupSize: number
  hasKids: boolean
  pace: string
  preferences: string[]
  originalInput?: string
}

// NYC-specific places for demonstration/fallback
const NYC_PLACES = {
  attractions: [
    { name: "Central Park", address: "Central Park, New York, NY 10024", duration: 150 },
    { name: "Times Square", address: "Times Square, Manhattan, NY 10036", duration: 90 },
    { name: "Empire State Building", address: "20 W 34th St, New York, NY 10001", duration: 120 },
    { name: "Statue of Liberty", address: "Liberty Island, New York, NY 10004", duration: 240 },
    { name: "Brooklyn Bridge", address: "Brooklyn Bridge, New York, NY 10038", duration: 90 },
    { name: "High Line", address: "New York, NY 10011", duration: 90 },
    { name: "9/11 Memorial", address: "180 Greenwich St, New York, NY 10007", duration: 120 },
    { name: "American Museum of Natural History", address: "200 Central Park West, New York, NY 10024", duration: 180 },
    { name: "MoMA", address: "11 W 53rd St, New York, NY 10019", duration: 150 },
    { name: "Top of the Rock", address: "45 Rockefeller Plaza, New York, NY 10111", duration: 90 }
  ],
  restaurants: [
    { name: "Joe's Pizza", address: "7 Carmine St, New York, NY 10014", duration: 60 },
    { name: "Katz's Delicatessen", address: "205 E Houston St, New York, NY 10002", duration: 90 },
    { name: "Shake Shack", address: "Madison Square Park, New York, NY 10010", duration: 75 },
    { name: "Levain Bakery", address: "167 W 74th St, New York, NY 10023", duration: 45 },
    { name: "Xi'an Famous Foods", address: "81 St Marks Pl, New York, NY 10003", duration: 60 },
    { name: "The Halal Guys", address: "307 E 14th St, New York, NY 10003", duration: 45 },
    { name: "Grimaldi's Pizzeria", address: "1 Front St, Brooklyn, NY 11201", duration: 90 },
    { name: "Junior's Restaurant", address: "386 Flatbush Ave Ext, Brooklyn, NY 11201", duration: 90 }
  ],
  familyFriendly: [
    { name: "Children's Museum of Manhattan", address: "212 W 83rd St, New York, NY 10024", duration: 150 },
    { name: "Bronx Zoo", address: "2300 Southern Blvd, Bronx, NY 10460", duration: 240 },
    { name: "Coney Island", address: "Coney Island, Brooklyn, NY 11224", duration: 180 },
    { name: "Dylan's Candy Bar", address: "1011 3rd Ave, New York, NY 10065", duration: 60 }
  ]
}

class ItineraryGenerator {
  async generate(request: ItineraryGeneratorRequest): Promise<ItinerarySuggestion[]> {
    const days = Math.ceil(
      (new Date(request.endDate).getTime() - new Date(request.startDate).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1

    console.log('🎯 ItineraryGenerator: Creating', days, 'day itinerary for', request.destination)

    // Try AI first if configured
    if (isOpenAIConfigured()) {
      try {
        const aiItinerary = await openaiService.generateItinerary({
          destination: request.destination,
          startDate: request.startDate,
          endDate: request.endDate,
          tripType: request.tripType,
          groupSize: request.groupSize,
          hasKids: request.hasKids,
          pace: request.pace,
          preferences: request.preferences,
          originalInput: request.originalInput
        })
        if (this.validateItinerary(aiItinerary, days, !!request.originalInput)) {
          console.log('✅ AI generated valid itinerary')
          return aiItinerary
        } else {
          console.warn('⚠️ AI itinerary failed validation, using fallback')
        }
      } catch (error) {
        console.error('❌ AI generation failed:', error)
      }
    }

    // Fallback to deterministic generation
    console.log('🔧 Using fallback itinerary generation')
    return this.generateFallbackItinerary(request, days)
  }

  private validateItinerary(itinerary: ItinerarySuggestion[], expectedDays: number, hasOriginalInput?: boolean): boolean {
    if (!itinerary || itinerary.length === 0) return false
    
    // More flexible validation for user-provided content
    if (hasOriginalInput) {
      // For pasted content, just ensure we have some structure
      for (const day of itinerary) {
        if (!day.places || day.places.length === 0) return false
      }
      return true
    }
    
    // Strict validation for AI-generated content
    if (itinerary.length < expectedDays) return false
    
    for (const day of itinerary) {
      if (!day.places || day.places.length < 3) return false
    }
    
    return true
  }

  private generateFallbackItinerary(request: ItineraryGeneratorRequest, days: number): ItinerarySuggestion[] {
    const itinerary: ItinerarySuggestion[] = []
    const placesPerDay = request.pace === 'relaxed' ? 4 : request.pace === 'moderate' ? 5 : 6

    // Use NYC places if destination includes "New York" or "NYC"
    const isNYC = request.destination.toLowerCase().includes('new york') || 
                  request.destination.toLowerCase().includes('nyc')

    for (let day = 1; day <= days; day++) {
      const dayPlaces: ItinerarySuggestion['places'] = []
      let currentTime = 9 // Start at 9 AM

      // Morning attraction
      const morningPlace = isNYC && day <= 3 ? 
        NYC_PLACES.attractions[day - 1] : 
        { name: `${request.destination} Morning Attraction`, address: request.destination, duration: 120 }
      
      dayPlaces.push({
        name: morningPlace.name,
        address: morningPlace.address,
        category: 'attraction',
        description: `Start your day exploring ${morningPlace.name}. ${request.hasKids ? 'Great for families with children.' : 'A must-see attraction.'}`,
        estimatedDuration: morningPlace.duration,
        suggestedTime: `${currentTime.toString().padStart(2, '0')}:00`,
        whyRecommended: this.getRecommendationReason(request, 'attraction', true)
      })
      currentTime += Math.ceil(morningPlace.duration / 60) + 0.5 // Add travel time

      // Lunch
      const lunchPlace = isNYC && day <= NYC_PLACES.restaurants.length ? 
        NYC_PLACES.restaurants[day - 1] : 
        { name: `Local Restaurant`, address: request.destination, duration: 75 }
      
      dayPlaces.push({
        name: lunchPlace.name,
        address: lunchPlace.address,
        category: 'restaurant',
        description: 'Enjoy a delicious lunch at this popular spot.',
        estimatedDuration: lunchPlace.duration,
        suggestedTime: `${Math.floor(currentTime)}:${((currentTime % 1) * 60).toString().padStart(2, '0')}`,
        whyRecommended: 'Great food and atmosphere'
      })
      currentTime += Math.ceil(lunchPlace.duration / 60) + 0.5

      // Afternoon activities
      if (placesPerDay >= 4) {
        const afternoonPlace = request.hasKids && isNYC && NYC_PLACES.familyFriendly[day - 1] ?
          NYC_PLACES.familyFriendly[day - 1] :
          { name: `${request.destination} Afternoon Activity`, address: request.destination, duration: 120 }
        
        dayPlaces.push({
          name: afternoonPlace.name,
          address: afternoonPlace.address,
          category: 'attraction',
          description: request.hasKids ? 'Family-friendly afternoon activity.' : 'Explore more of the city.',
          estimatedDuration: afternoonPlace.duration,
          suggestedTime: `${Math.floor(currentTime)}:${((currentTime % 1) * 60).toString().padStart(2, '0')}`,
          whyRecommended: this.getRecommendationReason(request, 'attraction', false)
        })
        currentTime += Math.ceil(afternoonPlace.duration / 60) + 0.5
      }

      // Add extra activity for packed pace
      if (placesPerDay >= 5) {
        dayPlaces.push({
          name: `${request.destination} Cultural Experience`,
          address: request.destination,
          category: 'attraction',
          description: 'Immerse yourself in local culture.',
          estimatedDuration: 90,
          suggestedTime: `${Math.floor(currentTime)}:${((currentTime % 1) * 60).toString().padStart(2, '0')}`,
          whyRecommended: 'Unique local experience'
        })
        currentTime += 2
      }

      // Dinner
      dayPlaces.push({
        name: `Dinner Restaurant Day ${day}`,
        address: request.destination,
        category: 'restaurant',
        description: 'End your day with a memorable dinner.',
        estimatedDuration: 90,
        suggestedTime: '19:00',
        whyRecommended: 'Highly rated dinner spot'
      })

      // Evening activity for packed pace
      if (placesPerDay >= 6) {
        dayPlaces.push({
          name: `Evening Entertainment`,
          address: request.destination,
          category: 'attraction',
          description: 'Optional evening activity or show.',
          estimatedDuration: 120,
          suggestedTime: '21:00',
          whyRecommended: 'Great nightlife option'
        })
      }

      itinerary.push({
        day,
        places: dayPlaces
      })
    }

    return itinerary
  }

  private getRecommendationReason(request: ItineraryGeneratorRequest, type: string, isMorning: boolean): string {
    const reasons = []
    
    if (request.hasKids) reasons.push('Family-friendly')
    if (request.preferences.includes('culture')) reasons.push('Cultural experience')
    if (request.preferences.includes('foodie') && type === 'restaurant') reasons.push('Local cuisine')
    if (request.preferences.includes('nature') && isMorning) reasons.push('Outdoor activity')
    if (request.preferences.includes('history')) reasons.push('Historical significance')
    
    return reasons.length > 0 ? reasons.join(', ') : 'Highly recommended by travelers'
  }
}

export const itineraryGenerator = new ItineraryGenerator()