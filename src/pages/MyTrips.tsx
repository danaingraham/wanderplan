import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Grid, List } from 'lucide-react'
import { useTrips } from '../contexts/TripContext'
import { formatDate, isDateInFuture, isDateInPast, isDateToday, getDaysBetween } from '../utils/date'
import { cn } from '../utils/cn'
import { userActivityService } from '../services/userActivity'
import { DestinationCard } from '../components/cards/DestinationCard'
import { CardSkeleton } from '../components/cards/CardSkeleton'

type ViewMode = 'grid' | 'list'

export function MyTrips() {
  const { trips, places, loading } = useTrips()
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Trips</h1>
          <p className="text-gray-600">Manage and organize your travel itineraries</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <CardSkeleton key={i} size="medium" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Trips</h1>
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
          {sortedTrips.map((trip) => {
            const isToday = trip.start_date && isDateToday(trip.start_date)
            const isUpcoming = trip.start_date && !isToday && isDateInFuture(trip.start_date)
            const isPast = trip.start_date && !isToday && isDateInPast(trip.start_date)
            
            // Calculate trip duration
            const duration = trip.start_date && trip.end_date 
              ? getDaysBetween(trip.start_date, trip.end_date) + 1
              : 0
            
            // Determine status
            let status: 'upcoming' | 'past' | 'today' | 'draft' | undefined
            if (isToday) status = 'today'
            else if (isUpcoming) status = 'upcoming'
            else if (isPast) status = 'past'
            else if (!trip.start_date) status = 'draft'
            
            // Count places for this trip
            const tripPlaces = places.filter(p => p.trip_id === trip.id).length
            
            // Format metadata
            const metadata = trip.trip_type ? 
              `${trip.trip_type.charAt(0).toUpperCase() + trip.trip_type.slice(1)} • ${duration || 7} days` : 
              `${duration || 7} days`
            
            return (
              <DestinationCard
                key={trip.id}
                destination={trip.title}
                metadata={metadata}
                href={`/trip/${trip.id}`}
                status={status}
                size="medium"
                infoCards={[
                  { type: 'places', value: tripPlaces },
                  ...(trip.start_date ? [{ type: 'season' as const, value: formatDate(trip.start_date) }] : []),
                  ...(duration > 0 ? [{ type: 'duration' as const, value: duration }] : [])
                ]}
              />
            )
          })}
        </div>
      ) : (
        // List View with cleaner design
        <div className="space-y-3">
          {sortedTrips.map((trip) => {
            const isToday = trip.start_date && isDateToday(trip.start_date)
            const isUpcoming = trip.start_date && !isToday && isDateInFuture(trip.start_date)
            const isPast = trip.start_date && !isToday && isDateInPast(trip.start_date)
            
            const duration = trip.start_date && trip.end_date 
              ? getDaysBetween(trip.start_date, trip.end_date) + 1
              : 0
            
            const tripPlaces = places.filter(p => p.trip_id === trip.id).length
            
            return (
              <Link
                key={trip.id}
                to={`/trip/${trip.id}`}
                className="block bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-primary-200 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-gray-900 truncate">
                        {trip.title.toUpperCase()}
                      </h3>
                      {isToday && (
                        <span className="text-xs bg-blue-500/90 text-white px-2 py-1 rounded-full">
                          Today
                        </span>
                      )}
                      {isUpcoming && (
                        <span className="text-xs bg-green-500/90 text-white px-2 py-1 rounded-full">
                          Upcoming
                        </span>
                      )}
                      {isPast && (
                        <span className="text-xs bg-gray-400/90 text-white px-2 py-1 rounded-full">
                          Past
                        </span>
                      )}
                      {!trip.start_date && (
                        <span className="text-xs bg-yellow-500/90 text-white px-2 py-1 rounded-full">
                          Draft
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1.5 text-gray-400" />
                        <span className="font-medium">{trip.destination}</span>
                      </div>
                      {trip.start_date && (
                        <div className="flex items-center">
                          <span className="font-medium">{formatDate(trip.start_date)}</span>
                          {duration > 0 && (
                            <span className="ml-1 text-gray-500">• {duration} days</span>
                          )}
                        </div>
                      )}
                      <div className="flex items-center">
                        <span className="font-medium">{trip.group_size} {trip.group_size === 1 ? 'traveler' : 'travelers'}</span>
                      </div>
                      {tripPlaces > 0 && (
                        <div className="flex items-center">
                          <span className="font-medium">{tripPlaces} places</span>
                        </div>
                      )}
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