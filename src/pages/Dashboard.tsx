import { Link } from 'react-router-dom'
import { Plus, MapPin, Calendar, Users, AlertTriangle, RefreshCw } from 'lucide-react'
import { useUser } from '../contexts/UserContext'
import { useTrips } from '../contexts/TripContext'
import { formatDate, isDateInFuture, isDateInPast } from '../utils/date'
import { storage, STORAGE_KEYS } from '../utils/storage'

export function Dashboard() {
  const { user } = useUser()
  const { trips, loading, refreshData } = useTrips()

  console.log('📊 Dashboard: Current user:', user?.id)
  console.log('📊 Dashboard: Trips loaded:', trips.length)
  console.log('📊 Dashboard: Trip details:', trips.map(trip => ({ id: trip.id, title: trip.title, created_by: trip.created_by })))

  // Check for backups if no trips are shown
  const backups = trips.length === 0 ? storage.getBackups(STORAGE_KEYS.TRIPS) : []
  
  const handleRecovery = () => {
    if (storage.recoverFromBackup(STORAGE_KEYS.TRIPS)) {
      refreshData()
    }
  }

  const upcomingTrips = trips.filter(trip => 
    trip.start_date && isDateInFuture(trip.start_date)
  ).slice(0, 3)

  const recentTrips = trips
    .filter(trip => !trip.start_date || isDateInPast(trip.start_date))
    .sort((a, b) => new Date(b.updated_date).getTime() - new Date(a.updated_date).getTime())
    .slice(0, 6)

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="skeleton h-8 w-64 mb-2"></div>
          <div className="skeleton-text w-96 mb-8"></div>
          
          {/* Skeleton cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card">
                <div className="skeleton h-6 w-48 mb-4"></div>
                <div className="space-y-2">
                  <div className="skeleton-text w-full"></div>
                  <div className="skeleton-text w-3/4"></div>
                  <div className="skeleton-text w-1/2"></div>
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
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.full_name?.split(' ')[0] || 'Explorer'}! 
          <span className="animate-bounce-gentle inline-block ml-2">👋</span>
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Ready to plan your next adventure? Let's make it unforgettable.
        </p>
      </div>

      {upcomingTrips.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Upcoming Adventures</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {upcomingTrips.map((trip, index) => (
              <Link
                key={trip.id}
                to={`/trip/${trip.id}`}
                className="card card-hover group animate-slide-up"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                    {trip.title}
                  </h3>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Upcoming
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    {trip.destination}
                  </div>
                  {trip.start_date && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(trip.start_date)}
                    </div>
                  )}
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    {trip.group_size} {trip.group_size === 1 ? 'person' : 'people'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            {recentTrips.length > 0 ? 'Recent Trips' : 'Your Trips'}
          </h2>
          {recentTrips.length > 6 && (
            <Link to="/trips" className="text-primary-600 hover:text-primary-700 font-medium">
              View all trips
            </Link>
          )}
        </div>

        {recentTrips.length === 0 ? (
          <div className="text-center py-12 animate-fade-in">
            <div className="max-w-md mx-auto">
              {backups.length > 0 ? (
                <>
                  <div className="bg-orange-100 rounded-full w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <AlertTriangle className="h-8 w-8 sm:h-12 sm:w-12 text-orange-500" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                    Missing trips detected!
                  </h3>
                  <p className="text-gray-500 mb-6 text-sm sm:text-base px-4">
                    We found {backups.length} backup(s) of your trip data. Would you like to recover your trips?
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button 
                      onClick={handleRecovery}
                      className="btn-primary inline-flex items-center space-x-2"
                    >
                      <RefreshCw className="h-5 w-5" />
                      <span>Recover My Trips</span>
                    </button>
                    <Link to="/create" className="hidden md:inline-flex btn-secondary items-center space-x-2">
                      <Plus className="h-5 w-5" />
                      <span>Create New Trip</span>
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-gray-100 rounded-full w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center mx-auto mb-6 animate-float">
                    <MapPin className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                    Ready for your next adventure?
                  </h3>
                  <p className="text-gray-500 mb-6 text-sm sm:text-base px-4">
                    Create a new trip and let our AI help you discover amazing places and build the perfect itinerary.
                  </p>
                  <Link to="/create" className="hidden md:inline-flex btn-primary items-center space-x-2">
                    <Plus className="h-5 w-5" />
                    <span>Plan New Trip</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {recentTrips.map((trip, index) => (
              <Link
                key={trip.id}
                to={`/trip/${trip.id}`}
                className="card card-hover group animate-slide-up"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                    {trip.title}
                  </h3>
                  {trip.is_public && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Public
                    </span>
                  )}
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    {trip.destination}
                  </div>
                  {trip.start_date && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(trip.start_date)}
                    </div>
                  )}
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    {trip.group_size} {trip.group_size === 1 ? 'person' : 'people'}
                  </div>
                </div>
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
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}