import type {
  TripGuide,
  AccommodationRecommendation,
  ActivityRecommendation,
  DiningRecommendation,
  TransportationTip,
  TripType,
  PriceRange,
  MealType,
  ActivityCategory
} from '../types/guide'

interface ExtractedGuideData {
  destination: {
    city: string
    country: string
    region?: string
  }
  tripType?: TripType
  duration?: number
  budget?: PriceRange
  accommodations: Array<{
    name: string
    type?: string
    neighborhood?: string
    description?: string
    priceRange?: string
    notes?: string
  }>
  activities: Array<{
    name: string
    category?: string
    location?: string
    description?: string
    duration?: string
    cost?: string
    tips?: string[]
  }>
  restaurants: Array<{
    name: string
    cuisine?: string
    neighborhood?: string
    mealTypes?: string[]
    mustTry?: string[]
    notes?: string
  }>
  highlights?: string[]
  packingTips?: string[]
  localTips?: string[]
  transportation?: string[]
}

export class GuideExtractorService {
  private apiKey: string

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || ''
  }

  /**
   * Extract structured guide data from raw text using OpenAI
   */
  async extractGuideFromText(
    rawText: string, 
    onProgress?: (message: string) => void
  ): Promise<ExtractedGuideData> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file')
    }

    // Limit text length to avoid token limits
    const maxLength = 8000
    const truncatedText = rawText.length > maxLength 
      ? rawText.substring(0, maxLength) + '...[truncated]'
      : rawText

    onProgress?.('Preparing text for analysis...')

    const systemPrompt = `You are an expert travel guide data extractor. Your task is to extract structured travel information from unstructured text and return it in JSON format.

Extract the following information:
- Destination (city, country, region if mentioned)
- Trip type (solo, romantic, family, group, business, adventure, relaxation, cultural)
- Duration (number of days)
- Budget level ($, $$, $$$, or $$$$)
- Hotels/Accommodations (name, type, neighborhood, description, price range, any notes)
- Activities/Attractions (name, category, location, description, duration, cost, tips)
- Restaurants (name, cuisine type, neighborhood, meal types, must-try dishes, notes)
- Trip highlights
- Packing tips
- Local tips
- Transportation advice

Return a JSON object with this exact structure:
{
  "destination": {
    "city": "string",
    "country": "string",
    "region": "optional string"
  },
  "tripType": "solo|romantic|family|group|business|adventure|relaxation|cultural",
  "duration": number,
  "budget": "$|$$|$$$|$$$$",
  "accommodations": [
    {
      "name": "string",
      "type": "hotel|airbnb|hostel|resort|other",
      "neighborhood": "string",
      "description": "string",
      "priceRange": "$|$$|$$$|$$$$",
      "notes": "string"
    }
  ],
  "activities": [
    {
      "name": "string",
      "category": "sightseeing|adventure|cultural|shopping|nightlife|relaxation|dining|nature",
      "location": "string",
      "description": "string",
      "duration": "string",
      "cost": "string",
      "tips": ["string"]
    }
  ],
  "restaurants": [
    {
      "name": "string",
      "cuisine": "string",
      "neighborhood": "string",
      "mealTypes": ["breakfast", "lunch", "dinner", "brunch", "snack", "dessert"],
      "mustTry": ["string"],
      "notes": "string"
    }
  ],
  "highlights": ["string"],
  "packingTips": ["string"],
  "localTips": ["string"],
  "transportation": ["string"]
}`

    try {
      onProgress?.('Connecting to AI service...')
      
      // Create an AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: `Extract travel guide information from the following text:\n\n${truncatedText}`
            }
          ],
          temperature: 0.3,
          max_tokens: 2000, // Reduced to speed up response
          response_format: { type: "json_object" }
        })
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        console.error('OpenAI API error:', errorData)
        
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your OpenAI API key.')
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a moment.')
        } else if (response.status === 500 || response.status === 503) {
          throw new Error('OpenAI service is temporarily unavailable. Please try again.')
        } else {
          throw new Error(`Failed to process text: ${errorData?.error?.message || response.statusText}`)
        }
      }

      onProgress?.('Analyzing travel information...')
      
      const data = await response.json()
      
      if (!data.choices || !data.choices[0]?.message?.content) {
        throw new Error('Invalid response from AI service')
      }

      onProgress?.('Organizing extracted data...')
      
      const extractedData = JSON.parse(data.choices[0].message.content)
      
      return this.validateAndCleanData(extractedData)
    } catch (error: any) {
      console.error('Error extracting guide from text:', error)
      
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try with shorter text or try again.')
      }
      
      // Re-throw with more user-friendly message
      if (error.message.includes('API key')) {
        throw error
      } else if (error.message.includes('JSON')) {
        throw new Error('Failed to parse extracted data. Please try again with clearer trip information.')
      } else {
        throw new Error(error.message || 'Failed to extract guide information. Please try again.')
      }
    }
  }

  /**
   * Validate and clean the extracted data
   */
  private validateAndCleanData(data: any): ExtractedGuideData {
    // Ensure required fields exist
    const cleaned: ExtractedGuideData = {
      destination: {
        city: data.destination?.city || 'Unknown City',
        country: data.destination?.country || 'Unknown Country',
        region: data.destination?.region
      },
      accommodations: [],
      activities: [],
      restaurants: []
    }

    // Clean optional fields
    if (data.tripType && this.isValidTripType(data.tripType)) {
      cleaned.tripType = data.tripType
    }

    if (data.duration && typeof data.duration === 'number') {
      cleaned.duration = data.duration
    }

    if (data.budget && this.isValidPriceRange(data.budget)) {
      cleaned.budget = data.budget
    }

    // Clean accommodations
    if (Array.isArray(data.accommodations)) {
      cleaned.accommodations = data.accommodations.map((acc: any) => ({
        name: acc.name || 'Unnamed Accommodation',
        type: acc.type || 'hotel',
        neighborhood: acc.neighborhood,
        description: acc.description,
        priceRange: this.isValidPriceRange(acc.priceRange) ? acc.priceRange : undefined,
        notes: acc.notes
      }))
    }

    // Clean activities
    if (Array.isArray(data.activities)) {
      cleaned.activities = data.activities.map((act: any) => ({
        name: act.name || 'Unnamed Activity',
        category: this.isValidActivityCategory(act.category) ? act.category : 'sightseeing',
        location: act.location,
        description: act.description,
        duration: act.duration,
        cost: act.cost,
        tips: Array.isArray(act.tips) ? act.tips : []
      }))
    }

    // Clean restaurants
    if (Array.isArray(data.restaurants)) {
      cleaned.restaurants = data.restaurants.map((rest: any) => ({
        name: rest.name || 'Unnamed Restaurant',
        cuisine: rest.cuisine,
        neighborhood: rest.neighborhood,
        mealTypes: Array.isArray(rest.mealTypes) ? rest.mealTypes.filter((m: string) => this.isValidMealType(m)) : [],
        mustTry: Array.isArray(rest.mustTry) ? rest.mustTry : [],
        notes: rest.notes
      }))
    }

    // Clean arrays
    cleaned.highlights = Array.isArray(data.highlights) ? data.highlights : []
    cleaned.packingTips = Array.isArray(data.packingTips) ? data.packingTips : []
    cleaned.localTips = Array.isArray(data.localTips) ? data.localTips : []
    cleaned.transportation = Array.isArray(data.transportation) ? data.transportation : []

    return cleaned
  }

  private isValidTripType(type: string): type is TripType {
    return ['solo', 'romantic', 'family', 'group', 'business', 'adventure', 'relaxation', 'cultural'].includes(type)
  }

  private isValidPriceRange(range: string): range is PriceRange {
    return ['$', '$$', '$$$', '$$$$'].includes(range)
  }

  private isValidActivityCategory(category: string): category is ActivityCategory {
    return ['sightseeing', 'adventure', 'cultural', 'shopping', 'nightlife', 'relaxation', 'dining', 'nature'].includes(category)
  }

  private isValidMealType(type: string): type is MealType {
    return ['breakfast', 'lunch', 'dinner', 'brunch', 'snack', 'dessert'].includes(type)
  }

  /**
   * Convert extracted data to a full TripGuide object
   */
  convertToTripGuide(extractedData: ExtractedGuideData, userId: string, userName: string, userPhoto?: string): Partial<TripGuide> {
    const now = new Date()
    
    return {
      metadata: {
        author: {
          id: userId,
          name: userName,
          profilePicture: userPhoto
        },
        destination: extractedData.destination,
        tripType: extractedData.tripType || 'solo',
        travelDate: {
          month: now.getMonth() + 1,
          year: now.getFullYear()
        },
        createdAt: now,
        updatedAt: now,
        isPublished: false,
        tripDuration: extractedData.duration,
        budget: extractedData.budget
      },
      accommodations: extractedData.accommodations.map(acc => ({
        id: crypto.randomUUID(),
        name: acc.name,
        type: (acc.type as any) || 'hotel',
        neighborhood: acc.neighborhood || '',
        description: acc.description || '',
        priceRange: (acc.priceRange as PriceRange) || '$$',
        images: [],
        bookingLinks: [],
        authorNotes: acc.notes
      })),
      activities: extractedData.activities.map(act => ({
        id: crypto.randomUUID(),
        name: act.name,
        category: (act.category as ActivityCategory) || 'sightseeing',
        description: act.description || '',
        location: act.location || '',
        duration: act.duration || '',
        cost: act.cost,
        images: [],
        tips: act.tips,
        bookingRequired: false
      })),
      dining: extractedData.restaurants.map(rest => ({
        id: crypto.randomUUID(),
        name: rest.name,
        cuisine: rest.cuisine || 'International',
        mealTypes: (rest.mealTypes as MealType[]) || ['lunch', 'dinner'],
        neighborhood: rest.neighborhood || '',
        priceRange: '$$' as PriceRange,
        description: '',
        mustTryDishes: rest.mustTry,
        images: [],
        reservationRequired: false,
        authorNotes: rest.notes
      })),
      highlights: extractedData.highlights,
      packingTips: extractedData.packingTips,
      localTips: extractedData.localTips,
      transportation: extractedData.transportation?.map(tip => ({
        id: crypto.randomUUID(),
        type: 'public' as const,
        description: tip,
        tips: []
      }))
    }
  }
}