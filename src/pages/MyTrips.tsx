import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Calendar, Users, Grid, List, Clock } from 'lucide-react'
import { useTrips } from '../contexts/TripContext'
import { formatDate, isDateInFuture, isDateInPast, isDateToday } from '../utils/date'
import { cn } from '../utils/cn'
import { userActivityService } from '../services/userActivity'

type ViewMode = 'grid' | 'list'

export function MyTrips() {
  const { trips, loading } = useTrips()
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  // Track page view
  useEffect(() => {
    userActivityService.trackActivity('trip_view', 'my-trips', {
      tripTitle: 'My Trips',
      destination: 'All Trips'
    })
  }, [])

  // Sort trips by updated date (most recent first)
  const sortedTrips = [...trips].sort((a, b) => {
    // Sort by start date if available, otherwise by updated date
    if (a.start_date && b.start_date) {
      return new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    }
    return new Date(b.updated_date).getTime() - new Date(a.updated_date).getTime()
  })

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="skeleton h-8 w-32 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card">
                <div className="skeleton h-6 w-48 mb-4"></div>
                <div className="space-y-2">
                  <div className="skeleton-text w-full"></div>
                  <div className="skeleton-text w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">All Trips</h1>
        <p className="text-gray-600">Manage and organize your travel itineraries</p>
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-end mb-6">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              "p-1.5 rounded-md transition-all",
              viewMode === 'grid'
                ? "bg-white text-primary-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
            aria-label="Grid view"
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "p-1.5 rounded-md transition-all",
              viewMode === 'list'
                ? "bg-white text-primary-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Trips Display */}
      {sortedTrips.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No trips yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start planning your next adventure with AI-powered trip generation
            </p>
            <Link
              to="/create"
              className="inline-flex items-center px-6 py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
            >
              Create Your First Trip
            </Link>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedTrips.map((trip, index) => {
            const isToday = trip.start_date && isDateToday(trip.start_date)
            const isUpcoming = trip.start_date && !isToday && isDateInFuture(trip.start_date)
            const isPast = trip.start_date && !isToday && isDateInPast(trip.start_date)
            
            return (
              <Link
                key={trip.id}
                to={`/trip/${trip.id}`}
                className="card card-hover group animate-slide-up"
                style={{animationDelay: `${Math.min(index * 0.05, 0.3)}s`}}
              >
                {/* Status Badge */}
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">
                    {trip.title}
                  </h3>
                  {isToday && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex-shrink-0">
                      Today
                    </span>
                  )}
                  {isUpcoming && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex-shrink-0">
                      Upcoming
                    </span>
                  )}
                  {isPast && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full flex-shrink-0">
                      Past
                    </span>
                  )}
                  {!trip.start_date && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full flex-shrink-0">
                      Draft
                    </span>
                  )}
                </div>

                {/* Trip Details */}
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{trip.destination}</span>
                  </div>
                  {trip.start_date && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                      {formatDate(trip.start_date)}
                    </div>
                  )}
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                    {trip.group_size} {trip.group_size === 1 ? 'person' : 'people'}
                  </div>
                </div>

                {/* Tags */}
                {trip.preferences.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1">
                    {trip.preferences.slice(0, 3).map(pref => (
                      <span
                        key={pref}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
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
              </Link>
            )
          })}
        </div>
      ) : (
        // List View
        <div className="space-y-3">
          {sortedTrips.map((trip) => {
            const isToday = trip.start_date && isDateToday(trip.start_date)
            const isUpcoming = trip.start_date && !isToday && isDateInFuture(trip.start_date)
            const isPast = trip.start_date && !isToday && isDateInPast(trip.start_date)
            
            return (
              <Link
                key={trip.id}
                to={`/trip/${trip.id}`}
                className="block bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md hover:border-primary-200 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {trip.title}
                      </h3>
                      {isToday && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Today
                        </span>
                      )}
                      {isUpcoming && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Upcoming
                        </span>
                      )}
                      {isPast && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          Past
                        </span>
                      )}
                      {!trip.start_date && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                          Draft
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {trip.destination}
                      </div>
                      {trip.start_date && (
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(trip.start_date)}
                        </div>
                      )}
                      <div className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {trip.group_size}
                      </div>
                      <div className="flex items-center text-gray-400">
                        <Clock className="h-3 w-3 mr-1" />
                        Updated {formatDate(trip.updated_date)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

    </div>
  )
}