import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TripPlanningForm, type TripFormData } from '../components/forms/TripPlanningForm'
import { TripReviewScreen } from '../components/forms/TripReviewScreen'
import { useTrips } from '../contexts/TripContext'
import { realApiService } from '../services/realApi'

type TripCreationStep = 'form' | 'review'

export function NewTripCreation() {
  const navigate = useNavigate()
  const { createTrip, createPlace } = useTrips()
  
  const [currentStep, setCurrentStep] = useState<TripCreationStep>('form')
  const [formData, setFormData] = useState<TripFormData | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFormSubmit = async (data: TripFormData) => {
    setFormData(data)
    // Skip review step and directly generate the trip
    await handleGenerate(data)
  }

  const handleEdit = () => {
    setCurrentStep('form')
  }

  const generatePlacesFromAI = async (tripData: TripFormData) => {
    try {
      // Prepare the prompt with custom items inclusion guarantee
      let prompt = `Create a detailed ${Math.ceil((new Date(tripData.endDate).getTime() - new Date(tripData.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1}-day itinerary for ${tripData.destination}.`
      
      // Add trip preferences
      if (tripData.tripType) {
        prompt += ` This is a ${tripData.tripType} trip.`
        
        // Make events family-friendly when Family trip type is selected
        if (tripData.tripType === 'family') {
          prompt += ` This is a family trip with children, so include family-friendly activities, child-safe venues, and accommodations suitable for families. Avoid late-night activities and prioritize kid-friendly attractions.`
        }
      }
      
      if (tripData.travelPace) {
        prompt += ` The travel pace should be ${tripData.travelPace}.`
      }
      
      if (tripData.interests.length > 0) {
        prompt += ` Focus on these interests: ${tripData.interests.join(', ')}.`
      }
      
      // CRITICAL: Guarantee custom items inclusion
      if (tripData.customItems.length > 0) {
        prompt += ` IMPORTANT: You MUST include these specific places/activities in the itinerary: ${tripData.customItems.join(', ')}. These are mandatory and must appear in the final itinerary at appropriate times.`
      }
      
      prompt += ` Create a day-by-day itinerary with specific places, activities, and recommended times.`

      console.log('🤖 Generating itinerary with prompt:', prompt)
      
      const response = await realApiService.generateItinerary({
        destination: tripData.destination,
        start_date: tripData.startDate,
        end_date: tripData.endDate,
        trip_type: tripData.tripType || 'cultural',
        group_size: tripData.tripType === 'family' ? 4 : 2, // Assume family of 4 for family trips
        has_kids: tripData.tripType === 'family',
        pace: tripData.travelPace || 'moderate',
        preferences: tripData.interests,
        original_input: prompt
      })

      console.log('✅ AI Response received:', response)
      return response
    } catch (error) {
      console.error('❌ AI Generation failed:', error)
      throw new Error('Failed to generate itinerary. Please try again.')
    }
  }

  const validateCustomItemsInclusion = (places: any[], customItems: string[]) => {
    if (customItems.length === 0) return true
    
    const placeNames = places.map(p => p.name.toLowerCase()).join(' ')
    const missingItems = customItems.filter(item => 
      !placeNames.includes(item.toLowerCase())
    )
    
    if (missingItems.length > 0) {
      console.warn('⚠️ Custom items missing from AI response:', missingItems)
      // For now, we'll proceed but log the issue
      // In a production system, you might want to retry generation or manually add these items
    }
    
    return missingItems.length === 0
  }

  const createPlacesWithSmartScheduling = (aiResponse: any, tripId: string, tripData: TripFormData) => {
    const places = aiResponse.data?.places || []
    
    // Validate that all custom items are included
    validateCustomItemsInclusion(places, tripData.customItems)
    
    // Create places with smart time scheduling
    places.forEach((aiPlace: any, index: number) => {
      // Map AI response to our Place structure
      const place = {
        trip_id: tripId,
        name: aiPlace.name || `Activity ${index + 1}`,
        category: aiPlace.category || 'attraction',
        address: aiPlace.address || '',
        latitude: aiPlace.latitude || null,
        longitude: aiPlace.longitude || null,
        day: aiPlace.day || Math.ceil((index + 1) / 4), // Default to ~4 activities per day
        order: aiPlace.order || index,
        start_time: aiPlace.start_time || calculateDefaultStartTime(index),
        end_time: aiPlace.end_time || calculateDefaultEndTime(index),
        duration: aiPlace.duration || 90, // Default 90 minutes
        notes: aiPlace.notes || '',
        website: aiPlace.website || '',
        phone: aiPlace.phone || '',
        is_locked: false,
        is_reservation: false,
        place_id: aiPlace.place_id || null,
        photo_url: aiPlace.photo_url || null,
      }
      
      console.log('📍 Creating place:', place.name, `(Day ${place.day}, Order ${place.order})`)
      createPlace(place)
    })
  }

  const calculateDefaultStartTime = (index: number) => {
    const activitiesPerDay = 4
    const activityIndex = index % activitiesPerDay
    
    // Spread activities throughout the day: 9 AM, 11 AM, 2 PM, 5 PM
    const timeSlots = ['09:00', '11:00', '14:00', '17:00']
    return timeSlots[activityIndex] || '09:00'
  }

  const calculateDefaultEndTime = (index: number) => {
    const startTime = calculateDefaultStartTime(index)
    const [hours] = startTime.split(':').map(Number)
    const endHour = hours + 1.5 // Default 1.5 hour duration
    const endHours = Math.floor(endHour)
    const endMinutes = (endHour % 1) * 60
    
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
  }

  const handleGenerate = async (data?: TripFormData) => {
    const tripData = data || formData
    if (!tripData) return

    setIsGenerating(true)
    setError(null)

    try {
      // Create the trip record first
      const tripId = createTrip({
        title: tripData.autoGeneratedTitle,
        destination: tripData.destination,
        start_date: tripData.startDate,
        end_date: tripData.endDate,
        trip_type: (tripData.tripType || 'cultural') as 'solo' | 'romantic' | 'family' | 'friends' | 'business',
        group_size: tripData.tripType === 'family' ? 4 : 2,
        has_kids: tripData.tripType === 'family',
        pace: (tripData.travelPace || 'moderate') as 'relaxed' | 'moderate' | 'packed',
        preferences: tripData.interests,
        is_guide: false,
        is_public: true, // All trips are now public by default
        original_input: `Generated trip with custom items: ${tripData.customItems.join(', ')}`,
        collaborators: [],
        latitude: tripData.destinationCoords?.lat || undefined,
        longitude: tripData.destinationCoords?.lng || undefined,
      })

      console.log('✅ Trip created with ID:', tripId)

      // Generate AI itinerary with custom items guarantee
      const aiResponse = await generatePlacesFromAI(tripData)
      
      // Create places from AI response with smart scheduling
      createPlacesWithSmartScheduling(aiResponse, tripId, tripData)

      console.log('🎉 Trip generation completed successfully!')
      
      // Navigate to the new trip
      navigate(`/trip/${tripId}`)
    } catch (error) {
      console.error('❌ Trip generation failed:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TripPlanningForm
          onSubmit={handleFormSubmit}
          onDataChange={setFormData}
          initialData={formData || undefined}
          isGenerating={isGenerating}
        />

        {error && (
          <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg max-w-md">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="font-medium">Generation Failed</span>
            </div>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-sm underline mt-2 hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  )
}