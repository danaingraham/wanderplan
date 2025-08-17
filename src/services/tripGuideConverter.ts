import { v4 as uuidv4 } from 'uuid'
import { supabase } from '../lib/supabase'
import type {
  TripGuide,
  GuideMetadata,
  AccommodationRecommendation,
  ActivityRecommendation,
  DiningRecommendation,
  TripType,
  MealType,
  PriceRange,
  ActivityCategory,
  AccommodationType,
  TransportationTip
} from '../types/guide'
import type { Trip, Place, User } from '../types'

export class TripGuideConverter {
  /**
   * Convert a trip itinerary to a trip guide
   */
  async convertItineraryToGuide(
    tripId: string,
    userId: string,
    additionalInfo?: {
      coverImage?: string
      tags?: string[]
      highlights?: string[]
      packingTips?: string[]
      localTips?: string[]
      bestTimeToVisit?: string
      avoidThese?: string[]
    }
  ): Promise<TripGuide> {
    try {
      // Fetch the trip data
      const trip = await this.fetchTrip(tripId)
      if (!trip) {
        throw new Error('Trip not found')
      }

      // Verify ownership
      if (trip.created_by !== userId) {
        throw new Error('Unauthorized: You can only convert your own trips to guides')
      }

      // Fetch user data for author info
      const user = await this.fetchUser(userId)
      if (!user) {
        throw new Error('User not found')
      }

      // Fetch all places associated with the trip
      const places = await this.fetchTripPlaces(tripId)

      // Generate metadata
      const metadata = this.generateMetadata(trip, user, additionalInfo)

      // Extract and categorize places
      const accommodations = this.extractAccommodations(places)
      const activities = this.extractActivities(places)
      const dining = this.extractDining(places)
      const transportation = this.extractTransportation(places)

      // Create the guide object
      const guide: TripGuide = {
        id: uuidv4(),
        metadata,
        accommodations,
        activities,
        dining,
        itineraryId: tripId,
        highlights: additionalInfo?.highlights || this.generateHighlights(places),
        packingTips: additionalInfo?.packingTips || this.generatePackingTips(trip),
        transportation,
        localTips: additionalInfo?.localTips || [],
        bestTimeToVisit: additionalInfo?.bestTimeToVisit || this.suggestBestTimeToVisit(trip),
        avoidThese: additionalInfo?.avoidThese || []
      }

      return guide
    } catch (error) {
      console.error('Error converting itinerary to guide:', error)
      throw error
    }
  }

  /**
   * Fetch trip data from database
   */
  private async fetchTrip(tripId: string): Promise<Trip | null> {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single()

    if (error) {
      console.error('Error fetching trip:', error)
      return null
    }

    return data
  }

  /**
   * Fetch user data from database
   */
  private async fetchUser(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user:', error)
      return null
    }

