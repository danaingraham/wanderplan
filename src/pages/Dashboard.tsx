import { Link, useNavigate } from 'react-router-dom'
import { MapPin, Calendar, Users, Sparkles } from 'lucide-react'
import { useTrips } from '../contexts/TripContext'
import { formatDate, isDateInFuture } from '../utils/date'
import { useUserPreferences } from '../hooks/useUserPreferences'
import { calculateCompleteness } from '../utils/travelDNA'

export function Dashboard() {
  const { trips, loading } = useTrips()
  const { preferences } = useUserPreferences()
  const navigate = useNavigate()
  
  const dnaCompleteness = preferences ? calculateCompleteness(preferences) : 0
  const hasDNA = dnaCompleteness > 0

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
      {/* Travel DNA Prompt - Show only if user hasn't created their DNA */}
      {!hasDNA && (
        <div className="mb-6 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-6 border border-primary-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Create Your Travel DNA</p>
                <p className="text-sm text-gray-600">Get personalized trip recommendations based on your unique travel style</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Create DNA
            </button>
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