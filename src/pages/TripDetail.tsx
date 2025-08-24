import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Trash2, Check, X, Plus, Edit2, MoreVertical } from 'lucide-react'
import { useTrips } from '../contexts/TripContext'
import { useUser } from '../contexts/UserContext'
import { itineraryOptimizer } from '../services/itineraryOptimizer'
import { formatDate } from '../utils/date'
import { TripMap } from '../components/maps/TripMap'
import { TripAssistant } from '../components/ai/TripAssistant'
import { TripDetailTopChrome } from '../components/trips/TripDetailTopChrome'
import { Button } from '../components/ui/Button'
import { PlaceAutocomplete } from '../components/forms/PlaceAutocomplete'
import { PlacePhoto } from '../components/places/PlacePhoto'
import { DragDropProvider } from '../components/dnd/DragDropProvider'
import { DraggablePlace, DroppableArea } from '../components/dnd/DraggablePlace'
import { DragOverlay } from '../components/dnd/DragOverlay'
import { ScheduleConflictModal } from '../components/dnd/ScheduleConflictModal'
import { EditPlaceModal } from '../components/places/EditPlaceModal'
import { AccommodationSection } from '../components/trips/AccommodationSection'
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



// PlaceItem with edit functionality via modal
interface PlaceItemProps {
  place: Place
  sequenceNumber?: number
  onEdit: (place: Place) => void
}

