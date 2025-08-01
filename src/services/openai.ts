import OpenAI from 'openai'
import { API_CONFIG, isOpenAIConfigured } from '../config/api'
import type { Trip, Place } from '../types'

export interface ItineraryRequest {
  destination: string
  startDate: string
  endDate: string
  tripType: string
  groupSize: number
  hasKids: boolean
  pace: string
  preferences: string[]
  existingPlaces?: Place[]
}

export interface ItinerarySuggestion {
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
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

class OpenAIService {
  private client: OpenAI | null = null

  constructor() {
    if (isOpenAIConfigured()) {
      this.client = new OpenAI({
        apiKey: API_CONFIG.openai.apiKey,
        dangerouslyAllowBrowser: true, // For client-side use
      })
    }
  }

  async generateItinerary(request: ItineraryRequest): Promise<ItinerarySuggestion[]> {
    if (!isOpenAIConfigured() || !this.client) {
      throw new Error('OpenAI API key not configured')
    }

    const days = Math.ceil(
      (new Date(request.endDate).getTime() - new Date(request.startDate).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1

    const systemPrompt = `You are a travel planning expert. Generate a detailed day-by-day itinerary for a trip with the following requirements:

Destination: ${request.destination}
Duration: ${days} days (${request.startDate} to ${request.endDate})
Trip Type: ${request.tripType}
Group Size: ${request.groupSize} ${request.groupSize === 1 ? 'person' : 'people'}
${request.hasKids ? 'Traveling with children' : 'No children'}
Pace: ${request.pace}
Interests: ${request.preferences.join(', ')}

${request.existingPlaces?.length ? `Existing places in itinerary: ${request.existingPlaces.map(p => p.name).join(', ')}` : ''}

Return a JSON array with the following structure for each day:
{
  "day": number,
  "places": [
    {
      "name": "Place Name",
      "address": "Full address if known, or general area",
      "category": "restaurant|attraction|hotel",
      "description": "Brief description of the place and what to do there",
      "estimatedDuration": number_in_minutes,
      "suggestedTime": "HH:MM format",
      "whyRecommended": "Why this fits the traveler's preferences"
    }
  ]
}

Guidelines:
- Include 3-5 places per day depending on pace (relaxed: 3, moderate: 4, packed: 5)
- Balance different types of places (attractions, restaurants, etc.)
- Consider travel time between locations
- Suggest realistic timing
- Include kid-friendly options if traveling with children
- Match the trip type and preferences
- Provide specific, real places when possible
- Include a mix of popular and local gems`

    try {
      const response = await this.client.chat.completions.create({
        model: API_CONFIG.openai.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate an itinerary for my ${days}-day trip to ${request.destination}.` }
        ],
        max_tokens: API_CONFIG.openai.maxTokens,
        temperature: 0.7,
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response from OpenAI')
      }

      try {
        const itinerary = JSON.parse(content) as ItinerarySuggestion[]
        return itinerary
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', content)
        throw new Error('Invalid response format from AI')
      }
    } catch (error) {
      console.error('OpenAI API error:', error)
      throw new Error('Failed to generate itinerary suggestions')
    }
  }

  async getTripAdvice(trip: Trip, places: Place[], question: string): Promise<string> {
    if (!isOpenAIConfigured() || !this.client) {
      throw new Error('OpenAI API key not configured')
    }

    const tripContext = `
Trip: ${trip.title}
Destination: ${trip.destination}
Dates: ${trip.start_date} to ${trip.end_date}
Type: ${trip.trip_type}
Group: ${trip.group_size} ${trip.group_size === 1 ? 'person' : 'people'}${trip.has_kids ? ' (with kids)' : ''}
Pace: ${trip.pace}
Interests: ${trip.preferences.join(', ')}

Current itinerary:
${places.map(place => 
  `Day ${place.day}: ${place.name} (${place.category}) - ${place.address}`
).join('\n')}
`

    const systemPrompt = `You are a helpful travel assistant. The user is asking about their trip to ${trip.destination}. 
    
    Provide helpful, specific advice based on their itinerary and trip details. Be concise but detailed enough to be useful. 
    Consider their group size, travel style, and preferences when giving advice.
    
    If they ask about places to visit, restaurants, activities, or logistics, provide specific recommendations that fit their trip.`

    try {
      const response = await this.client.chat.completions.create({
        model: API_CONFIG.openai.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `${tripContext}\n\nQuestion: ${question}` }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response from OpenAI')
      }

      return content
    } catch (error) {
      console.error('OpenAI API error:', error)
      throw new Error('Failed to get travel advice')
    }
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    if (!isOpenAIConfigured() || !this.client) {
      throw new Error('OpenAI API key not configured')
    }

    try {
      const response = await this.client.chat.completions.create({
        model: API_CONFIG.openai.model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        max_tokens: 1000,
        temperature: 0.7,
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response from OpenAI')
      }

      return content
    } catch (error) {
      console.error('OpenAI API error:', error)
      throw new Error('Failed to get AI response')
    }
  }
}

export const openaiService = new OpenAIService()