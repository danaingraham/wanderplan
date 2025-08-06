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
  originalInput?: string
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
    
    console.log('🔢 OpenAI: Generating itinerary for', days, 'days')
    console.log('📍 Destination:', request.destination)
    console.log('👥 Group:', request.groupSize, request.hasKids ? 'with kids' : 'no kids')
    console.log('⚡ Pace:', request.pace)

    const systemPrompt = `You are an expert travel planner creating detailed day-by-day itineraries. ${request.originalInput ? 'Your PRIORITY is to structure and organize the user\'s provided travel ideas while preserving their intent and timeline as much as possible.' : 'Your goal is to create memorable, well-timed experiences that match the traveler\'s preferences exactly.'}

TRIP DETAILS:
- Destination: ${request.destination}
- Duration: ${days} days (${request.startDate} to ${request.endDate})
- Trip Type: ${request.tripType}
- Group: ${request.groupSize} ${request.groupSize === 1 ? 'person' : 'people'}${request.hasKids ? ' with children' : ''}
- Travel Pace: ${request.pace}
- Interests: ${request.preferences.join(', ')}
${request.originalInput ? `
USER'S PROVIDED ITINERARY/IDEAS:
${request.originalInput}

CRITICAL: The user has provided their own itinerary content above. Your PRIMARY job is to:
1. PRESERVE their exact places, timing, and day structure as much as possible
2. EXTRACT and STRUCTURE their content into the JSON format
3. ENHANCE with proper addresses, categories, and timing details
4. FILL GAPS ONLY if necessary (missing meals, travel time, etc.)
5. DO NOT replace their planned activities with completely different suggestions
6. If they mentioned specific times (e.g., "9am Central Park"), KEEP those times
7. If they mentioned specific days (e.g., "Day 1: Museum"), KEEP those day assignments
8. Only add complementary activities if there are obvious gaps in their schedule