const PlaceItem = ({ 
  place, 
  sequenceNumber,
  onEdit
}: PlaceItemProps) => {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [expandedState, setExpandedState] = useState(false)  // Local state for expand/collapse
  const { deletePlace } = useTrips()

  // Fetch photo from Google Places
  useEffect(() => {
    if (place.photo_url) {
      setPhotoUrl(place.photo_url)
    }
  }, [place.photo_url])

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (showMobileMenu) {
      const handleClickOutside = () => setShowMobileMenu(false)
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showMobileMenu])


  const endTime24 = place.end_time || calculateEndTime(place.start_time || '09:00', place.duration || 90)
  const startTime12 = formatTime12Hour(place.start_time || '09:00')
  const endTime12 = formatTime12Hour(endTime24)

  const handleDelete = () => {
    if (confirm(`Are you sure you want to remove "${place.name}" from your itinerary?`)) {
      deletePlace(place.id)
    }
  }

  return (
    <>
      {/* Mobile: Simple non-draggable card */}
      <div className="sm:hidden relative bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Mobile Menu Button */}
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMobileMenu(!showMobileMenu)
            }}
            className="p-1.5 bg-white/90 backdrop-blur rounded-lg shadow-sm"
          >
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </button>
          
          {/* Mobile Menu Dropdown */}
          {showMobileMenu && (
            <div className="absolute right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px]">
              <button
                onClick={() => {
                  onEdit(place)
                  setShowMobileMenu(false)
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                Edit
              </button>
              <button
                onClick={() => {
                  handleDelete()
                  setShowMobileMenu(false)
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                Delete
              </button>
            </div>
          )}
        </div>
        
        <div className="flex gap-3 p-3">
          {/* LEFT: Thumbnail - fixed square */}
          <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-slate-100">
            <PlacePhoto
              placeId={place.place_id}
              photoUrl={photoUrl || undefined}
              placeName={place.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* RIGHT: Text column */}
          <div className="flex-1 min-w-0 pr-8">
            {/* Title */}
            <h3 className="text-base font-semibold leading-tight break-words text-gray-900">
              {place.name}
            </h3>
            
            {/* Time and duration */}
            <div className="mt-0.5 text-sm text-slate-600 break-words">
              {startTime12}–{endTime12} • {place.duration || 90} min
            </div>
            
            {/* Address */}
            {place.address && (
              <div className="mt-0.5 text-sm text-slate-600 flex items-start gap-1">
                <MapPin className="mt-0.5 w-4 h-4 shrink-0" />
                <span className="break-words">{place.address}</span>
              </div>
            )}
            
            {/* Notes - collapsible */}
            {place.notes && (
              <>
                <p className={`mt-1 text-sm text-slate-700 break-words ${
                  !expandedState ? 'line-clamp-1' : ''
                }`}>
                  {place.notes}
                </p>
                
                {/* Show more/less button - show if text is long or contains line breaks */}
                {(place.notes.length > 80 || place.notes.includes('\n')) && (
                  <button
                    onClick={() => setExpandedState(!expandedState)}
                    className="mt-1 text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2 decoration-dotted"
                  >
                    {expandedState ? 'Show less' : 'Show more'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Desktop: Original draggable layout */}
      <DraggablePlace 
        place={place}
        className="hidden sm:block bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow overflow-hidden group"
        hideDefaultHandle={true}
        key={`${place.id}-${expandedState}`} // Force re-render when state changes
        renderDragHandle={(listeners, attributes) => (
            /* Left Rail - Fixed 40px width */
            <div className="w-10 flex-shrink-0 flex flex-col items-center pt-3 bg-transparent">
              {/* Numbered Stop Circle */}
              {sequenceNumber && (
                <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">{sequenceNumber}</span>
                </div>
              )}
              
              {/* Drag Handle - visible on hover */}
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
          {/* Main Content - Auto height container */}
          <div className="p-3 min-w-0">
            <div className="relative">
              {/* Hover Actions - positioned absolutely */}
              <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onEdit(place);
                  }}
                  className="p-1.5 bg-white rounded-lg shadow-md hover:bg-blue-50 transition-colors pointer-events-auto"
                  aria-label="Edit place"
                  type="button"
                >
                  <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleDelete();
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  className="p-1.5 bg-white rounded-lg shadow-md hover:bg-red-50 transition-colors pointer-events-auto"
                  aria-label="Delete place"
                  type="button"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>

              <div className="flex gap-3">
                {/* Photo */}
                <div className="flex-shrink-0">
                  <PlacePhoto
                    placeId={place.place_id}
                    photoUrl={photoUrl || undefined}
                    placeName={place.name}
                    className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-md"
                  />
                </div>

                {/* Content - Auto height with proper text wrapping */}
                <div className="flex-1 min-w-0">
                  {/* Title - wrap text properly */}
                  <h4 className="font-medium text-gray-900 text-sm pr-2 break-words">
                    {place.name}
                  </h4>
                  
                  {/* Time and duration - always visible */}
                  <div className="text-xs text-gray-500 mt-1 break-words">
                    {startTime12}–{endTime12} · {place.duration || 90} min
                  </div>
                  
                  {/* Address - wrap text properly */}
                  {place.address && (
                    <div className="text-xs text-gray-500 mt-1 break-words">
                      📍 {place.address}
                    </div>
                  )}
                  
                  {/* Notes - collapsible with show more/less */}
                  {place.notes && (
                    <>
                      <p className={`text-xs text-gray-600 mt-1 break-words whitespace-pre-wrap ${
                        !expandedState ? 'line-clamp-1' : ''
                      }`}>
                        {place.notes}
                      </p>
                      
                      {/* Show more/less button - show if text is long or contains line breaks */}
                      {(place.notes.length > 80 || place.notes.includes('\n')) && (
                        <div className="mt-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setExpandedState(!expandedState);
                            }}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                            }}
                            className="text-xs text-gray-500 hover:text-gray-700 inline-block relative z-[100] pointer-events-auto underline underline-offset-2 decoration-dotted"
                            style={{ 
                              touchAction: 'none',
                              userSelect: 'none',
                              position: 'relative',
                              zIndex: 100
                            }}
                          >
                            {expandedState ? 'Show less' : 'Show more'}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
        </div>
      </DraggablePlace>
    </>
  )
}

export function TripDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useUser()
  const { getTrip, getPlacesByTrip, loading, createPlace, updatePlace, bulkUpdatePlaces, deletePlace, deleteTrip, updateTrip } = useTrips()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [mapSelectedDay, setMapSelectedDay] = useState<number | undefined>(undefined)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [mobileView, setMobileView] = useState<'itinerary' | 'map'>('itinerary')
  const [showConflictModal, setShowConflictModal] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [collapsedDays, setCollapsedDays] = useState<Set<number>>(new Set())
  const [editingPlace, setEditingPlace] = useState<Place | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
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
  
  // Edit modal handlers
  const handleOpenEditModal = (place: Place) => {
    setEditingPlace(place)
    setShowEditModal(true)
  }

  const handleCloseEditModal = () => {
    setEditingPlace(null)
    setShowEditModal(false)
  }

  const handleSaveEdit = (placeId: string, updates: Partial<Place>) => {
    updatePlace(placeId, updates)
    handleCloseEditModal()
  }

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
      navigate('/dashboard') // Navigate to My Trips using React Router
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

  // Handlers for TripDetailTopChrome
  const handleBack = () => {
    navigate('/dashboard') // Navigate to My Trips
  }

  const handleAvatarClick = () => {
    setShowProfileMenu(!showProfileMenu)
  }

  const handleCreateNewItem = () => {
    if (!id || !newItemData.name.trim()) return

    const dayPlaces = places.filter(p => p.day === newItemData.day).sort((a, b) => a.order - b.order)
    
    // Find the correct chronological position based on start time
    let insertPosition = dayPlaces.length // Default to end
    const newStartTime = newItemData.start_time
    const newEndTime = calculateEndTime(newStartTime, newItemData.duration)
    
    for (let i = 0; i < dayPlaces.length; i++) {
      const currentPlace = dayPlaces[i]
      const currentStart = currentPlace.start_time || '09:00'
      
      // If new item's start time is before or equal to this place's start time
      if (timeToMinutes(newStartTime) <= timeToMinutes(currentStart)) {
        insertPosition = i
        break
      }
    }
    
    // Calculate time adjustments for all places that come after
    const timeAdjustments: Array<{ id: string; start_time: string; end_time: string }> = []
    
    // Check if we need to push subsequent items to avoid overlap
    let currentEndTime = newEndTime
    const BUFFER_MINUTES = 15 // 15-minute buffer between places
    
    // Adjust all places that come after the insertion point
    for (let i = insertPosition; i < dayPlaces.length; i++) {
      const place = dayPlaces[i]
      const placeStart = place.start_time || '09:00'
      const placeEnd = place.end_time || calculateEndTime(placeStart, place.duration || 90)
      
      // If current end time (with buffer) would overlap with this place
      const minStartTime = timeToMinutes(currentEndTime) + BUFFER_MINUTES
      const currentStartMinutes = timeToMinutes(placeStart)
      
      if (minStartTime > currentStartMinutes) {
        // This place needs to be pushed later
        const newStart = minutesToTime(minStartTime)
        const newEnd = calculateEndTime(newStart, place.duration || 90)
        
        timeAdjustments.push({
          id: place.id,
          start_time: newStart,
          end_time: newEnd
        })
        
        // Update current end time for next iteration
        currentEndTime = newEnd
      } else {
        // No overlap, but still track the end time in case later places need adjustment
        currentEndTime = placeEnd
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
      start_time: newStartTime,
      end_time: newEndTime,
      duration: newItemData.duration,
      notes: newItemData.notes.trim(),
      is_locked: false,
      is_reservation: false,
      ...(newItemData.place_id && { place_id: newItemData.place_id }),
      ...(newItemData.latitude && { latitude: newItemData.latitude }),
      ...(newItemData.longitude && { longitude: newItemData.longitude }),
      ...(newItemData.photo_url && { photo_url: newItemData.photo_url })
    }

    // First update orders of existing places to make room
    // We need to shift all places at or after the insert position
    const orderUpdates: Array<{ id: string; updates: Partial<Place> }> = []
    
    for (let i = insertPosition; i < dayPlaces.length; i++) {
      orderUpdates.push({
        id: dayPlaces[i].id,
        updates: { order: i + 1 }  // Shift everything after the insert position by 1
      })
    }
    
    // Add time adjustments to the updates
    timeAdjustments.forEach(adjustment => {
      const existingUpdate = orderUpdates.find(u => u.id === adjustment.id)
      if (existingUpdate) {
        existingUpdate.updates.start_time = adjustment.start_time
        existingUpdate.updates.end_time = adjustment.end_time
      } else {
        orderUpdates.push({
          id: adjustment.id,
          updates: {
            start_time: adjustment.start_time,
            end_time: adjustment.end_time
          }
        })
      }
    })
    
    // Apply all updates in bulk
    if (orderUpdates.length > 0) {
      bulkUpdatePlaces(orderUpdates)
    }
    
    // Now create the new place with the correct order
    createPlace(newPlace)
    
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

  // Separate accommodations from regular places
  const { accommodations, regularPlaces } = useMemo(() => {
    if (!places || places.length === 0) {
      return { accommodations: [], regularPlaces: [] }
    }
    
    const accoms: typeof places = []
    const regular: typeof places = []
    
    places.forEach(place => {
      // Check if it's an accommodation based on category or name/description
      const isAccommodation = place.category === 'hotel' || 
                            place.category === 'accommodation' ||
                            place.name.toLowerCase().includes('hotel') ||
                            place.name.toLowerCase().includes('airbnb') ||
                            place.name.toLowerCase().includes('hostel') ||
                            ((place as any).description?.toLowerCase().includes('check-in') && 
                             (place as any).description?.toLowerCase().includes('check-out'))
      
      if (isAccommodation) {
        accoms.push(place)
      } else {
        regular.push(place)
      }
    })
    
    return { accommodations: accoms, regularPlaces: regular }
  }, [places])

  // Group regular places by day - memoized to prevent unnecessary recalculations
  // MUST be before any early returns to maintain hooks order
  const placesByDay = useMemo(() => {
    if (!regularPlaces || regularPlaces.length === 0) {
      return {} as Record<number, typeof places>
    }
    return regularPlaces.reduce((acc, place) => {
      if (!acc[place.day]) {
        acc[place.day] = []
      }
      acc[place.day].push(place)
      return acc
    }, {} as Record<number, typeof places>)
  }, [regularPlaces])

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
      {/* Trip Detail Top Chrome */}
      <TripDetailTopChrome
        title={trip.title}
        onBack={handleBack}
        onAvatarClick={handleAvatarClick}
        userName={user?.full_name}
      />
      
      {/* Profile Menu Dropdown */}
      {showProfileMenu && (
        <div 
          className="fixed top-16 right-4 z-50"
          style={{ paddingRight: 'max(16px, env(safe-area-inset-right))' }}
        >
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 py-1 w-48">
            <button
              onClick={() => {
                navigate('/profile')
                setShowProfileMenu(false)
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Profile Settings
            </button>
            <button
              onClick={() => {
                navigate('/api-status')
                setShowProfileMenu(false)
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              API Status
            </button>
            <button
              onClick={() => {
                // Sign out will need to be handled properly
                // For now, just navigate to login
                navigate('/login')
                setShowProfileMenu(false)
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
      
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
          
          {/* Delete Button */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Delete trip"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Content - Timeline/Map */}
        <div>
          <div className="card animate-slide-up">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-lg sm:text-xl font-semibold">Your Itinerary</h2>
                {/* Add New Place Button - Next to title */}
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

            {/* Mobile: Single view with toggle */}
            <div className="sm:hidden">
              {/* View Toggle Buttons - Centered at bottom */}
              <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex rounded-full bg-white border border-gray-200 shadow-lg overflow-hidden" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
                <button
                  onClick={() => setMobileView('itinerary')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    mobileView === 'itinerary' 
                      ? 'bg-slate-900 text-white' 
                      : 'text-slate-700 hover:bg-gray-50'
                  }`}
                  role="tab"
                  aria-selected={mobileView === 'itinerary'}
                  aria-label="View itinerary"
                >
                  Itinerary
                </button>
                <button
                  onClick={() => setMobileView('map')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    mobileView === 'map' 
                      ? 'bg-slate-900 text-white' 
                      : 'text-slate-700 hover:bg-gray-50'
                  }`}
                  role="tab"
                  aria-selected={mobileView === 'map'}
                  aria-label="View map"
                >
                  Map
                </button>
              </div>

              {/* Conditional rendering based on selected view */}
              {mobileView === 'itinerary' ? (
                /* Mobile Itinerary View */
                <div className="bg-gray-50 rounded-xl p-4 overflow-y-auto" style={{ minHeight: 'calc(100vh - 200px)' }}>
                  {/* Accommodation Section */}
                  {accommodations.length > 0 && (
                    <AccommodationSection 
                      accommodations={accommodations}
                      tripDuration={days.length}
                    />
                  )}
                  
                  {days.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-sm">No places added to this trip yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 pb-20">
                      {days.map((day) => {
                        const isCollapsed = collapsedDays.has(day)
                        const dayPlaces = placesByDay[day]?.sort((a, b) => a.order - b.order) || []
                        
                        return (
                          <div key={day} className="relative">
                            {/* Day Header - Mobile compact version */}
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
                              <div className="bg-slate-50 rounded-xl p-3 hover:bg-slate-100 transition-colors duration-200">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-base font-semibold text-gray-900">
                                      Day {day}
                                      {trip?.start_date && (
                                        <span className="ml-2 font-normal text-sm text-slate-600">
                                          {formatDate(getDayDate(trip.start_date, day), 'EEE, MMM d')} • {dayPlaces.length} {dayPlaces.length === 1 ? 'place' : 'places'}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className={`ml-2 transform transition-transform duration-200 flex-shrink-0 ${isCollapsed ? '' : 'rotate-180'}`}>
                                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Collapsible Day Content */}
                            <div 
                              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                                isCollapsed ? 'max-h-0' : 'max-h-[5000px]'
                              }`}
                              id={`day-${day}-content`}
                              aria-hidden={isCollapsed}
                            >
                              <div className="pt-3 space-y-2">
                                {dayPlaces.map((place, placeIndex) => {
                                  const daySequenceNumber = placeIndex + 1
                                  const placeId = place.id; // Capture the ID to avoid closure issues
                                  
                                  return (
                                    <div 
                                      key={placeId}
                                      className="animate-fade-in"
                                      style={{ animationDelay: `${placeIndex * 0.1}s` }}
                                    >
                                      <PlaceItem
                                        place={place}
                                        sequenceNumber={daySequenceNumber}
                                        onEdit={handleOpenEditModal}
                                      />
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* Mobile Map View */
                <div className="rounded-xl overflow-hidden border border-gray-200 relative" style={{ height: 'calc(100vh - 200px)' }}>
                  {/* Day Filter Dropdown */}
                  {days.length > 1 && (
                    <div className="absolute top-3 right-3" style={{ zIndex: 500 }}>
                      <select
                        value={mapSelectedDay === undefined ? 'all' : mapSelectedDay.toString()}
                        onChange={(e) => {
                          const value = e.target.value
                          setMapSelectedDay(value === 'all' ? undefined : parseInt(value))
                        }}
                        className="px-3 py-1.5 text-sm bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="all">All Days</option>
                        {days.map(day => (
                          <option key={day} value={day}>Day {day}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <TripMap
                    places={places}
                    selectedDay={mapSelectedDay}
                    className="h-full"
                  />
                </div>
              )}
            </div>

            {/* Desktop: Side-by-side layout */}
            <div className="hidden sm:flex sm:flex-col lg:grid lg:grid-cols-2 gap-6 min-h-[60vh] lg:h-[70vh] lg:min-h-[500px] lg:max-h-[900px]">
                {/* Itinerary Panel */}
                <div className="bg-gray-50 rounded-xl p-4 overflow-y-auto h-[40vh] min-h-[300px] lg:h-auto">
                  {/* Accommodation Section */}
                  {accommodations.length > 0 && (
                    <AccommodationSection 
                      accommodations={accommodations}
                      tripDuration={days.length}
                    />
                  )}
                  
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
                            {/* Day Header - Compact on mobile */}
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
                              {/* Mobile: Single-line compact header */}
                              <div className="sm:hidden bg-slate-50 rounded-xl p-3 hover:bg-slate-100 transition-colors duration-200">
                                <div className="flex items-center justify-between">
                                  {/* Left: Combined day info */}
                                  <div className="flex items-center gap-2 text-lg font-semibold">
                                    <span>Day {day}</span>
                                    {trip?.start_date && (
                                      <>
                                        <span className="text-slate-400">•</span>
                                        <span className="text-base font-normal text-slate-600">
                                          {formatDate(getDayDate(trip.start_date, day), 'EEE, MMM d')}
                                        </span>
                                      </>
                                    )}
                                    <span className="text-slate-400">•</span>
                                    <span className="text-base font-normal text-slate-600">
                                      {dayPlaces.length} {dayPlaces.length === 1 ? 'place' : 'places'}
                                    </span>
                                  </div>
                                  
                                  {/* Right: Collapse indicator */}
                                  <div className={`transform transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`}>
                                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </div>
                                </div>
                              </div>

                              {/* Desktop: Original two-line header */}
                              <div className="hidden sm:block bg-gray-100 rounded-lg p-3 hover:bg-gray-200 transition-colors duration-200">
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
                                    const placeId = place.id; // Capture the ID to avoid closure issues
                                    
                                    return (
                                      <div 
                                        key={placeId}
                                        className="animate-fade-in"
                                        style={{ animationDelay: `${placeIndex * 0.1}s` }}
                                      >
                                        <PlaceItem
                                          place={place}
                                          sequenceNumber={daySequenceNumber}
                                          onEdit={handleOpenEditModal}
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
                  {/* Day Filter - Dropdown on mobile, pills on desktop */}
                  {days.length > 1 && (
                    <>
                      {/* Mobile: Dropdown */}
                      <div className="absolute top-3 right-3 sm:hidden" style={{ zIndex: 500 }}>
                        <select
                          value={mapSelectedDay === undefined ? 'all' : mapSelectedDay.toString()}
                          onChange={(e) => {
                            const value = e.target.value
                            setMapSelectedDay(value === 'all' ? undefined : parseInt(value))
                          }}
                          className="px-3 py-1.5 text-sm bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="all">All Days</option>
                          {days.map(day => (
                            <option key={day} value={day}>Day {day}</option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Desktop: Pills positioned to avoid zoom controls */}
                      <div className="hidden sm:block absolute top-3 right-3" style={{ zIndex: 500 }}>
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
                    </>
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
      
      {/* Edit Place Modal */}
      <EditPlaceModal
        place={editingPlace}
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        onSave={handleSaveEdit}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">Delete Trip?</h3>
            <p className="text-gray-600 mb-4">This action cannot be undone. All trip data and places will be permanently deleted.</p>
            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={handleDeleteTrip}
                className="bg-red-600 hover:bg-red-700 flex-1"
              >
                Delete
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </DragDropProvider>
  )
}