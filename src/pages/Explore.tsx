import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Calendar, Users, Heart, Search, Filter } from 'lucide-react'
import { useTrips } from '../contexts/TripContext'
import { useUser } from '../contexts/UserContext'
import { formatDate } from '../utils/date'
import type { Trip } from '../types'

export function Explore() {
  const { getPublicTrips } = useTrips()
  const { getAllUsers } = useUser()
  const [publicTrips, setPublicTrips] = useState<Trip[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPublicTrips = () => {
      setLoading(true)
      const trips = getPublicTrips()
      setPublicTrips(trips)
      setLoading(false)
    }
    
    loadPublicTrips()
  }, [getPublicTrips])

  const users = getAllUsers()
  const getUserById = (id: string) => users.find(u => u.id === id)

  const filteredTrips = publicTrips.filter(trip => {
    const matchesSearch = trip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trip.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trip.preferences.some(pref => pref.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesFilter = filterType === 'all' || trip.trip_type === filterType
    
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="skeleton h-8 w-64 mb-2"></div>
          <div className="skeleton-text w-96 mb-8"></div>
          
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
          Explore Public Trips
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Discover amazing itineraries shared by the Wanderplan community
        </p>
      </div>

      {/* Search and Filter */}
      <div className="mb-8 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search destinations, trip titles, or interests..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-gray-400" />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="appearance-none block w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white"
          >
            <option value="all">All Types</option>
            <option value="solo">Solo</option>
            <option value="romantic">Romantic</option>
            <option value="family">Family</option>
            <option value="friends">Friends</option>
            <option value="business">Business</option>
          </select>
        </div>
      </div>

      {filteredTrips.length === 0 ? (
        <div className="text-center py-12 animate-fade-in">
          <div className="max-w-md mx-auto">
            <div className="bg-gray-100 rounded-full w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center mx-auto mb-6 animate-float">
              <Heart className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              No trips found
            </h3>
            <p className="text-gray-500 mb-6 text-sm sm:text-base px-4">
              {searchQuery || filterType !== 'all' 
                ? 'Try adjusting your search or filters to find more trips.'
                : 'Be the first to share a public trip with the community!'
              }
            </p>
            <Link to="/create" className="btn-primary inline-flex items-center space-x-2">
              <span>Create Public Trip</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredTrips.map((trip, index) => {
            const creator = getUserById(trip.created_by)
            return (
              <Link
                key={trip.id}
                to={`/trip/${trip.id}`}
                className="card card-hover group animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                    {trip.title}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Public
                    </span>
                  </div>
                </div>
                
                {creator && (
                  <div className="text-xs text-gray-500 mb-3">
                    by {creator.full_name}
                  </div>
                )}
                
                <div className="space-y-2 text-sm text-gray-600 mb-4">
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
                    {trip.group_size} {trip.group_size === 1 ? 'person' : 'people'} • {trip.trip_type}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {trip.preferences.slice(0, 3).map(pref => (
                    <span
                      key={pref}
                      className="text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded-full"
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
    </div>
  )
}