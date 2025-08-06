import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Users, Clock, Map, List, Edit2, Trash2, Image, GripVertical, Check, X } from 'lucide-react'
import { useTrips } from '../contexts/TripContext'
import { formatDate } from '../utils/date'
import { TripMap } from '../components/maps/TripMap'
import { TripAssistant } from '../components/ai/TripAssistant'
import { Button } from '../components/ui/Button'
import { PlaceAutocomplete } from '../components/forms/PlaceAutocomplete'
import { googlePlacesService, type PlaceDetailsResponse } from '../services/googlePlaces'
import { isGoogleMapsConfigured } from '../config/api'
import type { Place } from '../types'

// Helper function to calculate end time from start time and duration
function calculateEndTime(startTime: string, duration: number): string {
  const [hours, minutes] = startTime.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes + duration
  const endHours = Math.floor(totalMinutes / 60) % 24
  const endMinutes = totalMinutes % 60
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
}


interface PlaceItemProps {
  place: Place
  onUpdate: (id: string, updates: Partial<Place>) => void
  onDelete: (id: string) => void
  onDragStart: (placeId: string) => void
  onDragEnd: () => void
  onDrop: (targetId: string) => void
  isDragging: boolean
  tripDestination?: string
  tripDestinationCoords?: { lat: number; lng: number }
}