STRUCTURE PRESERVATION RULES:
- If they listed "Day 1: A, B, C" - put A, B, C on Day 1
- If they said "Morning: X, Afternoon: Y" - schedule X in morning, Y in afternoon  
- If they gave specific times - use those exact times
- If they mentioned restaurants - keep those restaurants, don't substitute others
- If they mentioned attractions - keep those attractions, don't substitute others
- Only suggest alternatives if their original item is unclear or doesn't exist
` : ''}

CRITICAL GEOGRAPHIC REQUIREMENTS:
- ALL places MUST be located in or within 30 minutes driving distance of ${request.destination}
- Do NOT include places from other cities or distant locations
- Verify that all restaurants, attractions, and activities are actually in the ${request.destination} area
- If ${request.destination} is a small town, focus on places within that specific town or immediate vicinity

${request.originalInput ? 'ITINERARY STRUCTURING (for provided content):' : 'ITINERARY REQUIREMENTS:'}
${request.originalInput ? `- FIRST analyze the user's provided content and extract their planned activities
- PRESERVE their intended day structure and timing
- Format their content into proper JSON structure with addresses and categories
- ADD ONLY necessary details like proper addresses, duration estimates, and categories
- Fill minimal gaps (e.g., if they planned dinner but no lunch, add a lunch option)
- Maintain ${days} days total but RESPECT their original day assignments` : `- Create ${days} complete days of activities
- Each day should have 4-6 places depending on pace:
  * Relaxed: 4 places (more time at each)
  * Moderate: 5 places (balanced schedule)  
  * Packed: 6 places (busy itinerary)`}
- Include a good mix: attractions, restaurants, cafes, activities
- Start days around 9:00-10:00 AM
- End with dinner around 7:00-8:00 PM
- Account for travel time between locations (max 15-20 minutes between stops)
- ${request.hasKids ? 'Include family-friendly activities, kid-friendly restaurants, and consider nap/rest time' : ''}
- Focus on ${request.preferences.join(' and ')} experiences
- Use REAL, specific place names and addresses when possible

OUTPUT FORMAT - Return ONLY valid JSON array:
[
  {
    "day": 1,
    "places": [
      {
        "name": "Specific Place Name",
        "address": "Full street address or neighborhood",
        "category": "restaurant|attraction|hotel",
        "description": "What you'll do here (2-3 sentences)",
        "estimatedDuration": 120,
        "suggestedTime": "10:00",
        "whyRecommended": "Why this fits their ${request.preferences.join('/')} interests"
      }
    ]
  }
]

EXAMPLE OUTPUT for Carmel-by-the-Sea trip (notice ALL places are in Carmel area):
[
  {
    "day": 1,
    "places": [
      {
        "name": "Carmel Beach",
        "address": "Carmel Beach, Carmel-by-the-Sea, CA 93921",
        "category": "attraction",
        "description": "Start your day at this stunning white sand beach with cypress trees.",
        "estimatedDuration": 120,
        "suggestedTime": "09:00",
        "whyRecommended": "Iconic Carmel scenery and relaxation"
      },
      {
        "name": "La Bicyclette Restaurant",
        "address": "Dolores St & 7th Ave, Carmel-by-the-Sea, CA 93921",
        "category": "restaurant",
        "description": "French bistro in the heart of Carmel's fairy-tale village.",
        "estimatedDuration": 90,
        "suggestedTime": "12:00",
        "whyRecommended": "Authentic local dining experience"
      },
      {
        "name": "Carmel Mission Basilica",
        "address": "3080 Rio Rd, Carmel-by-the-Sea, CA 93923",
        "category": "attraction",
        "description": "Historic Spanish colonial mission with beautiful gardens.",
        "estimatedDuration": 90,
        "suggestedTime": "14:00",
        "whyRecommended": "Cultural and historical significance"
      }
    ]
  }
]

CRITICAL: Return ONLY valid JSON array exactly like the example above. No markdown, no extra text. Each day MUST have ${request.pace === 'relaxed' ? '4' : request.pace === 'moderate' ? '5' : '6'} places.

FINAL REMINDER: ALL places must be in ${request.destination} or immediate vicinity. Do NOT include places from other cities like Mendocino, San Francisco, etc. if the destination is Carmel-by-the-Sea.`

    try {
      const userMessage = request.originalInput 
        ? `Please structure and organize my provided travel ideas into a proper ${days}-day itinerary for ${request.destination}. Preserve my original structure, timing, and places as much as possible.`
        : `Generate an itinerary for my ${days}-day trip to ${request.destination}.`

      const response = await this.client.chat.completions.create({
        model: API_CONFIG.openai.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        max_tokens: Math.max(API_CONFIG.openai.maxTokens, 3000), // Ensure enough tokens for detailed itineraries
        temperature: 0.8, // Slightly more creative for varied suggestions
      })

      const content = response.choices[0]?.message?.content
      console.log('🤖 OpenAI raw response:', content?.substring(0, 200) + '...')
      
      if (!content) {
        throw new Error('No response from OpenAI')
      }

      try {
        // Clean the response to extract JSON if wrapped in markdown or extra text
        let cleanContent = content.trim()
        
        // Remove markdown code blocks if present
        if (cleanContent.startsWith('```')) {
          cleanContent = cleanContent.replace(/```json\n?/, '').replace(/```\n?$/, '')
        }
        
        // Extract JSON array from the response
        const jsonMatch = cleanContent.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          cleanContent = jsonMatch[0]
        }
        
        const itinerary = JSON.parse(cleanContent) as ItinerarySuggestion[]
        
        // Validate the response structure
        if (!Array.isArray(itinerary) || itinerary.length === 0) {
          throw new Error('AI returned empty or invalid itinerary')
        }
        
        // Validate each day has places
        for (const day of itinerary) {
          if (!day.places || !Array.isArray(day.places) || day.places.length === 0) {
            throw new Error(`Day ${day.day} has no places`)
          }
        }
        
        console.log(`✅ Generated ${itinerary.length} days with ${itinerary.reduce((total, day) => total + day.places.length, 0)} total places`)
        return itinerary
        
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', content)
        console.error('Parse error:', parseError)
        throw new Error('AI returned invalid response format. Please try again.')
      }
    } catch (error) {
      console.error('OpenAI API error:', error)
      throw new Error('Failed to generate itinerary suggestions')
    }
  }

  async getTripAdviceWithActions(trip: Trip, places: Place[], question: string): Promise<{
    response: string
    actions?: Array<{
      type: 'add' | 'update' | 'remove' | 'reorder'
      description: string
      data: any
    }>
  }> {
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
  `Day ${place.day}: ${place.start_time} - ${place.name} (${place.category}) - ${place.address} [Duration: ${place.duration}min] [ID: ${place.id}]`
).join('\n')}
`

    const systemPrompt = `You are an intelligent travel assistant with full control over itinerary modifications. You are AUTONOMOUS and make smart decisions without asking for user confirmation. The user trusts you to execute their requests intelligently.

CORE CAPABILITIES:
- ADD new places/activities with optimal timing
- UPDATE existing places (times, duration, notes, day assignments)
- REMOVE places efficiently (bulk operations supported)
- REORGANIZE entire itineraries intelligently
- CONSOLIDATE days when requested
- OPTIMIZE schedules for efficiency and logistics

INTELLIGENT BEHAVIOR REQUIRED:
1. When user says "remove all from Day X" → AUTOMATICALLY remove all places from that day
2. When user says "reorganize because I can't do Day 1 and 4" → AUTOMATICALLY redistribute all activities from those days into remaining days
3. When optimizing → Consider travel time, meal timing, attraction hours, logical flow
4. When consolidating → Pack activities efficiently while maintaining good pace
5. NEVER ask "which ones do you want to remove" - be decisive and smart

