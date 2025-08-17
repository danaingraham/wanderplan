import type {
  Image,
  BookingLink,
  EnrichmentRequest,
  EnrichmentResponse,
  AccommodationRecommendation,
  ActivityRecommendation,
  DiningRecommendation
} from '../types/guide'

interface PlacePhoto {
  photo_reference: string
  height: number
  width: number
}

interface PlaceDetails {
  name: string
  formatted_address?: string
  formatted_phone_number?: string
  website?: string
  rating?: number
  price_level?: number
  photos?: PlacePhoto[]
  opening_hours?: {
    weekday_text?: string[]
    periods?: Array<{
      open: { day: number; time: string }
      close?: { day: number; time: string }
    }>
  }
  reviews?: Array<{
    rating: number
    text: string
    time: number
  }>
  types?: string[]
  vicinity?: string
}

export class DataEnrichmentService {
  private googleApiKey: string
  private cache: Map<string, EnrichmentResponse>

  constructor() {
    this.googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
    this.cache = new Map()
  }

  /**
   * Main enrichment method
   */
  async enrich(request: EnrichmentRequest): Promise<EnrichmentResponse> {
    const cacheKey = `${request.type}:${request.name}:${request.location}`
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    let response: EnrichmentResponse = {}

    switch (request.type) {
      case 'accommodation':
        response = await this.enrichAccommodation(request.name, request.location)
        break
      case 'activity':
        response = await this.enrichActivity(request.name, request.location)
        break
      case 'dining':
        response = await this.enrichDining(request.name, request.location)
        break
    }

    // Cache the response
    this.cache.set(cacheKey, response)
    
    return response
  }

  /**
   * Enrich accommodation data
   */
  async enrichAccommodation(
    name: string,
    location: string
  ): Promise<EnrichmentResponse> {
    try {
      // Search for the place using Google Places API
      const placeDetails = await this.searchPlace(name, location, ['lodging'])
      
      if (!placeDetails) {
        return {}
      }

      const images = await this.extractImages(placeDetails)
      const bookingLinks = this.generateAccommodationBookingLinks(name, location)
      
      return {
        images,
        bookingLinks,
        rating: placeDetails.rating,
        priceInfo: this.mapPriceLevel(placeDetails.price_level),
        operatingHours: this.formatOpeningHours(placeDetails.opening_hours)
      }
    } catch (error) {
      console.error('Error enriching accommodation:', error)
      return {}
    }
  }

  /**
   * Enrich activity data
   */
  async enrichActivity(
    name: string,
    location: string
  ): Promise<EnrichmentResponse> {
    try {
      // Search for the place
      const placeDetails = await this.searchPlace(name, location, ['tourist_attraction', 'point_of_interest'])
      
      if (!placeDetails) {
        return {}
      }

      const images = await this.extractImages(placeDetails)
      const bookingLinks = this.generateActivityBookingLinks(name, location)
      
      return {
        images,
        bookingLinks,
        rating: placeDetails.rating,
        operatingHours: this.formatOpeningHours(placeDetails.opening_hours)
      }
    } catch (error) {
      console.error('Error enriching activity:', error)
      return {}
    }
  }

  /**
   * Enrich dining data
   */
  async enrichDining(
    name: string,
    location: string
  ): Promise<EnrichmentResponse> {
    try {
      // Search for the restaurant
      const placeDetails = await this.searchPlace(name, location, ['restaurant', 'cafe', 'bar'])
      
      if (!placeDetails) {
        return {}
      }

      const images = await this.extractImages(placeDetails)
      const bookingLinks = this.generateDiningBookingLinks(name, location)
      
      return {
        images,
        bookingLinks,
        rating: placeDetails.rating,
        priceInfo: this.mapPriceLevel(placeDetails.price_level),
        operatingHours: this.formatOpeningHours(placeDetails.opening_hours),
        menuHighlights: this.extractMenuHighlights(placeDetails)
      }
    } catch (error) {
      console.error('Error enriching dining:', error)
      return {}
    }
  }