function PlaceItem({ place, onUpdate, onDelete, onDragStart, onDragEnd, onDrop, isDragging, tripDestination, tripDestinationCoords }: PlaceItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    name: place.name,
    address: place.address || '',
    start_time: place.start_time || '',
    duration: place.duration || 90
  })
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  // Update edit data when place changes
  useEffect(() => {
    setEditData({
      name: place.name,
      address: place.address || '',
      start_time: place.start_time || '',
      duration: place.duration || 90
    })
  }, [place.name, place.address, place.start_time, place.duration])

  // Fetch photo from Google Places
  useEffect(() => {
    const fetchPhoto = async () => {
      if (place.photo_url) {
        setPhotoUrl(place.photo_url)
        return
      }

      if (!isGoogleMapsConfigured() || !place.place_id) return

      try {
        const details = await googlePlacesService.getPlaceDetails(place.place_id)
        if (details.photos && details.photos.length > 0) {
          const photoReference = details.photos[0].photo_reference
          const url = googlePlacesService.getPhotoUrl(photoReference)
          setPhotoUrl(url)
          // Update the place with the photo URL
          onUpdate(place.id, { photo_url: url })
        }
      } catch (error) {
        console.error('Failed to fetch place photo:', error)
      }
    }

    fetchPhoto()
  }, [place.place_id, place.photo_url, onUpdate, place.id])

  const handlePlaceSelect = (placeDetails: PlaceDetailsResponse) => {
    // Auto-populate fields from Google Places data
    setEditData(prev => ({
      ...prev,
      name: placeDetails.name,
      address: placeDetails.formatted_address
    }))
    
    // Also update additional place details if available
    const updates: Partial<Place> = {
      place_id: placeDetails.place_id,
      latitude: placeDetails.geometry.location.lat,
      longitude: placeDetails.geometry.location.lng,
      website: placeDetails.website,
      phone: placeDetails.formatted_phone_number
    }
    
    // Determine category from place types
    if (placeDetails.types.some(type => ['restaurant', 'food', 'meal_takeaway', 'cafe', 'bar'].includes(type))) {
      updates.category = 'restaurant'
    } else if (placeDetails.types.some(type => ['lodging', 'hotel'].includes(type))) {
      updates.category = 'hotel'  
    } else {
      updates.category = 'attraction'
    }
    
    // Add notes with rating and reviews if available
    let notes = place.notes || ''
    if (placeDetails.rating) {
      notes = `⭐ ${placeDetails.rating}/5 rating\n\n${notes}`.trim()
    }
    if (placeDetails.reviews && placeDetails.reviews.length > 0) {
      const topReview = placeDetails.reviews[0]
      notes = `${notes}\n\n💬 "${topReview.text}" - ${topReview.author_name}`.trim()
    }
    if (notes !== place.notes) {
      updates.notes = notes
    }
    
    // Update photo if available
    if (placeDetails.photos && placeDetails.photos.length > 0) {
      updates.photo_url = placeDetails.photos[0].photo_reference
    }
    
    // Apply updates immediately (not just to edit form)
    onUpdate(place.id, updates)
  }

  const handleSaveEdit = () => {
    const endTime = calculateEndTime(editData.start_time, editData.duration)
    onUpdate(place.id, {
      name: editData.name.trim(),
      address: editData.address.trim(),
      start_time: editData.start_time,
      duration: editData.duration,
      end_time: endTime
    })
    setIsEditing(false)
  }

  const endTime = place.end_time || calculateEndTime(place.start_time || '09:00', place.duration || 90)

  return (
    <div
      className={`bg-gray-50 rounded-xl p-3 sm:p-4 animate-scale-in transition-all hover:bg-gray-100 ${
        isDragging ? 'opacity-50' : ''
      }`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        onDrop(place.id)
      }}
    >
      <div className="flex gap-3">
        {/* Drag Handle */}
        <div 
          className="flex items-center cursor-move text-gray-400 hover:text-gray-600"
          draggable
          onDragStart={() => onDragStart(place.id)}
          onDragEnd={onDragEnd}
        >
          <GripVertical className="w-5 h-5" />
        </div>

        {/* Photo */}
        {photoUrl && (
          <div className="flex-shrink-0">
            <img
              src={photoUrl}
              alt={place.name}
              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg"
            />
          </div>
        )}
        {!photoUrl && place.place_id && (
          <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-lg flex items-center justify-center">
            <Image className="w-6 h-6 text-gray-400" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-medium text-gray-900 text-sm sm:text-base pr-2">{place.name}</h4>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(place.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Edit Form */}
          {isEditing ? (
            <div className="space-y-3 mb-3">
              <div className="space-y-2">
                <label className="text-xs text-gray-500 block">Place Name:</label>
                <PlaceAutocomplete
                  value={editData.name}
                  onChange={(name) => setEditData(prev => ({ ...prev, name }))}
                  onPlaceSelect={handlePlaceSelect}
                  destination={tripDestination}
                  destinationCoords={tripDestinationCoords}
                  placeholder="Search for places..."
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs text-gray-500 block">Address:</label>
                <input
                  type="text"
                  value={editData.address}
                  onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                  className="text-sm border border-gray-300 rounded px-3 py-2 w-full"
                  placeholder="Enter address"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">Start:</label>
                  <input
                    type="time"
                    value={editData.start_time}
                    onChange={(e) => setEditData({ ...editData, start_time: e.target.value })}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">Duration:</label>
                  <input
                    type="number"
                    value={editData.duration}
                    onChange={(e) => setEditData({ ...editData, duration: parseInt(e.target.value) || 90 })}
                    className="text-sm border border-gray-300 rounded px-2 py-1 w-16"
                    min="15"
                    step="15"
                  />
                  <span className="text-xs text-gray-500">min</span>
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center text-xs sm:text-sm text-gray-600 mb-2 gap-3">
              <div className="flex items-center">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                {place.start_time || '09:00'} - {endTime}
              </div>
              <span className="text-gray-400">
                ({place.duration || 90} min)
              </span>
            </div>
          )}

          {place.address && (
            <p className="text-xs sm:text-sm text-gray-600 mb-2 flex items-start">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 mt-0.5 flex-shrink-0" />
              <span className="break-words">{place.address}</span>
            </p>
          )}

          {place.notes && (
            <p className="text-xs sm:text-sm text-gray-600 break-words">{place.notes}</p>
          )}

          <div className="flex items-center justify-between mt-3">
            <span className={`text-xs px-2 py-1 rounded-full capitalize ${
              place.category === 'restaurant' ? 'bg-orange-100 text-orange-800' :
              place.category === 'attraction' ? 'bg-blue-100 text-blue-800' :
              place.category === 'hotel' ? 'bg-purple-100 text-purple-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {place.category}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function TripDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getTrip, getPlacesByTrip, loading, createPlace, updatePlace, deletePlace, deleteTrip, updateTrip } = useTrips()
  const [selectedDay, setSelectedDay] = useState<number | undefined>(undefined)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  
  const trip = id ? getTrip(id) : undefined
  const places = id ? getPlacesByTrip(id) : []
  
  console.log('🔍 TripDetail: Component rendered with trip ID:', id)
  console.log('🔍 TripDetail: Trip found:', !!trip)
  console.log('🔍 TripDetail: Places found:', places.length)

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

  const handleDragStart = (placeId: string) => {
    setDraggedItem(placeId)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
  }

  const handleDrop = (targetId: string) => {
    if (!draggedItem || draggedItem === targetId) return
    
    const draggedPlace = places.find(p => p.id === draggedItem)
    const targetPlace = places.find(p => p.id === targetId)
    
    if (draggedPlace && targetPlace) {
      // Simple swap
      updatePlace(draggedItem, { order: targetPlace.order })
      updatePlace(targetId, { order: draggedPlace.order })
    }
    
    setDraggedItem(null)
  }


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

  // Group places by day
  const placesByDay = places.reduce((acc, place) => {
    if (!acc[place.day]) {
      acc[place.day] = []
    }
    acc[place.day].push(place)
    return acc
  }, {} as Record<number, typeof places>)

  const days = Object.keys(placesByDay).map(Number).sort((a, b) => a - b)

  return (
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
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{trip.title}</h1>
                <button
                  onClick={handleStartTitleEdit}
                  className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all"
                  title="Edit trip title"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-6 text-gray-600">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span className="text-sm sm:text-base">{trip.destination}</span>
              </div>
              {trip.start_date && (
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span className="text-sm sm:text-base">
                    {formatDate(trip.start_date)} - {trip.end_date ? formatDate(trip.end_date) : 'TBD'}
                  </span>
                </div>
              )}
              <div className="flex items-center">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span className="text-sm sm:text-base">
                  {trip.group_size} {trip.group_size === 1 ? 'person' : 'people'}
                  {trip.has_kids && ' (with kids)'}
                </span>
              </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Main Content - Timeline/Map */}
        <div className="lg:col-span-2">
          <div className="card animate-slide-up">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-lg sm:text-xl font-semibold">Your Itinerary</h2>
              
              {/* View Toggle */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-xl p-1 self-center sm:self-auto">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">List</span>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    viewMode === 'map'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Map className="w-4 h-4" />
                  <span className="hidden sm:inline">Map</span>
                </button>
              </div>
            </div>

            {/* Day Filter */}
            {days.length > 1 && (
              <div className="mb-6">
                <div className="flex flex-wrap gap-2 mobile-scroll-horizontal">
                  <button
                    onClick={() => setSelectedDay(undefined)}
                    className={`px-3 py-1 text-xs sm:text-sm rounded-full transition-colors whitespace-nowrap ${
                      selectedDay === undefined
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    All Days
                  </button>
                  {days.map(day => (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`px-3 py-1 text-xs sm:text-sm rounded-full transition-colors whitespace-nowrap ${
                        selectedDay === day
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Day {day}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Content */}
            {viewMode === 'map' ? (
              <div className="h-[600px]">
                <TripMap
                  places={places}
                  selectedDay={selectedDay}
                  className="h-full"
                />
              </div>
            ) : (
              /* List View */
              days.length === 0 ? (
                <div className="text-center py-8 animate-fade-in">
                  <p className="text-gray-500 text-sm sm:text-base">No places added to this trip yet.</p>
                </div>
              ) : (
                <div className="space-y-6 sm:space-y-8">
                  {(selectedDay ? [selectedDay] : days).map((day, dayIndex) => (
                    <div key={day} className="border-l-4 border-primary-200 pl-4 sm:pl-6 relative animate-slide-up" style={{animationDelay: `${dayIndex * 0.1}s`}}>
                      <div className="absolute -left-2 sm:-left-3 top-0 w-4 h-4 sm:w-6 sm:h-6 bg-primary-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-medium">{day}</span>
                      </div>
                      
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                        Day {day}
                      </h3>
                      
                      <div className="space-y-3 sm:space-y-4">
                        {placesByDay[day]?.sort((a, b) => a.order - b.order).map((place) => (
                          <PlaceItem
                            key={place.id}
                            place={place}
                            onUpdate={updatePlace}
                            onDelete={deletePlace}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            onDrop={handleDrop}
                            isDragging={draggedItem === place.id}
                            tripDestination={trip?.destination}
                            tripDestinationCoords={trip?.latitude && trip?.longitude ? { 
                              lat: trip.latitude, 
                              lng: trip.longitude 
                            } : undefined}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>

        {/* Sidebar - Trip Details */}
        <div className="space-y-4 sm:space-y-6">
          <div className="card animate-slide-up" style={{animationDelay: '0.2s'}}>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Trip Details</h3>
            <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
              <div>
                <span className="font-medium text-gray-700">Type:</span>
                <span className="ml-2 capitalize">{trip.trip_type}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Pace:</span>
                <span className="ml-2 capitalize">{trip.pace}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Public:</span>
                <span className="ml-2">{trip.is_public ? 'Yes' : 'No'}</span>
              </div>
            </div>
            
            {trip.preferences.length > 0 && (
              <div className="mt-3 sm:mt-4">
                <span className="font-medium text-gray-700 text-xs sm:text-sm">Interests:</span>
                <div className="flex flex-wrap gap-1 sm:gap-2 mt-2">
                  {trip.preferences.map(pref => (
                    <span key={pref} className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
                      {pref}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="card animate-slide-up" style={{animationDelay: '0.3s'}}>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Quick Stats</h3>
            <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Days:</span>
                <span className="font-medium">{days.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Places:</span>
                <span className="font-medium">{places.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Restaurants:</span>
                <span className="font-medium">{places.filter(p => p.category === 'restaurant').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Attractions:</span>
                <span className="font-medium">{places.filter(p => p.category === 'attraction').length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Assistant */}
      <TripAssistant 
        trip={trip} 
        places={places}
        onCreatePlace={createPlace}
        onUpdatePlace={updatePlace}
        onDeletePlace={deletePlace}
      />
    </div>
  )
}