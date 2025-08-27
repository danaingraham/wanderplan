import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Clock, MapPin, TrendingUp } from 'lucide-react'
import { userActivityService, type RecentlyViewed as RecentlyViewedType } from '../../services/userActivity'
import { formatDistanceToNow } from '../../utils/date'

export function RecentlyViewed() {
  const [recentTrips, setRecentTrips] = useState<RecentlyViewedType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecentlyViewed()
  }, [])

  const loadRecentlyViewed = () => {
    try {
      const recent = userActivityService.getRecentlyViewed(4)
      setRecentTrips(recent)
    } catch (error) {
      console.error('Error loading recently viewed:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="skeleton h-6 w-32 mb-4"></div>
        <div className="flex gap-4 overflow-x-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card min-w-[250px]">
              <div className="skeleton h-4 w-32 mb-2"></div>
              <div className="skeleton-text w-full"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Always show the section, even if empty for debugging
  if (recentTrips.length === 0) {
    return (
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center mb-4">
          <Clock className="w-5 h-5 mr-2 text-gray-500" />
          Recently Viewed
        </h2>
        <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4">
          No recently viewed trips yet. Start exploring trips to see them here!
        </div>
      </section>
    )
  }

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-gray-500" />
          <span className="text-base sm:text-xl">Recently Viewed</span>
        </h2>
        {recentTrips.length > 3 && (
          <Link 
            to="/trips"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View all
          </Link>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {recentTrips.map((trip) => (
          <Link
            key={trip.tripId}
            to={`/trip/${trip.tripId}`}
            className="card card-hover group"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors text-sm line-clamp-1">
                {trip.tripTitle}
              </h3>
              {trip.viewCount > 1 && (
                <div className="flex items-center text-xs text-gray-500">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {trip.viewCount}
                </div>
              )}
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center text-xs text-gray-600">
                <MapPin className="h-3 w-3 mr-1" />
                {trip.destination}
              </div>
              
              <div className="text-xs text-gray-500">
                Viewed {formatDistanceToNow(new Date(trip.lastViewed))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}