DECISION MAKING:
- If removing entire days, automatically redistribute the best activities to other days
- If consolidating 4 days into 2, prioritize must-see attractions and combine logical groupings
- Maintain meal timing (lunch 12-2pm, dinner 7-9pm)
- Group geographically close places together
- Consider activity duration and energy levels

When you want to suggest itinerary changes, return a JSON response with this structure:

FOR ADDING NEW PLACES:
{
  "response": "I'll add Joe's Pizza to your Day 1 dinner!",
  "actions": [
    {
      "type": "add", 
      "description": "Add dinner at Joe's Pizza",
      "data": {
        "name": "Joe's Pizza",
        "address": "7 Carmine St, New York, NY 10014", 
        "category": "restaurant",
        "day": 1,
        "start_time": "19:00",
        "duration": 60,
        "notes": "Famous NYC pizza spot",
        "trip_id": "${trip.id}"
      }
    }
  ]
}

FOR REORGANIZING/REORDERING PLACES:
{
  "response": "I've reorganized your itinerary for better flow!",
  "actions": [
    {
      "type": "reorder",
      "description": "Reorganize Day 1 for better timing",
      "data": {
        "places": [
          {"id": "existing-place-id-1", "day": 1, "order": 0, "start_time": "09:00"},
          {"id": "existing-place-id-2", "day": 1, "order": 1, "start_time": "11:30"},
          {"id": "existing-place-id-3", "day": 2, "order": 0, "start_time": "10:00"}
        ]
      }
    }
  ]
}

FOR REMOVING ALL PLACES FROM A DAY:
{
  "response": "Done! I've removed all activities from Day 1 as requested.",
  "actions": [
    {
      "type": "remove",
      "description": "Remove Central Park", 
      "data": {"id": "place-id-1"}
    },
    {
      "type": "remove",
      "description": "Remove Museum Visit",
      "data": {"id": "place-id-2"}
    },
    {
      "type": "remove",
      "description": "Remove Lunch Restaurant",
      "data": {"id": "place-id-3"}
    }
  ]
}

FOR INTELLIGENT CONSOLIDATION (e.g., "can't do Day 1 and 4, make it 2 days"):
{
  "response": "I've intelligently consolidated your 4-day itinerary into 2 efficient days, redistributing the best activities from Days 1 and 4 into Days 2 and 3!",
  "actions": [
    {
      "type": "remove",
      "description": "Remove Day 1 activities",
      "data": {"id": "day1-place1-id"}
    },
    {
      "type": "remove", 
      "description": "Remove Day 1 activities",
      "data": {"id": "day1-place2-id"}
    },
    {
      "type": "remove",
      "description": "Remove Day 4 activities", 
      "data": {"id": "day4-place1-id"}
    },
    {
      "type": "update",
      "description": "Move Central Park to Day 2 morning",
      "data": {"id": "day1-place1-id", "updates": {"day": 2, "order": 0, "start_time": "09:00"}}
    },
    {
      "type": "update",
      "description": "Move Bronx Zoo to Day 3",
      "data": {"id": "day4-place1-id", "updates": {"day": 3, "order": 2, "start_time": "14:00"}}
    },
    {
      "type": "reorder",
      "description": "Optimize Day 2 and 3 timing",
      "data": {
        "places": [
          {"id": "day2-existing", "day": 2, "order": 1, "start_time": "11:30"},
          {"id": "day3-existing", "day": 3, "order": 0, "start_time": "09:30"}
        ]
      }
    }
  ]
}

CRITICAL INSTRUCTIONS:
1. ALWAYS use actual place IDs from the current itinerary context
2. Be AUTONOMOUS - don't ask for permission, just execute smart decisions
3. When consolidating days, prioritize must-see attractions and optimal logistics
4. When removing "all from Day X", remove every single place from that day
5. When reorganizing, consider geographic proximity and logical flow
6. NEVER respond with "which ones would you like me to..." - make intelligent choices

For informational questions without itinerary changes, just return:
{
  "response": "Your helpful response"
}

Remember: You are a SMART AUTONOMOUS assistant. The user trusts you to make excellent decisions about their itinerary without asking for micro-confirmations.`

    try {
      const response = await this.client.chat.completions.create({
        model: API_CONFIG.openai.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `${tripContext}\n\nQuestion: ${question}` }
        ],
        max_tokens: 1500,
        temperature: 0.7,
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response from OpenAI')
      }

      try {
        const parsed = JSON.parse(content)
        return {
          response: parsed.response,
          actions: parsed.actions || []
        }
      } catch (parseError) {
        // If not JSON, return as plain text response
        return {
          response: content,
          actions: []
        }
      }
    } catch (error) {
      console.error('OpenAI API error:', error)
      throw new Error('Failed to get travel advice')
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