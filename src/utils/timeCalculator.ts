import type { Place } from '../types'

// Helper function to convert time string to minutes since midnight
export function timeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number)
  return hours * 60 + minutes
}

// Helper function to convert minutes since midnight to time string
export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60) % 24
  const minutes = totalMinutes % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

// Helper function to add minutes to a time string
export function addMinutesToTime(timeString: string, minutesToAdd: number): string {
  const totalMinutes = timeToMinutes(timeString) + minutesToAdd
  return minutesToTime(totalMinutes)
}

// Calculate travel buffer time between places based on category
export function calculateTravelBuffer(fromPlace: Place, toPlace: Place): number {
  const categoryBuffers: Record<Place['category'], number> = {
    restaurant: 15, // Getting out of restaurant
    hotel: 30,      // Check-in/out process
    attraction: 10, // Quick transitions
    activity: 20,   // Activity cleanup time
    transport: 5,   // Already in transit
    shop: 15,       // Shopping time
    tip: 5,         // Quick tip
    cafe: 10,       // Coffee break
    bar: 15,        // Bar time
    flight: 60,     // Airport buffer
    accommodation: 30, // Check-in time
  }

  const fromBuffer = categoryBuffers[fromPlace.category] || 15
  const toBuffer = categoryBuffers[toPlace.category] || 10
  
  // Return the larger of the two buffers, with a minimum of 10 minutes
  return Math.max(fromBuffer, toBuffer, 10)
}

// Recalculate times for all places after a reorder
export function recalculateTimesAfterReorder(
  places: Place[], 
  dayNumber: number, 
  startTime: string = '09:00'
): Array<{ id: string; updates: Partial<Place> }> {
  const dayPlaces = places
    .filter(p => p.day === dayNumber)
    .sort((a, b) => a.order - b.order)
  
  if (dayPlaces.length === 0) return []

  const updates: Array<{ id: string; updates: Partial<Place> }> = []
  let currentTime = startTime

  for (let i = 0; i < dayPlaces.length; i++) {
    const place = dayPlaces[i]
    const duration = place.duration || 90 // Default 90 minutes
    
    // For the first place, use the provided start time or keep existing time
    if (i === 0) {
      currentTime = place.start_time || startTime
    }
    
    const endTime = addMinutesToTime(currentTime, duration)
    
    // Only update if times have changed
    if (place.start_time !== currentTime || place.end_time !== endTime) {
      updates.push({
        id: place.id,
        updates: {
          start_time: currentTime,
          end_time: endTime
        }
      })
    }
    
    // Calculate next start time if there's a next place
    if (i < dayPlaces.length - 1) {
      const nextPlace = dayPlaces[i + 1]
      const travelBuffer = calculateTravelBuffer(place, nextPlace)
      currentTime = addMinutesToTime(endTime, travelBuffer)
    }
  }

  return updates
}

// Smart initial time assignment for new places
export function assignInitialTimes(
  places: Place[],
  dayNumber: number,
  startTime: string = '09:00'
): Array<{ id: string; updates: Partial<Place> }> {
  const dayPlaces = places
    .filter(p => p.day === dayNumber)
    .sort((a, b) => a.order - b.order)

  if (dayPlaces.length === 0) return []

  const updates: Array<{ id: string; updates: Partial<Place> }> = []
  let currentTime = startTime

  for (let i = 0; i < dayPlaces.length; i++) {
    const place = dayPlaces[i]
    
    // Adjust start time based on category and time of day
    currentTime = adjustTimeForCategory(currentTime, place.category, i === 0)
    
    const duration = place.duration || getDefaultDurationForCategory(place.category)
    const endTime = addMinutesToTime(currentTime, duration)
    
    updates.push({
      id: place.id,
      updates: {
        start_time: currentTime,
        end_time: endTime,
        duration
      }
    })
    
    // Calculate next start time
    if (i < dayPlaces.length - 1) {
      const nextPlace = dayPlaces[i + 1]
      const travelBuffer = calculateTravelBuffer(place, nextPlace)
      currentTime = addMinutesToTime(endTime, travelBuffer)
    }
  }

  return updates
}

// Get default duration based on category
function getDefaultDurationForCategory(category: Place['category']): number {
  const categoryDurations: Record<Place['category'], number> = {
    restaurant: 90,     // 1.5 hours
    cafe: 45,          // 45 minutes
    attraction: 120,   // 2 hours
    activity: 180,     // 3 hours
    shop: 60,          // 1 hour
    hotel: 30,         // Check-in time
    accommodation: 30, // Check-in time
    transport: 60,     // 1 hour travel
    flight: 180,       // 3 hours including boarding
    bar: 120,          // 2 hours
    tip: 30,           // 30 minutes
  }
  
  return categoryDurations[category] || 90
}

// Adjust time based on category appropriateness
function adjustTimeForCategory(
  proposedTime: string, 
  category: Place['category'], 
  isFirstPlace: boolean
): string {
  const timeInMinutes = timeToMinutes(proposedTime)
  const hour = Math.floor(timeInMinutes / 60)
  
  // Don't adjust the first place as dramatically
  if (isFirstPlace) return proposedTime
  
  // Restaurant timing adjustments
  if (category === 'restaurant') {
    if (hour < 11) {
      // Too early for restaurant, move to lunch time
      return '11:30'
    } else if (hour >= 14 && hour < 17) {
      // Between lunch and dinner, move to dinner time
      return '18:00'
    }
  }
  
  // Cafe timing
  if (category === 'cafe') {
    if (hour < 7) return '07:30'  // Not too early
    if (hour > 21) return '09:00' // Move to next morning
  }
  
  // Bar timing
  if (category === 'bar') {
    if (hour < 17) return '17:00' // No bars before 5 PM
  }
  
  return proposedTime
}