  /**
   * Search for a place using Google Places API
   */
  private async searchPlace(
    name: string,
    location: string,
    types?: string[]
  ): Promise<PlaceDetails | null> {
    if (!this.googleApiKey) {
      console.warn('Google Maps API key not configured')
      return null
    }

    try {
      // First, search for the place
      const searchQuery = `${name} ${location}`
      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${this.googleApiKey}`
      
      const searchResponse = await fetch(searchUrl)
      const searchData = await searchResponse.json()
      
      if (searchData.results && searchData.results.length > 0) {
        const placeId = searchData.results[0].place_id
        
        // Get detailed information
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,rating,price_level,photos,opening_hours,reviews,types,vicinity&key=${this.googleApiKey}`
        
        const detailsResponse = await fetch(detailsUrl)
        const detailsData = await detailsResponse.json()
        
        return detailsData.result || null
      }
      
      return null
    } catch (error) {
      console.error('Error searching place:', error)
      return null
    }
  }

  /**
   * Extract images from place details
   */
  private async extractImages(placeDetails: PlaceDetails): Promise<Image[]> {
    const images: Image[] = []
    
    if (placeDetails.photos && placeDetails.photos.length > 0) {
      // Limit to first 5 photos
      const photosToProcess = placeDetails.photos.slice(0, 5)
      
      photosToProcess.forEach((photo, index) => {
        const imageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${this.googleApiKey}`
        
        images.push({
          id: `photo-${index}`,
          url: imageUrl,
          isHero: index === 0
        })
      })
    }
    
    return images
  }

  /**
   * Generate accommodation booking links
   */
  private generateAccommodationBookingLinks(name: string, location: string): BookingLink[] {
    const encodedName = encodeURIComponent(name)
    const encodedLocation = encodeURIComponent(location)
    
    return [
      {
        provider: 'Booking.com',
        url: `https://www.booking.com/search.html?ss=${encodedName}+${encodedLocation}`
      },
      {
        provider: 'Hotels.com',
        url: `https://www.hotels.com/search.do?q=${encodedName}+${encodedLocation}`
      },
      {
        provider: 'Expedia',
        url: `https://www.expedia.com/Hotel-Search?destination=${encodedLocation}&hotelName=${encodedName}`
      }
    ]
  }

  /**
   * Generate activity booking links
   */
  private generateActivityBookingLinks(name: string, location: string): BookingLink[] {
    const encodedName = encodeURIComponent(name)
    const encodedLocation = encodeURIComponent(location)
    
    return [
      {
        provider: 'GetYourGuide',
        url: `https://www.getyourguide.com/s/?q=${encodedName}+${encodedLocation}`
      },
      {
        provider: 'Viator',
        url: `https://www.viator.com/searchResults/all?text=${encodedName}+${encodedLocation}`
      },
      {
        provider: 'TripAdvisor',
        url: `https://www.tripadvisor.com/Search?q=${encodedName}+${encodedLocation}`
      }
    ]
  }

  /**
   * Generate dining booking links
   */
  private generateDiningBookingLinks(name: string, location: string): BookingLink[] {
    const encodedName = encodeURIComponent(name)
    const encodedLocation = encodeURIComponent(location)
    
    return [
      {
        provider: 'OpenTable',
        url: `https://www.opentable.com/s/?term=${encodedName}&location=${encodedLocation}`
      },
      {
        provider: 'Yelp',
        url: `https://www.yelp.com/search?find_desc=${encodedName}&find_loc=${encodedLocation}`
      },
      {
        provider: 'Google Maps',
        url: `https://www.google.com/maps/search/${encodedName}+${encodedLocation}`
      }
    ]
  }

  /**
   * Map Google price level to our price range
   */
  private mapPriceLevel(priceLevel?: number): string {
    if (!priceLevel) return '$'
    
    const priceMap: Record<number, string> = {
      1: '$',
      2: '$$',
      3: '$$$',
      4: '$$$$'
    }
    
    return priceMap[priceLevel] || '$'
  }

  /**
   * Format opening hours for display
   */
  private formatOpeningHours(openingHours?: any): string | undefined {
    if (!openingHours || !openingHours.weekday_text) {
      return undefined
    }
    
    return openingHours.weekday_text.join(', ')
  }

  /**
   * Extract menu highlights from reviews
   */
  private extractMenuHighlights(placeDetails: PlaceDetails): string[] {
    const highlights: string[] = []
    
    // This is a simplified version - in production, you'd use NLP
    // to extract actual dish names from reviews
    if (placeDetails.reviews) {
      const keywords = ['delicious', 'amazing', 'best', 'try the', 'recommend']
      
      placeDetails.reviews.forEach(review => {
        keywords.forEach(keyword => {
          if (review.text.toLowerCase().includes(keyword)) {
            // Extract a snippet around the keyword
            const index = review.text.toLowerCase().indexOf(keyword)
            const snippet = review.text.substring(index, Math.min(index + 50, review.text.length))
            if (snippet && highlights.length < 3) {
              highlights.push(snippet)
            }
          }
        })
      })
    }
    
    return highlights
  }

  /**
   * Batch enrich multiple items
   */
  async enrichBatch(items: EnrichmentRequest[]): Promise<Map<string, EnrichmentResponse>> {
    const results = new Map<string, EnrichmentResponse>()
    
    // Process in parallel with rate limiting
    const batchSize = 5
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)
      const promises = batch.map(item => this.enrich(item))
      const batchResults = await Promise.all(promises)
      
      batch.forEach((item, index) => {
        const key = `${item.type}:${item.name}:${item.location}`
        results.set(key, batchResults[index])
      })
      
      // Rate limiting delay
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    return results
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Enrich a full guide with external data
   */
  async enrichGuide(guide: {
    accommodations: AccommodationRecommendation[]
    activities: ActivityRecommendation[]
    dining: DiningRecommendation[]
  }): Promise<void> {
    // Prepare enrichment requests
    const requests: EnrichmentRequest[] = []
    
    guide.accommodations.forEach(acc => {
      requests.push({
        type: 'accommodation',
        name: acc.name,
        location: acc.neighborhood
      })
    })
    
    guide.activities.forEach(act => {
      requests.push({
        type: 'activity',
        name: act.name,
        location: act.location
      })
    })
    
    guide.dining.forEach(din => {
      requests.push({
        type: 'dining',
        name: din.name,
        location: din.neighborhood
      })
    })
    
    // Batch enrich
    const enrichmentResults = await this.enrichBatch(requests)
    
    // Apply enrichment results
    guide.accommodations.forEach(acc => {
      const key = `accommodation:${acc.name}:${acc.neighborhood}`
      const enrichment = enrichmentResults.get(key)
      if (enrichment) {
        if (enrichment.images) acc.images = enrichment.images
        if (enrichment.bookingLinks) acc.bookingLinks = enrichment.bookingLinks
        if (enrichment.rating) acc.rating = enrichment.rating
      }
    })
    
    guide.activities.forEach(act => {
      const key = `activity:${act.name}:${act.location}`
      const enrichment = enrichmentResults.get(key)
      if (enrichment) {
        if (enrichment.images) act.images = enrichment.images
        if (enrichment.bookingLinks && enrichment.bookingLinks[0]) {
          act.bookingLink = enrichment.bookingLinks[0].url
        }
        if (enrichment.rating) act.rating = enrichment.rating
      }
    })
    
    guide.dining.forEach(din => {
      const key = `dining:${din.name}:${din.neighborhood}`
      const enrichment = enrichmentResults.get(key)
      if (enrichment) {
        if (enrichment.images) din.images = enrichment.images
        if (enrichment.bookingLinks && enrichment.bookingLinks[0]) {
          din.reservationLink = enrichment.bookingLinks[0].url
        }
        if (enrichment.rating) din.rating = enrichment.rating
        if (enrichment.menuHighlights) din.mustTryDishes = enrichment.menuHighlights
      }
    })
  }
}