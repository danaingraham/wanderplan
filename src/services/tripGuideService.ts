import { supabase } from '../lib/supabase'
import { TripGuideConverter } from './tripGuideConverter'
import { DataEnrichmentService } from './dataEnrichmentService'
import type {
  TripGuide,
  GuideCreateRequest,
  GuideUpdateRequest,
  GuideSearchFilters,
  AccommodationRecommendation,
  ActivityRecommendation,
  DiningRecommendation,
  TransportationTip
} from '../types/guide'

export class TripGuideService {
  private converter: TripGuideConverter
  private enrichmentService: DataEnrichmentService

  constructor() {
    this.converter = new TripGuideConverter()
    this.enrichmentService = new DataEnrichmentService()
  }

  /**
   * Create a new guide from an existing itinerary
   */
  async createFromItinerary(
    itineraryId: string,
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
      // Convert itinerary to guide
      const guide = await this.converter.convertItineraryToGuide(
        itineraryId,
        userId,
        additionalInfo
      )

      // Enrich with external data
      await this.enrichmentService.enrichGuide({
        accommodations: guide.accommodations,
        activities: guide.activities,
        dining: guide.dining
      })

      // Save to database
      await this.saveGuide(guide, userId)

      return guide
    } catch (error) {
      console.error('Error creating guide from itinerary:', error)
      throw error
    }
  }

  /**
   * Create a new guide from scratch
   */
  async createGuide(request: GuideCreateRequest, userId: string): Promise<TripGuide> {
    try {
      const guide: TripGuide = {
        id: crypto.randomUUID(),
        metadata: {
          author: {
            id: userId,
            name: '',
            profilePicture: undefined
          },
          destination: {
            city: '',
            country: ''
          },
          tripType: 'solo',
          travelDate: {
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear()
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          isPublished: false,
          ...request.metadata
        },
        accommodations: [],
        activities: [],
        dining: [],
        itineraryId: request.fromItineraryId
      }

      // Fetch user details
      const { data: userData } = await supabase
        .from('users')
        .select('full_name, profile_picture_url')
        .eq('id', userId)
        .single()

      if (userData) {
        guide.metadata.author.name = userData.full_name || ''
        guide.metadata.author.profilePicture = userData.profile_picture_url
      }

      // Save to database
      await this.saveGuide(guide, userId)

      return guide
    } catch (error) {
      console.error('Error creating guide:', error)
      throw error
    }
  }

  /**
   * Update an existing guide
   */
  async updateGuide(
    guideId: string,
    updates: GuideUpdateRequest,
    userId: string
  ): Promise<TripGuide> {
    try {
      // Verify ownership
      const { data: existingGuide } = await supabase
        .from('trip_guides')
        .select('author_id')
        .eq('id', guideId)
        .single()

      if (!existingGuide || existingGuide.author_id !== userId) {
        throw new Error('Unauthorized: You can only edit your own guides')
      }

      // Update metadata if provided
      if (updates.metadata) {
        await supabase
          .from('trip_guides')
          .update({
            destination_city: updates.metadata.destination?.city,
            destination_country: updates.metadata.destination?.country,
            destination_region: updates.metadata.destination?.region,
            trip_type: updates.metadata.tripType,
            travel_month: updates.metadata.travelDate?.month,
            travel_year: updates.metadata.travelDate?.year,
            tags: updates.metadata.tags,
            cover_image: updates.metadata.coverImage,
            trip_duration: updates.metadata.tripDuration,
            group_size: updates.metadata.groupSize,
            budget: updates.metadata.budget,
            highlights: updates.highlights,
            packing_tips: updates.packingTips,
            local_tips: updates.localTips,
            best_time_to_visit: updates.bestTimeToVisit,
            avoid_these: updates.avoidThese,
            updated_at: new Date()
          })
          .eq('id', guideId)
      }

      // Update accommodations
      if (updates.accommodations) {
        await this.updateAccommodations(guideId, updates.accommodations)
      }

      // Update activities
      if (updates.activities) {
        await this.updateActivities(guideId, updates.activities)
      }

      // Update dining
      if (updates.dining) {
        await this.updateDining(guideId, updates.dining)
      }

      // Update transportation
      if (updates.transportation) {
        await this.updateTransportation(guideId, updates.transportation)
      }

      // Fetch and return updated guide
      return await this.getGuide(guideId)
    } catch (error) {
      console.error('Error updating guide:', error)
      throw error
    }
  }

  /**
   * Delete a guide
   */
  async deleteGuide(guideId: string, userId: string): Promise<void> {
    try {
      // Verify ownership
      const { data: existingGuide } = await supabase
        .from('trip_guides')
        .select('author_id')
        .eq('id', guideId)
        .single()

      if (!existingGuide || existingGuide.author_id !== userId) {
        throw new Error('Unauthorized: You can only delete your own guides')
      }

      // Delete guide (cascades to related tables)
      await supabase
        .from('trip_guides')
        .delete()
        .eq('id', guideId)
    } catch (error) {
      console.error('Error deleting guide:', error)
      throw error
    }
  }

  /**
   * Publish a guide
   */
  async publishGuide(guideId: string, userId: string): Promise<void> {
    try {
      // Verify ownership
      const { data: existingGuide } = await supabase
        .from('trip_guides')
        .select('author_id')
        .eq('id', guideId)
        .single()

      if (!existingGuide || existingGuide.author_id !== userId) {
        throw new Error('Unauthorized: You can only publish your own guides')
      }

      await supabase
        .from('trip_guides')
        .update({
          is_published: true,
          published_at: new Date()
        })
        .eq('id', guideId)
    } catch (error) {
      console.error('Error publishing guide:', error)
      throw error
    }
  }

  /**
   * Unpublish a guide
   */
  async unpublishGuide(guideId: string, userId: string): Promise<void> {
    try {
      // Verify ownership
      const { data: existingGuide } = await supabase
        .from('trip_guides')
        .select('author_id')
        .eq('id', guideId)
        .single()

      if (!existingGuide || existingGuide.author_id !== userId) {
        throw new Error('Unauthorized: You can only unpublish your own guides')
      }

      await supabase
        .from('trip_guides')
        .update({
          is_published: false,
          published_at: null
        })
        .eq('id', guideId)
    } catch (error) {
      console.error('Error unpublishing guide:', error)
      throw error
    }
  }

  /**
   * Get a single guide
   */
  async getGuide(guideId: string): Promise<TripGuide> {
    try {
      // Fetch guide with all related data
      const { data: guideData, error } = await supabase
        .from('trip_guides')
        .select(`
          *,
          author:users!trip_guides_author_id_fkey(
            id,
            full_name,
            profile_picture_url
          ),
          accommodations:guide_accommodations(*),
          activities:guide_activities(*),
          dining:guide_dining(*),
          transportation:guide_transportation(*)
        `)
        .eq('id', guideId)
        .single()

      if (error || !guideData) {
        throw new Error('Guide not found')
      }

      // Transform database data to TripGuide format
      return this.transformDatabaseGuide(guideData)
    } catch (error) {
      console.error('Error fetching guide:', error)
      throw error
    }
  }

  /**
   * Search for guides
   */
  async searchGuides(filters: GuideSearchFilters): Promise<TripGuide[]> {
    try {
      let query = supabase
        .from('trip_guides')
        .select(`
          *,
          author:users!trip_guides_author_id_fkey(
            id,
            full_name,
            profile_picture_url
          )
        `)
        .eq('is_published', true)

      // Apply filters
      if (filters.destination) {
        query = query.or(`destination_city.ilike.%${filters.destination}%,destination_country.ilike.%${filters.destination}%`)
      }

      if (filters.tripType) {
        query = query.eq('trip_type', filters.tripType)
      }

      if (filters.priceRange) {
        query = query.eq('budget', filters.priceRange)
      }

      if (filters.duration?.min) {
        query = query.gte('trip_duration', filters.duration.min)
      }

      if (filters.duration?.max) {
        query = query.lte('trip_duration', filters.duration.max)
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags)
      }

      if (filters.author) {
        query = query.eq('author_id', filters.author)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      // Transform and return guides
      return (data || []).map(guide => this.transformDatabaseGuide(guide))
    } catch (error) {
      console.error('Error searching guides:', error)
      throw error
    }
  }

  /**
   * Get guides by user
   */
  async getUserGuides(userId: string): Promise<TripGuide[]> {
    try {
      const { data, error } = await supabase
        .from('trip_guides')
        .select(`
          *,
          author:users!trip_guides_author_id_fkey(
            id,
            full_name,
            profile_picture_url
          )
        `)
        .eq('author_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return (data || []).map(guide => this.transformDatabaseGuide(guide))
    } catch (error) {
      console.error('Error fetching user guides:', error)
      throw error
    }
  }

  /**
   * Track guide analytics
   */
  async trackAnalytics(
    guideId: string,
    userId: string | null,
    action: 'view' | 'save' | 'share' | 'use_for_trip'
  ): Promise<void> {
    try {
      await supabase
        .from('guide_analytics')
        .insert({
          guide_id: guideId,
          user_id: userId,
          action
        })
    } catch (error) {
      console.error('Error tracking analytics:', error)
    }
  }

  /**
   * Private helper methods
   */

  private async saveGuide(guide: TripGuide, userId: string): Promise<void> {
    try {
      // Save main guide record
      const { error: guideError } = await supabase
        .from('trip_guides')
        .insert({
          id: guide.id,
          itinerary_id: guide.itineraryId,
          author_id: userId,
          destination_city: guide.metadata.destination.city,
          destination_country: guide.metadata.destination.country,
          destination_region: guide.metadata.destination.region,
          trip_type: guide.metadata.tripType,
          travel_month: guide.metadata.travelDate.month,
          travel_year: guide.metadata.travelDate.year,
          trip_duration: guide.metadata.tripDuration,
          group_size: guide.metadata.groupSize,
          budget: guide.metadata.budget,
          cover_image: guide.metadata.coverImage,
          tags: guide.metadata.tags,
          highlights: guide.highlights,
          packing_tips: guide.packingTips,
          local_tips: guide.localTips,
          best_time_to_visit: guide.bestTimeToVisit,
          avoid_these: guide.avoidThese,
          is_published: guide.metadata.isPublished,
          published_at: guide.metadata.publishedAt
        })

      if (guideError) throw guideError

      // Save accommodations
      if (guide.accommodations.length > 0) {
        await this.saveAccommodations(guide.id, guide.accommodations)
      }

      // Save activities
      if (guide.activities.length > 0) {
        await this.saveActivities(guide.id, guide.activities)
      }

      // Save dining
      if (guide.dining.length > 0) {
        await this.saveDining(guide.id, guide.dining)
      }

      // Save transportation
      if (guide.transportation && guide.transportation.length > 0) {
        await this.saveTransportation(guide.id, guide.transportation)
      }
    } catch (error) {
      console.error('Error saving guide:', error)
      throw error
    }
  }

  private async saveAccommodations(
    guideId: string,
    accommodations: AccommodationRecommendation[]
  ): Promise<void> {
    const records = accommodations.map(acc => ({
      id: acc.id,
      guide_id: guideId,
      name: acc.name,
      type: acc.type,
      neighborhood: acc.neighborhood,
      description: acc.description,
      price_range: acc.priceRange,
      author_notes: acc.authorNotes,
      pros: acc.pros,
      cons: acc.cons,
      amenities: acc.amenities,
      rating: acc.rating,
      images: acc.images,
      booking_links: acc.bookingLinks
    }))

    const { error } = await supabase
      .from('guide_accommodations')
      .insert(records)

    if (error) throw error
  }

  private async saveActivities(
    guideId: string,
    activities: ActivityRecommendation[]
  ): Promise<void> {
    const records = activities.map(act => ({
      id: act.id,
      guide_id: guideId,
      name: act.name,
      category: act.category,
      description: act.description,
      location: act.location,
      duration: act.duration,
      best_time_to_visit: act.bestTimeToVisit,
      cost: act.cost,
      booking_required: act.bookingRequired,
      booking_link: act.bookingLink,
      tips: act.tips,
      rating: act.rating,
      difficulty: act.difficulty,
      accessibility: act.accessibility,
      images: act.images
    }))

    const { error } = await supabase
      .from('guide_activities')
      .insert(records)

    if (error) throw error
  }

  private async saveDining(
    guideId: string,
    dining: DiningRecommendation[]
  ): Promise<void> {
    const records = dining.map(din => ({
      id: din.id,
      guide_id: guideId,
      name: din.name,
      cuisine: din.cuisine,
      meal_types: din.mealTypes,
      neighborhood: din.neighborhood,
      price_range: din.priceRange,
      description: din.description,
      must_try_dishes: din.mustTryDishes,
      dietary_options: din.dietaryOptions,
      atmosphere: din.atmosphere,
      reservation_required: din.reservationRequired,
      reservation_link: din.reservationLink,
      author_notes: din.authorNotes,
      rating: din.rating,
      images: din.images
    }))

    const { error } = await supabase
      .from('guide_dining')
      .insert(records)

    if (error) throw error
  }

  private async saveTransportation(
    guideId: string,
    transportation: TransportationTip[]
  ): Promise<void> {
    const records = transportation.map(trans => ({
      id: trans.id,
      guide_id: guideId,
      type: trans.type,
      description: trans.description,
      cost: trans.cost,
      tips: trans.tips
    }))

    const { error } = await supabase
      .from('guide_transportation')
      .insert(records)

    if (error) throw error
  }

  private async updateAccommodations(
    guideId: string,
    accommodations: AccommodationRecommendation[]
  ): Promise<void> {
    // Delete existing and insert new
    await supabase
      .from('guide_accommodations')
      .delete()
      .eq('guide_id', guideId)

    if (accommodations.length > 0) {
      await this.saveAccommodations(guideId, accommodations)
    }
  }

  private async updateActivities(
    guideId: string,
    activities: ActivityRecommendation[]
  ): Promise<void> {
    await supabase
      .from('guide_activities')
      .delete()
      .eq('guide_id', guideId)

    if (activities.length > 0) {
      await this.saveActivities(guideId, activities)
    }
  }

  private async updateDining(
    guideId: string,
    dining: DiningRecommendation[]
  ): Promise<void> {
    await supabase
      .from('guide_dining')
      .delete()
      .eq('guide_id', guideId)

    if (dining.length > 0) {
      await this.saveDining(guideId, dining)
    }
  }

  private async updateTransportation(
    guideId: string,
    transportation: TransportationTip[]
  ): Promise<void> {
    await supabase
      .from('guide_transportation')
      .delete()
      .eq('guide_id', guideId)

    if (transportation.length > 0) {
      await this.saveTransportation(guideId, transportation)
    }
  }

  private transformDatabaseGuide(data: any): TripGuide {
    return {
      id: data.id,
      metadata: {
        author: {
          id: data.author.id,
          name: data.author.full_name,
          profilePicture: data.author.profile_picture_url
        },
        destination: {
          city: data.destination_city,
          country: data.destination_country,
          region: data.destination_region
        },
        tripType: data.trip_type,
        travelDate: {
          month: data.travel_month,
          year: data.travel_year
        },
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        publishedAt: data.published_at ? new Date(data.published_at) : undefined,
        isPublished: data.is_published,
        tags: data.tags,
        coverImage: data.cover_image,
        tripDuration: data.trip_duration,
        groupSize: data.group_size,
        budget: data.budget
      },
      accommodations: data.accommodations || [],
      activities: data.activities || [],
      dining: data.dining || [],
      itineraryId: data.itinerary_id,
      highlights: data.highlights,
      packingTips: data.packing_tips,
      transportation: data.transportation || [],
      localTips: data.local_tips,
      bestTimeToVisit: data.best_time_to_visit,
      avoidThese: data.avoid_these
    }
  }
}