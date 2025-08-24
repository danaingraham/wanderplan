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
  // User preferences from saved profile
  dietaryRestrictions?: string[]
  budgetContext?: { min: number; max: number }
  budget?: number
  budgetType?: 'shoestring' | 'mid_range' | 'luxury' | 'ultra_luxury'
  accessibilityNeeds?: string
  cuisinePreferences?: string[]
  accommodationPreferences?: string[]
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
    
    // Log user preferences if present
    if (request.dietaryRestrictions?.length || request.budgetContext || request.accessibilityNeeds || request.cuisinePreferences?.length || request.accommodationPreferences?.length) {
      console.log('✨ Applying user preferences:')
      if (request.dietaryRestrictions?.length) console.log('  - Dietary:', request.dietaryRestrictions.join(', '))
      if (request.budgetContext) console.log('  - Budget: $' + request.budgetContext.min + '-$' + request.budgetContext.max)
      if (request.accessibilityNeeds) console.log('  - Accessibility:', request.accessibilityNeeds)
      if (request.cuisinePreferences?.length) console.log('  - Cuisines:', request.cuisinePreferences.join(', '))
      if (request.accommodationPreferences?.length) console.log('  - Accommodation:', request.accommodationPreferences.join(', '))
    }

    const systemPrompt = `You are an expert travel planner creating detailed day-by-day itineraries. ${request.originalInput ? 'Your PRIORITY is to structure and organize the user\'s provided travel ideas while preserving their intent and timeline as much as possible.' : 'Your goal is to create memorable, well-timed experiences that match the traveler\'s preferences exactly.'}

TRIP DETAILS:
- Destination: ${request.destination}
- Duration: ${days} days (${request.startDate} to ${request.endDate})
- Trip Type: ${request.tripType}
- Group: ${request.groupSize} ${request.groupSize === 1 ? 'person' : 'people'}${request.hasKids ? ' WITH CHILDREN' : ''}
- Travel Pace: ${request.pace}
- **PRIMARY INTERESTS**: ${request.preferences?.join(', ') || 'General sightseeing'} ${request.preferences?.length > 0 ? '(CRITICAL: The itinerary MUST heavily focus on these interests!)' : ''}
${days > 1 ? '- **ACCOMMODATION NEEDED**: This is a multi-day trip requiring accommodation recommendations' : ''}

${request.dietaryRestrictions && request.dietaryRestrictions.length > 0 ? `
USER DIETARY RESTRICTIONS (MANDATORY):
- The user has the following dietary restrictions: ${request.dietaryRestrictions.join(', ')}
- ALL restaurant recommendations MUST accommodate these restrictions
- When suggesting restaurants, explicitly mention they have ${request.dietaryRestrictions.join('/')} options
- Prioritize restaurants known for excellent ${request.dietaryRestrictions.join('/')} selections
` : ''}

${request.budgetContext || request.budgetType ? `
BUDGET REQUIREMENTS (MANDATORY):
${request.budgetType ? `- Budget Category: ${
  request.budgetType === 'shoestring' ? 'SHOESTRING/BACKPACKER - Ultra budget-conscious travel' :
  request.budgetType === 'mid_range' ? 'MID-RANGE/COMFORT - Good value and comfort balance' :
  request.budgetType === 'luxury' ? 'LUXURY - Premium experiences and accommodations' :
  request.budgetType === 'ultra_luxury' ? 'ULTRA-LUXURY - No expense spared, exclusive experiences' :
  'MID-RANGE'
}` : ''}
${request.budget ? `- Daily budget: $${request.budget} per person per day` : 
  request.budgetContext ? `- Daily budget: $${request.budgetContext.max} per person per day` : ''}

