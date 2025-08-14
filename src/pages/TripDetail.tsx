import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Edit2, Trash2, Check, X, Plus, RefreshCw } from 'lucide-react'
import { useTrips } from '../contexts/TripContext'
import { itineraryOptimizer } from '../services/itineraryOptimizer'
import { formatDate } from '../utils/date'
import { TripMap } from '../components/maps/TripMap'
import { TripAssistant } from '../components/ai/TripAssistant'
import { Button } from '../components/ui/Button'
import { PlaceAutocomplete } from '../components/forms/PlaceAutocomplete'
import { googlePlacesService } from '../services/googlePlaces'
import { isGoogleMapsConfigured } from '../config/api'
import { PlacePhoto } from '../components/places/PlacePhoto'
import { DragDropProvider } from '../components/dnd/DragDropProvider'
import { DraggablePlace, DroppableArea } from '../components/dnd/DraggablePlace'
import { DragOverlay } from '../components/dnd/DragOverlay'
import { ScheduleConflictModal } from '../components/dnd/ScheduleConflictModal'
import type { Place } from '../types'

// Helper function to convert 24-hour time to 12-hour format with AM/PM
function formatTime12Hour(time24: string): string {
  if (!time24) return ''
  const [hoursStr, minutes] = time24.split(':')
  let hours = parseInt(hoursStr)
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12 // Convert 0 to 12 for midnight
  return `${hours}:${minutes} ${ampm}`
}

// Helper function to calculate end time from start time and duration
function calculateEndTime(startTime: string, duration: number): string {
  const [hours, minutes] = startTime.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes + duration
  const endHours = Math.floor(totalMinutes / 60) % 24
  const endMinutes = totalMinutes % 60
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
}

// Helper function to convert time string to minutes since midnight
function timeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number)
  return hours * 60 + minutes
}

// Helper function to convert minutes since midnight to time string
function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60) % 24
  const minutes = totalMinutes % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

// Helper function to get category icon (keeping for potential future use)
// function getCategoryIcon(category: Place['category']) {
//   const iconMap = {
//     restaurant: UtensilsCrossed,
//     cafe: Coffee,
//     attraction: Camera,
//     shop: ShoppingBag,
//     hotel: Hotel,
//     accommodation: Hotel,
//     activity: Activity,
//     transport: Plane,
//     flight: Plane,
//     bar: Coffee,
//     tip: MapPinIcon
//   }
//   return iconMap[category] || MapPinIcon
// }

// Helper function to calculate date for a given day
function getDayDate(startDate: string, dayNumber: number): Date {
  const start = new Date(startDate)
  const dayDate = new Date(start)
  dayDate.setDate(start.getDate() + dayNumber - 1)
  return dayDate
}

// Helper function to check if two time ranges overlap
function timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const start1Min = timeToMinutes(start1)
  const end1Min = timeToMinutes(end1)
  const start2Min = timeToMinutes(start2)
  const end2Min = timeToMinutes(end2)
  
  return start1Min < end2Min && start2Min < end1Min
}


// SIMPLIFIED PlaceItem - No edit/delete functionality
interface PlaceItemProps {
  place: Place
  sequenceNumber?: number
}


