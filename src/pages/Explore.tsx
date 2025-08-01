
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Filter, Globe, List } from 'lucide-react'
import { ExploreMap } from '../components/maps/ExploreMap'
import { useTrips } from '../contexts/TripContext'
import { Input } from '../components/ui/Input'
import { formatDate } from '../utils/date'
import type { Trip } from '../types'

export function Explore() {
  const navigate = useNavigate()
  const { trips } = useTrips()
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTripType, setSelectedTripType] = useState<string>('')

  // Filter public trips
  const publicTrips = trips.filter(trip => trip.is_public)
  
  // Apply search and filter
  const filteredTrips = publicTrips.filter(trip => {
    const matchesSearch = !searchQuery || 
      trip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.destination.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = !selectedTripType || trip.trip_type === selectedTripType
    
    return matchesSearch && matchesType
  })

  const handleTripSelect = (trip: Trip) => {
    navigate(`/trip/${trip.id}`)
  }

  const tripTypeOptions = [
    { value: '', label: 'All Types' },
    { value: 'solo', label: 'Solo Adventure' },
    { value: 'romantic', label: 'Romantic Getaway' },
    { value: 'family', label: 'Family Trip' },
    { value: 'friends', label: 'Friends Trip' },
    { value: 'business', label: 'Business Travel' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Explore Trips</h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Discover amazing trips created by our community and get inspired for your next adventure.
        </p>
      </div>

      {/* Controls */}
      <div className="card mb-6 sm:mb-8 animate-slide-up">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-1">
            {/* Search */}
            <div className="flex-1 max-w-sm">
              <Input
                placeholder="Search destinations or trip titles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={selectedTripType}
                onChange={(e) => setSelectedTripType(e.target.value)}
                className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full sm:w-auto"
              >
                {tripTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-xl p-1 self-center sm:self-auto">
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                viewMode === 'map'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">Map</span>
            </button>
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
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'map' ? (
        <div className="h-[600px]">
          <ExploreMap onTripSelect={handleTripSelect} className="h-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredTrips.length === 0 ? (
            <div className="col-span-full text-center py-12 animate-fade-in">
              <div className="animate-float">
                <Globe className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No trips found</h3>
              <p className="text-gray-500 text-sm sm:text-base px-4">
                {publicTrips.length === 0
                  ? "No public trips have been shared yet. Be the first to share your adventure!"
                  : "Try adjusting your search or filter criteria."}
              </p>
            </div>
          ) : (
            filteredTrips.map((trip, index) => (
              <div
                key={trip.id}
                onClick={() => handleTripSelect(trip)}
                className="card card-hover cursor-pointer group animate-slide-up"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors text-sm sm:text-base">
                    {trip.title}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded-full capitalize whitespace-nowrap ml-2 ${
                    trip.trip_type === 'romantic' ? 'bg-red-100 text-red-800' :
                    trip.trip_type === 'family' ? 'bg-green-100 text-green-800' :
                    trip.trip_type === 'friends' ? 'bg-blue-100 text-blue-800' :
                    trip.trip_type === 'business' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {trip.trip_type}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-4 text-sm sm:text-base">{trip.destination}</p>
                
                {trip.start_date && (
                  <p className="text-sm text-gray-500 mb-4">
                    📅 {formatDate(trip.start_date)}
                    {trip.end_date && ` - ${formatDate(trip.end_date)}`}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
                  <span>👥 {trip.group_size} {trip.group_size === 1 ? 'person' : 'people'}</span>
                  <span className="capitalize">{trip.pace} pace</span>
                </div>
                
                {trip.preferences.length > 0 && (
                  <div className="mt-3 sm:mt-4 flex flex-wrap gap-1 sm:gap-2">
                    {trip.preferences.slice(0, 3).map(pref => (
                      <span
                        key={pref}
                        className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full"
                      >
                        {pref}
                      </span>
                    ))}
                    {trip.preferences.length > 3 && (
                      <span className="text-xs text-gray-400">
                        +{trip.preferences.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}