${request.budgetType === 'shoestring' ? `
  - Accommodation: Hostels, budget hotels ($20-60/night)
  - Meals: Street food, local eateries ($5-15/meal)
  - Activities: Free attractions, walking tours, public transport
  - Focus on authentic local experiences over touristy options
` : request.budgetType === 'mid_range' ? `
  - Accommodation: 3-star hotels, nice Airbnbs ($${request.budget ? Math.round(request.budget * 0.4) : 80}-$${request.budget ? Math.round(request.budget * 0.6) : 150}/night)
  - Meals: Good local restaurants ($15-35/meal)
  - Activities: Mix of paid attractions and free experiences
  - Comfortable but not extravagant choices
` : request.budgetType === 'luxury' ? `
  - Accommodation: ONLY luxury 5-star hotels and high-end boutique properties ($${request.budget ? Math.round(request.budget * 0.5) : 250}-$${request.budget ? Math.round(request.budget * 0.7) : 500}/night)
  - REQUIRED: Four Seasons, St. Regis, Ritz-Carlton, Mandarin Oriental, Park Hyatt, Waldorf Astoria, Rosewood, Aman, or equivalent luxury brands
  - NO mid-tier chains like Marriott, Hilton, Hyatt (except Park/Andaz), Sheraton, Westin
  - Meals: Fine dining, Michelin-recommended, James Beard nominees, celebrity chef restaurants ($50-150/meal)
  - Activities: Premium private tours, exclusive experiences, VIP access
  - Focus on exceptional service and unique luxury experiences
` : request.budgetType === 'ultra_luxury' ? `
  - Accommodation: Ultra-luxury 5-star hotels and resorts ONLY ($${request.budget ? Math.round(request.budget * 0.6) : 800}+/night)
  - REQUIRED: Four Seasons, St. Regis, Aman, Rosewood, Mandarin Oriental, One&Only, Raffles, or equivalent ultra-luxury brands
  - Presidential suites, private villas, or penthouse accommodations when available
  - Meals: ONLY Michelin-starred restaurants, world-renowned chefs, exclusive dining experiences ($150-500+/meal)
  - Activities: Private jets, helicopter tours, yacht charters, exclusive access, personal guides
  - Everything must be absolutely top-tier with impeccable service
` : `
  - Accommodation: $${request.budget ? Math.round(request.budget * 0.4) : 100}-$${request.budget ? Math.round(request.budget * 0.6) : 200}/night
  - Meals: $${request.budget ? Math.round(request.budget * 0.15) : 20}-$${request.budget ? Math.round(request.budget * 0.25) : 40}/meal
  - Focus on good value options
`}
` : ''}

${request.accessibilityNeeds ? `
ACCESSIBILITY REQUIREMENTS (CRITICAL):
- User requires: ${request.accessibilityNeeds}
- ALL venues MUST be accessible for: ${request.accessibilityNeeds}
- Verify wheelchair access, elevators, and accessible facilities
- Avoid locations with stairs-only access or difficult terrain
` : ''}

${request.cuisinePreferences && request.cuisinePreferences.length > 0 ? `
CUISINE PREFERENCES:
- User particularly enjoys: ${request.cuisinePreferences.join(', ')}
- Prioritize restaurants featuring these cuisines
- Mix in local specialties that align with these preferences
` : ''}

${request.accommodationPreferences && request.accommodationPreferences.length > 0 ? `
ACCOMMODATION REQUIREMENTS:
- User prefers: ${request.accommodationPreferences.join(', ')}
${request.budgetType === 'luxury' ? `
- LUXURY HOTELS ONLY: Four Seasons, St. Regis, Ritz-Carlton, Park Hyatt, Mandarin Oriental, Waldorf Astoria, Rosewood
- NO standard Marriott, Hilton, regular Hyatt, Sheraton, or other mid-tier brands
- If suggesting Airbnb, ONLY luxury properties with exceptional amenities
` : request.budgetType === 'ultra_luxury' ? `
- ULTRA-LUXURY ONLY: Four Seasons, St. Regis, Aman, Rosewood, One&Only, Mandarin Oriental presidential suites
- Private villas, penthouses, or exclusive resort properties
- Must be the absolute best accommodation available in the destination
` : ''}
- ONLY recommend: ${request.accommodationPreferences.includes('hotel') ? 'hotels' : request.accommodationPreferences.includes('airbnb') ? 'vacation rentals/Airbnbs' : request.accommodationPreferences.includes('hostel') ? 'hostels' : request.accommodationPreferences.includes('resort') ? 'resorts' : 'accommodations'}
${request.budget || request.budgetContext ? `- Price range: $${
  request.budget ? Math.round(request.budget * 0.4) : 
  request.budgetContext ? Math.round(request.budgetContext.max * 0.4) : 150
}-$${
  request.budget ? Math.round(request.budget * 0.7) : 
  request.budgetContext ? Math.round(request.budgetContext.max * 0.7) : 300
} per night
- Include estimated price per night in the description` : ''}
- Match the accommodation type to user's preferences exactly
` : ''}

GROUP CONSIDERATIONS:
${request.groupSize === 1 ? '- SOLO TRAVELER: Include social opportunities, safe neighborhoods, solo-friendly venues' : ''}
${request.groupSize >= 2 && request.groupSize <= 4 ? '- SMALL GROUP: Include intimate venues, reservations needed for popular restaurants' : ''}
${request.groupSize >= 5 ? '- LARGE GROUP: Need venues that accommodate groups, group-friendly activities, consider splitting options' : ''}
${request.hasKids ? `- TRAVELING WITH CHILDREN: 
  * All activities MUST be child-friendly
  * Include playgrounds, interactive museums, short walking distances
  * Plan for earlier dinner times (5:30-7 PM)
  * Add rest/snack breaks between activities
  * Avoid late night activities
  * Consider nap times for young children` : ''}
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
${days > 1 ? '- IMPORTANT: Include ONE accommodation/hotel recommendation as the FIRST item on Day 1' : ''}
${days > 1 ? '- The accommodation should have category "hotel" and include check-in/check-out info in description' : ''}
- Start days around 9:00-10:00 AM (after accommodation if multi-day)
- End with dinner around 7:00-8:00 PM
- Account for travel time between locations (max 15-20 minutes between stops)
- ${request.hasKids ? 'Include family-friendly activities, kid-friendly restaurants, and consider nap/rest time' : ''}
${request.preferences.length > 0 ? `
INTEREST-SPECIFIC REQUIREMENTS (CRITICAL - MUST FOLLOW):
${request.preferences.includes('shopping') ? `- SHOPPING FOCUS: Include AT LEAST 2-3 shopping destinations per day (boutiques, markets, malls, shopping districts)
- Add specific shopping areas like department stores, local markets, designer boutiques, outlet centers` : ''}
${request.preferences.includes('foodie') ? `- FOODIE FOCUS: Include 4-5 food experiences per day (restaurants, cafes, food markets, local specialties)
- Prioritize highly-rated local restaurants, food tours, markets, and unique dining experiences` : ''}
${request.preferences.includes('nightlife') ? `- NIGHTLIFE FOCUS: Include evening/night activities (bars, clubs, live music, rooftop lounges)
- End days later (10-11 PM) with nightlife options instead of just dinner` : ''}
${request.preferences.includes('nature') ? `- NATURE FOCUS: Include parks, gardens, hiking trails, beaches, outdoor activities
- Prioritize outdoor experiences over indoor attractions` : ''}
${request.preferences.includes('culture') ? `- CULTURE FOCUS: Include museums, galleries, historical sites, local neighborhoods
- Add cultural experiences like theaters, music venues, art districts` : ''}
${request.preferences.includes('adventure') ? `- ADVENTURE FOCUS: Include active experiences like tours, sports, unique activities
- Prioritize exciting and unique experiences over passive sightseeing` : ''}
${request.preferences.includes('history') ? `- HISTORY FOCUS: Include historical sites, museums, heritage tours, old quarters
- Prioritize locations with historical significance and guided tours` : ''}
${request.preferences.includes('relaxation') ? `- RELAXATION FOCUS: Include spas, beaches, parks, cafes with slower pace
- Allow more time at each location, fewer transitions` : ''}
` : ''}
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
    "places": [${days > 1 ? `
      {
        "name": "La Playa Carmel Hotel",
        "address": "Camino Real & 8th Avenue, Carmel-by-the-Sea, CA 93921",
        "category": "hotel",
        "description": "Charming boutique hotel near the beach ($180/night). Check-in: 3PM, Check-out: 11AM. Beautiful gardens and walking distance to downtown.",
        "estimatedDuration": 30,
        "suggestedTime": "15:00",
        "whyRecommended": "Highly rated hotel matching your budget and style preferences"
      },` : ''}
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

${request.budgetType === 'luxury' || request.budgetType === 'ultra_luxury' ? `
LUXURY ACCOMMODATION EXAMPLES BY DESTINATION:
- Mexico City: Four Seasons, St. Regis, Sofitel, Las Alcobas
- Cancun/Riviera Maya: Rosewood Mayakoba, Four Seasons, Grand Velas, Hotel Esencia
- Paris: Four Seasons George V, Le Meurice, Ritz Paris, Mandarin Oriental
- New York: St. Regis, The Carlyle, The Greenwich Hotel, Mandarin Oriental
- Tokyo: Aman Tokyo, Four Seasons, Mandarin Oriental, The Peninsula
- London: Claridge's, The Savoy, Four Seasons, Rosewood
DO NOT suggest standard chain hotels for luxury travelers!
` : ''}

VALIDATION CHECKLIST (MUST VERIFY BEFORE RESPONDING):
${request.preferences.includes('shopping') ? '✓ At least 50% of activities are shopping-related' : ''}
${request.preferences.includes('foodie') ? '✓ Multiple food experiences per day beyond just meals' : ''}
${request.preferences.includes('nightlife') ? '✓ Evening activities extend past 9 PM' : ''}
${request.hasKids ? '✓ ALL activities are appropriate for children' : ''}
${request.groupSize >= 5 ? '✓ All venues can accommodate large groups' : ''}
✓ All places are in ${request.destination} or immediate vicinity
✓ Activities align with selected interests, NOT generic tourist spots

FINAL REMINDER: ALL places must be in ${request.destination} or immediate vicinity. Do NOT include places from other cities. The user selected specific interests - honor them!`

    try {
      const userMessage = request.originalInput 
        ? `Please structure and organize my provided travel ideas into a proper ${days}-day itinerary for ${request.destination}. Preserve my original structure, timing, and places as much as possible.`
        : `Generate an itinerary for my ${days}-day trip to ${request.destination}.${request.preferences.length > 0 ? ` My main interests are ${request.preferences.join(' and ')} - please make sure the itinerary heavily focuses on these interests rather than generic tourist attractions.` : ''}`

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

    const systemPrompt = `You are a DIRECT, action-oriented travel assistant. Execute user requests immediately without lengthy explanations or offering multiple options. Use a one-shot interaction model: understand the request, take action, and confirm completion briefly.

CORE BEHAVIOR - ONE-SHOT EXECUTION:
- IMMEDIATELY execute requested changes without asking for clarification
- Give SHORT confirmations (1-2 sentences max)
- NO verbose explanations or multiple options
- NO "Here are some options..." or "Would you like me to..."
- Just DO what the user asks and confirm it's done

AUTO-EXECUTE THESE PATTERNS:
1. "add [place]" → ADD it immediately to the best time slot
2. "remove [place]" → REMOVE it immediately  
3. "optimize" → REORGANIZE for better flow immediately
4. "suggest restaurants" → ADD 2-3 top restaurants immediately
5. "add attractions" → ADD 2-3 must-see places immediately

RESPONSE STYLE:
- ✅ "Added Joe's Pizza to Day 1 at 7pm"
- ✅ "Optimized your itinerary - reduced travel time by 45 minutes" 
- ✅ "Added 3 top attractions to your schedule"
- ❌ "I can help you add restaurants. Here are some options: 1) Joe's Pizza 2) Mario's..."
- ❌ "Would you like me to add this to Day 1 or Day 2?"

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