    return data
  }

  /**
   * Fetch all places for a trip
   */
  private async fetchTripPlaces(tripId: string): Promise<Place[]> {
    const { data, error } = await supabase
      .from('places')
      .select('*')
      .eq('trip_id', tripId)
      .order('day', { ascending: true })
      .order('order', { ascending: true })

    if (error) {
      console.error('Error fetching places:', error)
      return []
    }

    return data || []
  }

  /**
   * Generate guide metadata from trip data
   */
  private generateMetadata(
    trip: Trip,
    user: User,
    additionalInfo?: { coverImage?: string; tags?: string[] }
  ): GuideMetadata {
    const startDate = trip.start_date ? new Date(trip.start_date) : new Date()
    const endDate = trip.end_date ? new Date(trip.end_date) : new Date()
    const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

    return {
      author: {
        id: user.id,
        name: user.full_name || user.email,
        profilePicture: user.profile_picture_url || user.profile_picture
      },
      destination: this.parseDestination(trip.destination),
      tripType: this.mapTripType(trip.trip_type),
      travelDate: {
        month: startDate.getMonth() + 1,
        year: startDate.getFullYear()
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublished: false,
      tags: additionalInfo?.tags || this.generateTags(trip),
      coverImage: additionalInfo?.coverImage,
      tripDuration: duration,
      groupSize: trip.group_size,
      budget: this.estimateBudget(trip.pace)
    }
  }

  /**
   * Parse destination string into structured format
   */
  private parseDestination(destination: string): { city: string; country: string; region?: string } {
    const parts = destination.split(',').map(p => p.trim())
    
    if (parts.length >= 2) {
      return {
        city: parts[0],
        country: parts[parts.length - 1],
        region: parts.length > 2 ? parts[1] : undefined
      }
    }
    
    return {
      city: destination,
      country: 'Unknown'
    }
  }

  /**
   * Map trip type to guide trip type
   */
  private mapTripType(tripType: string): TripType {
    const typeMap: Record<string, TripType> = {
      'solo': 'solo',
      'romantic': 'romantic',
      'family': 'family',
      'friends': 'group',
      'business': 'business'
    }
    
    return typeMap[tripType] || 'solo'
  }

  /**
   * Extract accommodation recommendations from places
   */
  private extractAccommodations(places: Place[]): AccommodationRecommendation[] {
    const accommodations = places.filter(p => 
      p.category === 'hotel' || 
      p.category === 'accommodation'
    )

    // Deduplicate by name
    const uniqueAccommodations = new Map<string, AccommodationRecommendation>()
    
    accommodations.forEach(place => {
      if (!uniqueAccommodations.has(place.name)) {
        uniqueAccommodations.set(place.name, {
          id: uuidv4(),
          name: place.name,
          type: this.determineAccommodationType(place),
          neighborhood: this.extractNeighborhood(place.address),
          description: place.notes || '',
          priceRange: this.estimatePriceRange(place),
          images: place.photo_url ? [{ id: uuidv4(), url: place.photo_url }] : [],
          bookingLinks: [],
          authorNotes: place.notes
        })
      }
    })

    return Array.from(uniqueAccommodations.values())
  }

  /**
   * Extract activity recommendations from places
   */
  private extractActivities(places: Place[]): ActivityRecommendation[] {
    const activities = places.filter(p => 
      p.category === 'attraction' || 
      p.category === 'activity' ||
      p.category === 'shop'
    )

    return activities.map(place => ({
      id: uuidv4(),
      name: place.name,
      category: this.categorizeActivity(place),
      description: place.notes || '',
      location: place.address || '',
      duration: place.duration ? `${place.duration} minutes` : '1-2 hours',
      bestTimeToVisit: this.suggestBestTime(place),
      cost: 'Varies',
      images: place.photo_url ? [{ id: uuidv4(), url: place.photo_url }] : [],
      tips: this.extractTips(place),
      bookingRequired: place.is_reservation || false,
      bookingLink: place.website
    }))
  }

  /**
   * Extract dining recommendations from places
   */
  private extractDining(places: Place[]): DiningRecommendation[] {
    const dining = places.filter(p => 
      p.category === 'restaurant' || 
      p.category === 'cafe' ||
      p.category === 'bar'
    )

    // Deduplicate by name
    const uniqueDining = new Map<string, DiningRecommendation>()
    
    dining.forEach(place => {
      if (!uniqueDining.has(place.name)) {
        uniqueDining.set(place.name, {
          id: uuidv4(),
          name: place.name,
          cuisine: this.guessCuisine(place),
          mealTypes: this.determineMealTypes(place),
          neighborhood: this.extractNeighborhood(place.address),
          priceRange: this.estimatePriceRange(place),
          description: place.notes || '',
          images: place.photo_url ? [{ id: uuidv4(), url: place.photo_url }] : [],
          reservationRequired: place.is_reservation || false,
          reservationLink: place.website,
          authorNotes: place.notes
        })
      } else {
        // If we see the same restaurant multiple times, add more meal types
        const existing = uniqueDining.get(place.name)!
        const newMealTypes = this.determineMealTypes(place)
        existing.mealTypes = Array.from(new Set([...existing.mealTypes, ...newMealTypes]))
      }
    })

    return Array.from(uniqueDining.values())
  }

  /**
   * Extract transportation tips from places
   */
  private extractTransportation(places: Place[]): TransportationTip[] {
    const transportPlaces = places.filter(p => 
      p.category === 'transport' || 
      p.category === 'flight'
    )

    const tips: TransportationTip[] = []
    
    // Add general transportation tips based on what we find
    if (transportPlaces.some(p => p.category === 'flight')) {
      tips.push({
        id: uuidv4(),
        type: 'rideshare',
        description: 'Use rideshare apps for airport transfers',
        cost: 'Varies by distance',
        tips: ['Book in advance during peak times', 'Consider shared rides for budget savings']
      })
    }

    // Add default tips if none found
    if (tips.length === 0) {
      tips.push({
        id: uuidv4(),
        type: 'public',
        description: 'Research local public transportation options',
        tips: ['Download transit apps', 'Consider day passes for multiple trips']
      })
    }

    return tips
  }

  /**
   * Helper methods
   */
  private determineAccommodationType(place: Place): AccommodationType {
    const name = place.name.toLowerCase()
    if (name.includes('hostel')) return 'hostel'
    if (name.includes('resort')) return 'resort'
    if (name.includes('airbnb') || name.includes('apartment')) return 'airbnb'
    return 'hotel'
  }

  private extractNeighborhood(address?: string): string {
    if (!address) return 'City Center'
    // Simple extraction - in real implementation, use geocoding API
    const parts = address.split(',')
    return parts.length > 1 ? parts[parts.length - 2].trim() : 'City Center'
  }

  private estimatePriceRange(place: Place): PriceRange {
    // In real implementation, use actual price data
    if (place.category === 'hotel' || place.category === 'accommodation') {
      return '$$'
    }
    return '$'
  }

  private categorizeActivity(place: Place): ActivityCategory {
    const name = place.name.toLowerCase()
    // const notes = (place.notes || '').toLowerCase() // Not currently used
    
    if (name.includes('museum') || name.includes('gallery')) return 'cultural'
    if (name.includes('park') || name.includes('garden')) return 'nature'
    if (name.includes('shop') || name.includes('market')) return 'shopping'
    if (name.includes('bar') || name.includes('club')) return 'nightlife'
    if (name.includes('spa') || name.includes('beach')) return 'relaxation'
    
    return 'sightseeing'
  }

  private suggestBestTime(place: Place): string {
    if (place.start_time) {
      const hour = parseInt(place.start_time.split(':')[0])
      if (hour < 12) return 'Morning'
      if (hour < 17) return 'Afternoon'
      return 'Evening'
    }
    return 'Anytime'
  }

  private extractTips(place: Place): string[] {
    const tips: string[] = []
    if (place.is_reservation) {
      tips.push('Reservation recommended')
    }
    if (place.notes) {
      tips.push(place.notes)
    }
    return tips
  }

  private guessCuisine(place: Place): string {
    const name = place.name.toLowerCase()
    
    // Common cuisine keywords
    if (name.includes('italian') || name.includes('pizza') || name.includes('pasta')) return 'Italian'
    if (name.includes('chinese') || name.includes('dim sum')) return 'Chinese'
    if (name.includes('japanese') || name.includes('sushi') || name.includes('ramen')) return 'Japanese'
    if (name.includes('mexican') || name.includes('taco')) return 'Mexican'
    if (name.includes('thai')) return 'Thai'
    if (name.includes('indian')) return 'Indian'
    if (name.includes('french') || name.includes('bistro')) return 'French'
    if (name.includes('cafe') || name.includes('coffee')) return 'Cafe'
    if (name.includes('bar') || name.includes('pub')) return 'Bar/Pub'
    
    return 'International'
  }

  private determineMealTypes(place: Place): MealType[] {
    const mealTypes: MealType[] = []
    
    if (place.category === 'cafe') {
      mealTypes.push('breakfast', 'brunch', 'snack')
    } else if (place.category === 'bar') {
      mealTypes.push('dinner', 'snack')
    } else {
      // Determine by time if available
      if (place.start_time) {
        const hour = parseInt(place.start_time.split(':')[0])
        if (hour < 11) mealTypes.push('breakfast')
        else if (hour < 15) mealTypes.push('lunch')
        else if (hour < 22) mealTypes.push('dinner')
      } else {
        // Default to lunch and dinner for restaurants
        mealTypes.push('lunch', 'dinner')
      }
    }
    
    return mealTypes.length > 0 ? mealTypes : ['lunch', 'dinner']
  }

  private generateHighlights(places: Place[]): string[] {
    const highlights: string[] = []
    
    // Find most popular categories
    const categories = places.map(p => p.category)
    const uniqueCategories = Array.from(new Set(categories))
    
    if (uniqueCategories.includes('attraction')) {
      highlights.push('Must-see attractions and landmarks')
    }
    if (uniqueCategories.includes('restaurant')) {
      highlights.push('Local dining experiences')
    }
    if (categories.filter(c => c === 'activity').length > 3) {
      highlights.push('Packed with activities and experiences')
    }
    
    return highlights
  }

  private generatePackingTips(trip: Trip): string[] {
    const tips: string[] = []
    
    if (trip.has_kids) {
      tips.push('Pack entertainment for children during transit')
      tips.push('Bring snacks and water bottles')
    }
    
    if (trip.pace === 'packed') {
      tips.push('Comfortable walking shoes are essential')
      tips.push('Lightweight daypack for carrying essentials')
    }
    
    if (trip.preferences?.includes('nature')) {
      tips.push('Pack appropriate outdoor gear')
      tips.push('Sunscreen and insect repellent')
    }
    
    return tips
  }

  private suggestBestTimeToVisit(trip: Trip): string {
    if (trip.start_date) {
      const date = new Date(trip.start_date)
      const month = date.toLocaleString('default', { month: 'long' })
      return `${month} is a great time to visit`
    }
    return 'Year-round destination'
  }

  private generateTags(trip: Trip): string[] {
    const tags: string[] = []
    
    tags.push(trip.trip_type)
    if (trip.has_kids) tags.push('family-friendly')
    tags.push(trip.pace)
    
    if (trip.preferences) {
      tags.push(...trip.preferences)
    }
    
    return tags
  }

  private estimateBudget(pace?: string): PriceRange {
    if (pace === 'packed') return '$$$'
    if (pace === 'moderate') return '$$'
    return '$'
  }
}