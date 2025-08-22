import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Calendar, Users, Menu, X, User } from 'lucide-react'
import { useUser } from '../contexts/UserContext'
import { useTrips } from '../contexts/TripContext'
import { formatDate, isDateInFuture } from '../utils/date'

export function Dashboard() {
  const { user, logout } = useUser()
  const { trips, loading } = useTrips()
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  console.log('📊 Dashboard: Current user:', user?.id)
  console.log('📊 Dashboard: Trips loaded:', trips.length)
  console.log('📊 Dashboard: Trip details:', trips.map(trip => ({ id: trip.id, title: trip.title, created_by: trip.created_by })))

  // Sort trips by updated date (most recent first)
  const allTrips = trips
    .sort((a, b) => new Date(b.updated_date).getTime() - new Date(a.updated_date).getTime())

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
      {/* Mobile Menu Button - Only show on mobile */}
      <div className="md:hidden fixed top-4 right-4 z-50">
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="bg-white p-2 rounded-lg shadow-lg border border-gray-200"
        >
          {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowMobileMenu(false)}>
          <div className="absolute right-0 top-0 h-full w-64 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-medium">{user?.full_name || 'User'}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>
            </div>
            
            <nav className="p-4 space-y-2">
              <Link
                to="/profile"
                className="block px-4 py-3 text-primary-600 font-medium hover:bg-gray-50 rounded-lg"
                onClick={() => setShowMobileMenu(false)}
              >
                ✈️ Travel Preferences
              </Link>
              <Link
                to="/create"
                className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                onClick={() => setShowMobileMenu(false)}
              >
                ➕ Create New Trip
              </Link>
              <Link
                to="/profile"
                className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                onClick={() => setShowMobileMenu(false)}
              >
                👤 Profile Settings
              </Link>
              <div className="border-t border-gray-200 my-2"></div>
              <button
                onClick={() => {
                  logout()
                  setShowMobileMenu(false)
                }}
                className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                🚪 Sign Out
              </button>
            </nav>
          </div>
        </div>
      )}

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">My Trips</h2>
        </div>

        {allTrips.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No trip itineraries yet
              </h3>
              <p className="text-gray-600 mb-6">
                Start planning your next adventure with AI-powered trip generation
              </p>
              <Link
                to="/create"
                className="inline-flex items-center px-6 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors"
              >
                Generate Trip with AI
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {allTrips.map((trip, index) => {
              const isUpcoming = trip.start_date && isDateInFuture(trip.start_date)
              
              return (
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
                    {isUpcoming ? (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Upcoming
                      </span>
                    ) : trip.is_public ? (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        Public
                      </span>
                    ) : null}
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
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}