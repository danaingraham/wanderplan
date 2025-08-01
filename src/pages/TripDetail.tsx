import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Calendar, MapPin, Users, Clock, Map, List } from 'lucide-react'
import { useTrips } from '../contexts/TripContext'
import { formatDate, formatTimeOnly } from '../utils/date'
import { TripMap } from '../components/maps/TripMap'
import { TripAssistant } from '../components/ai/TripAssistant'

export function TripDetail() {
  const { id } = useParams<{ id: string }>()
  const { getTrip, getPlacesByTrip, loading } = useTrips()
  const [selectedDay, setSelectedDay] = useState<number | undefined>(undefined)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  
  const trip = id ? getTrip(id) : undefined
  const places = id ? getPlacesByTrip(id) : []

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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-4">{trip.title}</h1>
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
                        {placesByDay[day]?.map((place, placeIndex) => (
                          <div key={place.id} className="bg-gray-50 rounded-xl p-3 sm:p-4 animate-scale-in" style={{animationDelay: `${(dayIndex * 3 + placeIndex) * 0.05}s`}}>
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-gray-900 text-sm sm:text-base pr-2">{place.name}</h4>
                              {place.start_time && (
                                <div className="flex items-center text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                  {formatTimeOnly(new Date(`2000-01-01T${place.start_time}`))}
                                </div>
                              )}
                            </div>
                            
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
                              
                              {place.duration && (
                                <span className="text-xs text-gray-500">
                                  {Math.floor(place.duration / 60)}h {place.duration % 60}m
                                </span>
                              )}
                            </div>
                          </div>
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
      <TripAssistant trip={trip} places={places} />
    </div>
  )
}