function PlaceItem({ 
  place, 
  sequenceNumber
}: PlaceItemProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)


  // Fetch photo from Google Places
  useEffect(() => {
    if (place.photo_url) {
      setPhotoUrl(place.photo_url)
    }
  }, [place.photo_url])


  const endTime24 = place.end_time || calculateEndTime(place.start_time || '09:00', place.duration || 90)
  const startTime12 = formatTime12Hour(place.start_time || '09:00')
  const endTime12 = formatTime12Hour(endTime24)

  return (
    <DraggablePlace 
      place={place}
      className="group flex bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
      hideDefaultHandle={true}
      renderDragHandle={(listeners, attributes) => (
        /* Left Rail - Fixed 40px width */
        <div className="w-10 flex-shrink-0 flex flex-col items-center pt-3 bg-transparent">
          {/* Numbered Stop Circle */}
          {sequenceNumber && (
            <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-semibold">{sequenceNumber}</span>
            </div>
          )}
          
          {/* Drag Handle - 8-12px below circle, visible on hover */}
          <button
            {...listeners}
            {...attributes}
            className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing p-1"
            aria-label="Drag to reorder"
            type="button"
            style={{ touchAction: 'none' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" className="text-slate-400">
              <g fill="currentColor">
                <circle cx="5" cy="3" r="1.5"/>
                <circle cx="11" cy="3" r="1.5"/>
                <circle cx="5" cy="8" r="1.5"/>
                <circle cx="11" cy="8" r="1.5"/>
                <circle cx="5" cy="13" r="1.5"/>
                <circle cx="11" cy="13" r="1.5"/>
              </g>
            </svg>
          </button>
        </div>
      )}
    >
      {/* Main Content */}
      <div className="flex-1 p-3">
        <div className="flex gap-3">
          {/* Photo */}
          <div className="flex-shrink-0">
            <PlacePhoto
              placeId={place.place_id}
              photoUrl={photoUrl || undefined}
              placeName={place.name}
              className="w-16 h-16 object-cover rounded-md"
            />
          </div>

          {/* Content - SIMPLIFIED */}
          <div className="flex-1">
            {/* Title only */}
            <h4 className="font-medium text-gray-900 text-sm pr-2 mb-1">{place.name}</h4>
            
            {/* Time and duration */}
            <div className="text-xs text-gray-500 mb-1">
              {startTime12}–{endTime12} · {place.duration || 90} min
            </div>
            
            {/* Address */}
            {place.address && (
              <div className="text-xs text-gray-500 mb-1">
                📍 {place.address}
              </div>
            )}
            
            {/* Notes - always visible in full */}
            {place.notes && (
              <p className="text-xs text-gray-600 mt-1">
                {place.notes}
              </p>
            )}
          </div>
        </div>
      </div>
    </DraggablePlace>
  )
}

export function TripDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getTrip, getPlacesByTrip, loading, createPlace, updatePlace, bulkUpdatePlaces, deletePlace, deleteTrip, updateTrip } = useTrips()
  const [mapSelectedDay, setMapSelectedDay] = useState<number | undefined>(undefined)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showConflictModal, setShowConflictModal] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [isRefreshingPhotos, setIsRefreshingPhotos] = useState(false)
  const [refreshProgress, setRefreshProgress] = useState<{ current: number; total: number } | null>(null)
  const [collapsedDays, setCollapsedDays] = useState<Set<number>>(new Set())
  const [newItemData, setNewItemData] = useState<{
    name: string
    address: string
    category: 'restaurant' | 'attraction' | 'hotel' | 'activity' | 'shop' | 'transport' | 'tip' | 'cafe' | 'bar' | 'flight' | 'accommodation'
    day: number
    start_time: string
    duration: number
    notes: string
    place_id?: string
    latitude?: number
    longitude?: number
    photo_url?: string
  }>({
    name: '',
    address: '',
    category: 'attraction',
    day: 1,
    start_time: '09:00',
    duration: 90,
    notes: ''
  })
  
  const trip = id ? getTrip(id) : undefined
  const places = id ? getPlacesByTrip(id) : []
  
  console.log('🔍 TripDetail: Component rendered with trip ID:', id)
  console.log('🔍 TripDetail: Trip found:', !!trip)
  console.log('🔍 TripDetail: Places found:', places.length)

  // Initialize collapsed days (start with all expanded)
  useEffect(() => {
    // Start with all days expanded
    setCollapsedDays(new Set())
  }, [])

  const toggleDayCollapse = (day: number) => {
    setCollapsedDays(prev => {
      const newSet = new Set(prev)
      if (newSet.has(day)) {
        newSet.delete(day)
      } else {
        newSet.add(day)
      }
      return newSet
    })
  }



  const handleRefreshPhotos = async () => {
    if (!trip || !isGoogleMapsConfigured()) {
      console.log('Cannot refresh photos: Google Maps not configured or no trip', {
        hasTrip: !!trip,
        apiConfigured: isGoogleMapsConfigured()
      })
      return
    }

    // Check if Google Maps API is actually loaded
    if (typeof window.google === 'undefined' || !window.google.maps || !window.google.maps.places) {
      console.error('❌ Google Maps API not loaded! Cannot refresh photos.')
      alert('Google Maps API is not loaded. Please refresh the page and try again.')
      return
    }

    console.log('🚀 Starting photo refresh for', places.length, 'places')

    setIsRefreshingPhotos(true)
    setRefreshProgress({ current: 0, total: places.length })

    let updatedCount = 0
    
    for (let i = 0; i < places.length; i++) {
      const place = places[i]
      setRefreshProgress({ current: i + 1, total: places.length })
      
      // Skip if place already has a photo
      if (place.photo_url) {
        console.log(`⏭️ Skipping ${place.name} - already has photo`)
        continue
      }

      try {
        // Search for the place using Google Places
        const searchQuery = `${place.name} ${trip.destination}`
        console.log(`🔍 Searching for: ${searchQuery}`)
        
        const searchResults = await googlePlacesService.searchPlaces(searchQuery, {
          lat: trip.latitude || 0,
          lng: trip.longitude || 0
        })
        
        if (searchResults.length > 0) {
          const googlePlace = searchResults[0]
          console.log(`✅ Found match for ${place.name}:`, googlePlace.name)
          
          // Update the place with Google data
          const updates: Partial<Place> = {
            place_id: googlePlace.place_id,
            latitude: googlePlace.geometry.location.lat,
            longitude: googlePlace.geometry.location.lng,
          }
          
          // Add photo if available
          if (googlePlace.photos && googlePlace.photos.length > 0) {
            updates.photo_url = googlePlace.photos[0].photo_reference
            console.log(`📸 Adding photo for ${place.name}`)
            updatedCount++
          }
          
          updatePlace(place.id, updates)
        } else {
          console.log(`❌ No match found for ${place.name}`)
        }
      } catch (error) {
        console.error(`Error refreshing photo for ${place.name}:`, error)
      }
      
      // Small delay to avoid hitting API rate limits
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    setIsRefreshingPhotos(false)
    setRefreshProgress(null)
    console.log(`🎉 Photo refresh complete! Updated ${updatedCount} places`)
  }

  // Smart initial planning - automatically optimize when places are added
  const applySmartPlanning = (placesToOptimize: Place[], dayNumber?: number) => {
    if (placesToOptimize.length < 2) return placesToOptimize
    
    try {
      console.log('🧠 Applying smart planning...')
      
      // If optimizing a specific day, only optimize that day
      if (dayNumber) {
        const dayPlaces = placesToOptimize.filter(p => p.day === dayNumber)
        const otherPlaces = placesToOptimize.filter(p => p.day !== dayNumber)
        
        if (dayPlaces.length >= 2) {
          const optimizedDayPlaces = itineraryOptimizer.optimizeDayOrder(dayPlaces)
          return [...otherPlaces, ...optimizedDayPlaces]
        }
        return placesToOptimize
      }
      
      // Optimize entire itinerary
      return itineraryOptimizer.optimizeTripItinerary(placesToOptimize)
    } catch (error) {
      console.error('❌ Error in smart planning:', error)
      return placesToOptimize
    }
  }

  // Smart place creation with automatic optimization
  const createPlaceWithSmartPlanning = (place: Omit<Place, 'id' | 'created_date' | 'updated_date'>) => {
    // Create the place first
    const placeId = createPlace(place)
    
    // After creation, get the updated places and apply smart planning to that day
    setTimeout(() => {
      const currentPlaces = getPlacesByTrip(id || '')
      const dayPlaces = currentPlaces.filter(p => p.day === place.day)
      
      if (dayPlaces.length >= 2) {
        console.log(`🎯 Auto-optimizing day ${place.day} with ${dayPlaces.length} places`)
        const optimizedPlaces = applySmartPlanning(currentPlaces, place.day)
        
        // Apply the optimizations
        optimizedPlaces
          .filter(p => p.day === place.day)
          .forEach(optimizedPlace => {
            updatePlace(optimizedPlace.id, { order: optimizedPlace.order })
          })
      }
    }, 100) // Small delay to ensure the place is created
    
    return placeId
  }

  const handleDeleteTrip = () => {
    if (id) {
      deleteTrip(id)
      navigate('/') // Navigate to dashboard using React Router
    }
  }

  const handleStartTitleEdit = () => {
    if (trip) {
      setEditedTitle(trip.title)
      setIsEditingTitle(true)
    }
  }

  const handleSaveTitleEdit = () => {
    if (id && editedTitle.trim()) {
      updateTrip(id, { title: editedTitle.trim() })
      setIsEditingTitle(false)
    }
  }

  const handleCancelTitleEdit = () => {
    setIsEditingTitle(false)
    setEditedTitle('')
  }

  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitleEdit()
    } else if (e.key === 'Escape') {
      handleCancelTitleEdit()
    }
  }

  const handleBulkUpdatePlaces = (updates: Array<{ id: string; updates: Partial<Place> }>) => {
    // Use the bulk update function for true batching
    bulkUpdatePlaces(updates)
  }

  const handleConflictResolution = () => {
    // For now, just close the modal. Later we can implement specific resolution logic
    setShowConflictModal(false)
  }

  const handleCreateNewItem = () => {
    if (!id || !newItemData.name.trim()) return

    const dayPlaces = places.filter(p => p.day === newItemData.day).sort((a, b) => a.order - b.order)
    
    // Find the correct chronological position
    let insertPosition = dayPlaces.length // Default to end
    const newStartTime = newItemData.start_time
    const adjustedPlaces: Array<{ id: string; start_time: string; end_time: string; order: number }> = []
    
    for (let i = 0; i < dayPlaces.length; i++) {
      const currentPlace = dayPlaces[i]
      const currentStart = currentPlace.start_time || '09:00'
      
      // If new item's start time is before this place's start time
      if (timeToMinutes(newStartTime) < timeToMinutes(currentStart)) {
        insertPosition = i
        break
      }
    }
    
    // Check for overlaps and adjust times if necessary
    let finalStartTime = newStartTime
    let finalEndTime = calculateEndTime(finalStartTime, newItemData.duration)
    
    // Check if we need to adjust times due to overlaps
    if (insertPosition < dayPlaces.length) {
      const nextPlace = dayPlaces[insertPosition]
      const nextStart = nextPlace.start_time || '09:00'
      
      // If new item would overlap with the next item
      if (timesOverlap(finalStartTime, finalEndTime, nextStart, nextPlace.end_time || calculateEndTime(nextStart, nextPlace.duration || 90))) {
        // Option 1: Try to fit the new item before the next item
        const nextStartMinutes = timeToMinutes(nextStart)
        const newEndMinutes = nextStartMinutes - 15 // 15-minute buffer
        const newStartMinutes = newEndMinutes - newItemData.duration
        
        if (newStartMinutes >= 0) {
          // Check if this new time conflicts with previous item
          let canFitBefore = true
          if (insertPosition > 0) {
            const prevPlace = dayPlaces[insertPosition - 1]
            const prevEnd = prevPlace.end_time || calculateEndTime(prevPlace.start_time || '09:00', prevPlace.duration || 90)
            if (timeToMinutes(prevEnd) + 15 > newStartMinutes) { // 15-minute buffer
              canFitBefore = false
            }
          }
          
          if (canFitBefore) {
            finalStartTime = minutesToTime(newStartMinutes)
            finalEndTime = calculateEndTime(finalStartTime, newItemData.duration)
          } else {
            // Option 2: Push subsequent items later
            finalStartTime = newStartTime
            finalEndTime = calculateEndTime(finalStartTime, newItemData.duration)
            
            // Calculate how much to push subsequent items
            const pushAmount = timeToMinutes(finalEndTime) + 15 - timeToMinutes(nextStart) // 15-minute buffer
            
            if (pushAmount > 0) {
              // Adjust all subsequent items
              for (let j = insertPosition; j < dayPlaces.length; j++) {
                const placeToAdjust = dayPlaces[j]
                const currentStartMinutes = timeToMinutes(placeToAdjust.start_time || '09:00')
                const newAdjustedStart = minutesToTime(currentStartMinutes + pushAmount)
                const newAdjustedEnd = calculateEndTime(newAdjustedStart, placeToAdjust.duration || 90)
                
                adjustedPlaces.push({
                  id: placeToAdjust.id,
                  start_time: newAdjustedStart,
                  end_time: newAdjustedEnd,
                  order: placeToAdjust.order
                })
              }
            }
          }
        } else {
          // Can't fit before, so push everything after
          finalStartTime = newStartTime
          finalEndTime = calculateEndTime(finalStartTime, newItemData.duration)
          
          const pushAmount = timeToMinutes(finalEndTime) + 15 - timeToMinutes(nextStart)
          if (pushAmount > 0) {
            for (let j = insertPosition; j < dayPlaces.length; j++) {
              const placeToAdjust = dayPlaces[j]
              const currentStartMinutes = timeToMinutes(placeToAdjust.start_time || '09:00')
              const newAdjustedStart = minutesToTime(currentStartMinutes + pushAmount)
              const newAdjustedEnd = calculateEndTime(newAdjustedStart, placeToAdjust.duration || 90)
              
              adjustedPlaces.push({
                id: placeToAdjust.id,
                start_time: newAdjustedStart,
                end_time: newAdjustedEnd,
                order: placeToAdjust.order
              })
            }
          }
        }
      }
    }
    
    // Create the new place
    const newPlace = {
      trip_id: id,
      name: newItemData.name.trim(),
      address: newItemData.address.trim(),
      category: newItemData.category,
      day: newItemData.day,
      order: insertPosition, // This will be the correct position
      start_time: finalStartTime,
      end_time: finalEndTime,
      duration: newItemData.duration,
      notes: newItemData.notes.trim(),
      is_locked: false,
      is_reservation: false,
      ...(newItemData.place_id && { place_id: newItemData.place_id }),
      ...(newItemData.latitude && { latitude: newItemData.latitude }),
      ...(newItemData.longitude && { longitude: newItemData.longitude }),
      ...(newItemData.photo_url && { photo_url: newItemData.photo_url })
    }

    // Adjust orders of existing places to make room
    const placesToUpdate: Array<{ id: string; order: number }> = []
    for (let i = insertPosition; i < dayPlaces.length; i++) {
      placesToUpdate.push({
        id: dayPlaces[i].id,
        order: dayPlaces[i].order + 1
      })
    }

    // Apply all updates
    createPlaceWithSmartPlanning(newPlace)
    
    // Update orders of displaced places
    placesToUpdate.forEach(({ id, order }) => {
      updatePlace(id, { order })
    })
    
    // Update times of places that were pushed
    adjustedPlaces.forEach(({ id, start_time, end_time }) => {
      updatePlace(id, { start_time, end_time })
    })
    
    // Reset form
    setNewItemData({
      name: '',
      address: '',
      category: 'attraction',
      day: 1,
      start_time: '09:00',
      duration: 90,
      notes: '',
      place_id: undefined,
      latitude: undefined,
      longitude: undefined,
      photo_url: undefined
    })
    setShowAddForm(false)
  }

  // Group places by day - memoized to prevent unnecessary recalculations
  // MUST be before any early returns to maintain hooks order
  const placesByDay = useMemo(() => {
    if (!places || places.length === 0) {
      return {} as Record<number, typeof places>
    }
    return places.reduce((acc, place) => {
      if (!acc[place.day]) {
        acc[place.day] = []
      }
      acc[place.day].push(place)
      return acc
    }, {} as Record<number, typeof places>)
  }, [places])

  const days = useMemo(() => {
    return Object.keys(placesByDay).map(Number).sort((a, b) => a - b)
  }, [placesByDay])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Trip not found</h1>
          <p className="text-gray-600">The trip you're looking for doesn't exist or has been deleted.</p>
        </div>
      </div>
    )
  }

  return (
    <DragDropProvider 
      places={places} 
      onUpdatePlace={updatePlace}
      onBulkUpdatePlaces={handleBulkUpdatePlaces}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8 animate-fade-in">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {isEditingTitle ? (
              <div className="flex items-center gap-2 mb-2 sm:mb-4">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onKeyDown={handleTitleKeyPress}
                  className="text-2xl sm:text-3xl font-bold text-gray-900 bg-white border-2 border-primary-300 rounded-lg px-3 py-1 focus:border-primary-500 focus:outline-none flex-1"
                  placeholder="Enter trip title"
                  autoFocus
                />
                <button
                  onClick={handleSaveTitleEdit}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Save"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={handleCancelTitleEdit}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Cancel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-2 sm:mb-4 group">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{trip.title}</h1>
                  {trip.start_date && (
                    <p className="text-lg text-gray-600 mt-1">
                      {formatDate(trip.start_date, 'MMM d')} - {trip.end_date ? formatDate(trip.end_date, 'MMM d, yyyy') : 'TBD'}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleStartTitleEdit}
                  className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all"
                  title="Edit trip title"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="flex items-center text-gray-600">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <span className="text-sm sm:text-base">{trip.destination}</span>
            </div>
          </div>
          
          {/* Delete Trip Button */}
          <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              
              {showDeleteConfirm && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50 w-64">
                <p className="text-sm text-gray-700 mb-3">Are you sure you want to delete this trip?</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleDeleteTrip}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Content - Timeline/Map */}
        <div>
          <div className="card animate-slide-up">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-lg sm:text-xl font-semibold">Your Itinerary</h2>
              
              <div className="flex items-center gap-2">
                {/* Refresh Photos Button - Only show if some places don't have photos */}
                {isGoogleMapsConfigured() && places.some(p => !p.photo_url) && (
                  <Button
                    onClick={handleRefreshPhotos}
                    size="sm"
                    variant="ghost"
                    disabled={isRefreshingPhotos}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshingPhotos ? 'animate-spin' : ''}`} />
                    {isRefreshingPhotos 
                      ? refreshProgress 
                        ? `${refreshProgress.current}/${refreshProgress.total}`
                        : 'Refreshing...'
                      : 'Add Photos'
                    }
                  </Button>
                )}
                
                {/* Add New Place Button - Prominent */}
                <Button
                  onClick={() => setShowAddForm(!showAddForm)}
                  size="sm"
                  variant="primary"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Place
                </Button>
              </div>
            </div>


            {/* Add New Place Form */}
            {showAddForm && (
              <div className="mb-6 bg-gray-50 rounded-xl p-4 animate-scale-in">
                <h3 className="text-lg font-semibold mb-4">Add New Place</h3>
                
                {/* Place Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-700 block mb-1">Place Name *</label>
                      <PlaceAutocomplete
                        value={newItemData.name}
                        onChange={(name) => setNewItemData(prev => ({ ...prev, name }))}
                        onPlaceSelect={(placeDetails) => {
                          console.log('🎯 New place selected:', placeDetails)
                          const photoUrl = placeDetails.photos && placeDetails.photos.length > 0 
                            ? placeDetails.photos[0].photo_reference 
                            : undefined
                          console.log('📸 New place photo URL:', photoUrl)
                          
                          setNewItemData(prev => ({
                            ...prev,
                            name: placeDetails.name,
                            address: placeDetails.formatted_address,
                            place_id: placeDetails.place_id,
                            latitude: placeDetails.geometry.location.lat,
                            longitude: placeDetails.geometry.location.lng,
                            photo_url: photoUrl,
                            category: placeDetails.types.some(type => ['restaurant', 'food', 'meal_takeaway', 'cafe', 'bar'].includes(type)) 
                              ? 'restaurant' as const
                              : placeDetails.types.some(type => ['lodging', 'hotel'].includes(type))
                              ? 'hotel' as const  
                              : 'attraction' as const
                          }))
                        }}
                        destination={trip?.destination}
                        destinationCoords={trip?.latitude && trip?.longitude ? { 
                          lat: trip.latitude, 
                          lng: trip.longitude 
                        } : undefined}
                        placeholder="Search for places..."
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm text-gray-700 block mb-1">Address</label>
                      <input
                        type="text"
                        value={newItemData.address}
                        onChange={(e) => setNewItemData(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter address"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-gray-700 block mb-1">Category</label>
                      <select
                        value={newItemData.category}
                        onChange={(e) => setNewItemData(prev => ({ ...prev, category: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="attraction">Attraction</option>
                        <option value="restaurant">Restaurant</option>
                        <option value="hotel">Hotel</option>
                        <option value="activity">Activity</option>
                        <option value="shop">Shop</option>
                        <option value="transport">Transport</option>
                        <option value="cafe">Cafe</option>
                        <option value="bar">Bar</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-700 block mb-1">Day</label>
                      <select
                        value={newItemData.day}
                        onChange={(e) => setNewItemData(prev => ({ ...prev, day: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        {days.length > 0 ? days.map(day => (
                          <option key={day} value={day}>Day {day}</option>
                        )) : (
                          <option value={1}>Day 1</option>
                        )}
                      </select>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="text-sm text-gray-700 block mb-1">Start Time</label>
                        <input
                          type="time"
                          value={newItemData.start_time}
                          onChange={(e) => setNewItemData(prev => ({ ...prev, start_time: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      
                      <div className="flex-1">
                        <label className="text-sm text-gray-700 block mb-1">Duration (min)</label>
                        <input
                          type="number"
                          value={newItemData.duration}
                          onChange={(e) => setNewItemData(prev => ({ ...prev, duration: parseInt(e.target.value) || 90 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          min="15"
                          step="15"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-gray-700 block mb-1">Notes</label>
                      <textarea
                        value={newItemData.notes}
                        onChange={(e) => setNewItemData(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                        placeholder="Add personal notes about this place..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                  <Button 
                    onClick={handleCreateNewItem} 
                    disabled={!newItemData.name.trim()}
                  >
                    Add Place
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setShowAddForm(false)
                      setNewItemData({
                        name: '',
                        address: '',
                        category: 'attraction',
                        day: 1,
                        start_time: '09:00',
                        duration: 90,
                        notes: '',
                        place_id: undefined,
                        latitude: undefined,
                        longitude: undefined,
                        photo_url: undefined
                      })
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Content - Itinerary View */}
            <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 min-h-[60vh] lg:h-[70vh] lg:min-h-[500px] lg:max-h-[900px]">
                {/* Mobile notification */}
                <div className="lg:hidden bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 lg:col-span-2">
                  <p className="text-sm text-blue-800">
                    💡 On mobile, the split view shows itinerary and map stacked vertically for better viewing
                  </p>
                </div>
                {/* Itinerary Panel */}
                <div className="bg-gray-50 rounded-xl p-4 overflow-y-auto h-[40vh] min-h-[300px] lg:h-auto">
                  {days.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-sm">No places added to this trip yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {days.map((day) => {
                        const isCollapsed = collapsedDays.has(day)
                        const dayPlaces = placesByDay[day]?.sort((a, b) => a.order - b.order) || []
                        
                        return (
                          <div key={day} className="relative">
                            {/* Day Header */}
                            <div 
                              className="cursor-pointer mb-3"
                              onClick={() => toggleDayCollapse(day)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  toggleDayCollapse(day)
                                }
                              }}
                              tabIndex={0}
                              role="button"
                              aria-expanded={!isCollapsed}
                              aria-controls={`day-${day}-content`}
                            >
                              <div className="bg-gray-100 rounded-lg p-3 hover:bg-gray-200 transition-colors duration-200">
                                <div className="flex items-center justify-between">
                                  {/* Day title and date */}
                                  <div className="flex flex-col">
                                    <h3 className="text-base font-semibold text-gray-900">
                                      Day {day}
                                    </h3>
                                    {trip?.start_date && (
                                      <p className="text-sm text-gray-600">
                                        {formatDate(getDayDate(trip.start_date, day), 'EEE, MMM dd')}
                                      </p>
                                    )}
                                  </div>
                                
                                  {/* Right side - Place count and expand indicator */}
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-500">
                                      {dayPlaces.length} {dayPlaces.length === 1 ? 'place' : 'places'}
                                    </span>
                                    <div className={`transform transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`}>
                                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Collapsible Day Content */}
                            <div 
                              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                                isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'
                              }`}
                              id={`day-${day}-content`}
                              aria-hidden={isCollapsed}
                            >
                              <div className="pt-3 space-y-2">
                                <DroppableArea day={day} places={places}>
                                  {dayPlaces.map((place, placeIndex) => {
                                    // Calculate sequence number that resets for each day
                                    const daySequenceNumber = placeIndex + 1
                                    
                                    return (
                                      <div 
                                        key={place.id}
                                        className="animate-fade-in"
                                        style={{ animationDelay: `${placeIndex * 0.1}s` }}
                                      >
                                        <PlaceItem
                                          place={place}
                                          sequenceNumber={daySequenceNumber}
                                        />
                                      </div>
                                    )
                                  })}
                                </DroppableArea>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
                
                {/* Map Panel with Day Filter Overlay */}
                <div className="rounded-xl overflow-hidden border border-gray-200 h-[40vh] min-h-[300px] lg:h-auto relative">
                  {/* Day Filter Pills - Overlay on Map */}
                  {days.length > 1 && (
                    <div className="absolute top-3 right-3" style={{ zIndex: 1000 }}>
                      <div className="flex flex-wrap gap-2 justify-end">
                        <button
                          onClick={() => setMapSelectedDay(undefined)}
                          className={`px-3 py-1.5 text-xs sm:text-sm rounded-full transition-all shadow-md backdrop-blur-sm whitespace-nowrap ${
                            mapSelectedDay === undefined
                              ? 'bg-primary-500 text-white'
                              : 'bg-white/90 text-gray-700 hover:bg-white'
                          }`}
                        >
                          All Days
                        </button>
                        {days.map(day => (
                          <button
                            key={day}
                            onClick={() => setMapSelectedDay(day)}
                            className={`px-3 py-1.5 text-xs sm:text-sm rounded-full transition-all shadow-md backdrop-blur-sm whitespace-nowrap ${
                              mapSelectedDay === day
                                ? 'bg-primary-500 text-white'
                                : 'bg-white/90 text-gray-700 hover:bg-white'
                            }`}
                          >
                            Day {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <TripMap
                    places={places}
                    selectedDay={mapSelectedDay}
                    className="h-full"
                  />
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Assistant */}
      <TripAssistant 
        trip={trip} 
        places={places}
        onCreatePlace={createPlaceWithSmartPlanning}
        onUpdatePlace={updatePlace}
        onDeletePlace={deletePlace}
      />
      </div>
      
      {/* Drag Overlay */}
      <DragOverlay />
      
      {/* Schedule Conflict Modal */}
      <ScheduleConflictModal 
        isOpen={showConflictModal}
        onClose={() => setShowConflictModal(false)}
        onResolve={handleConflictResolution}
      />
    </DragDropProvider>
  )
}