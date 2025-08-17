import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search, Filter, MapPin, Calendar, Users, DollarSign, 
  Star, Bookmark, TrendingUp, Globe, Plus 
} from 'lucide-react'
import { TripGuideService } from '../services/tripGuideService'
import type { TripGuide, GuideSearchFilters, TripType, PriceRange } from '../types/guide'
import { useUser } from '../contexts/UserContext'

const GuideDiscovery: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useUser()
  const [guides, setGuides] = useState<TripGuide[]>([])
  const [filteredGuides, setFilteredGuides] = useState<TripGuide[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [savedGuides, setSavedGuides] = useState<Set<string>>(new Set())
  
  // Filters
  const [filters, setFilters] = useState<GuideSearchFilters>({
    tripType: undefined,
    priceRange: undefined,
    duration: undefined,
    tags: []
  })

  const guideService = new TripGuideService()

  useEffect(() => {
    loadGuides()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [guides, searchQuery, filters])

  const loadGuides = async () => {
    try {
      setLoading(true)
      console.log('Loading guides...')
      
      // Load guides from localStorage
      const savedGuidesStr = localStorage.getItem('savedGuides')
      console.log('Saved guides from localStorage:', savedGuidesStr)
      
      const savedGuides = savedGuidesStr ? JSON.parse(savedGuidesStr) : {}
      const localGuides = Object.values(savedGuides) as TripGuide[]
      console.log('Parsed local guides:', localGuides)
      
      // Don't try database for now - it's causing the hang
      setGuides(localGuides)
      setFilteredGuides(localGuides)
      
    } catch (err) {
      console.error('Error loading guides:', err)
      setGuides([])
      setFilteredGuides([])
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...guides]

    // Search query
    if (searchQuery) {
      filtered = filtered.filter(guide => 
        guide.metadata.destination.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guide.metadata.destination.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guide.metadata.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Trip type filter
    if (filters.tripType) {
      filtered = filtered.filter(guide => guide.metadata.tripType === filters.tripType)
    }

    // Price range filter
    if (filters.priceRange) {
      filtered = filtered.filter(guide => guide.metadata.budget === filters.priceRange)
    }

    // Duration filter
    if (filters.duration) {
      filtered = filtered.filter(guide => {
        const duration = guide.metadata.tripDuration || 0
        const { min, max } = filters.duration!
        return (!min || duration >= min) && (!max || duration <= max)
      })
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(guide => 
        filters.tags!.some(tag => guide.metadata.tags?.includes(tag))
      )
    }

    setFilteredGuides(filtered)
  }

  const handleSaveGuide = async (guideId: string) => {
    if (!user) {
      navigate('/login')
      return
    }

    const newSaved = new Set(savedGuides)
    if (newSaved.has(guideId)) {
      newSaved.delete(guideId)
    } else {
      newSaved.add(guideId)
      await guideService.trackAnalytics(guideId, user.id, 'save')
    }
    setSavedGuides(newSaved)
  }

  const handleCreateGuide = () => {
    if (!user) {
      navigate('/login')
      return
    }
    navigate('/guides/new')
  }

  const formatTravelDate = (month: number, year: number) => {
    const date = new Date(year, month - 1)
    return date.toLocaleDateString('default', { month: 'short', year: 'numeric' })
  }

  const tripTypes: TripType[] = ['solo', 'romantic', 'family', 'group', 'business', 'adventure', 'relaxation', 'cultural']
  const priceRanges: PriceRange[] = ['$', '$$', '$$$', '$$$$']

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Discover Travel Guides</h1>
              <p className="text-gray-600 mt-1">Find inspiration for your next adventure</p>
            </div>
            
            {user && (
              <button
                onClick={handleCreateGuide}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Create Guide</span>
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by destination, country, or tags..."
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 border rounded-lg hover:bg-gray-50 flex items-center space-x-2"
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Trip Type */}
                <div>
                  <label className="block text-sm font-medium mb-2">Trip Type</label>
                  <select
                    value={filters.tripType || ''}
                    onChange={(e) => setFilters({
                      ...filters,
                      tripType: e.target.value as TripType || undefined
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">All Types</option>
                    {tripTypes.map(type => (
                      <option key={type} value={type} className="capitalize">
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium mb-2">Budget</label>
                  <select
                    value={filters.priceRange || ''}
                    onChange={(e) => setFilters({
                      ...filters,
                      priceRange: e.target.value as PriceRange || undefined
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">All Budgets</option>
                    {priceRanges.map(range => (
                      <option key={range} value={range}>
                        {range} - {
                          range === '$' ? 'Budget' :
                          range === '$$' ? 'Moderate' :
                          range === '$$$' ? 'Premium' :
                          'Luxury'
                        }
                      </option>
                    ))}
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium mb-2">Duration (days)</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.duration?.min || ''}
                      onChange={(e) => setFilters({
                        ...filters,
                        duration: {
                          ...filters.duration,
                          min: e.target.value ? parseInt(e.target.value) : undefined
                        }
                      })}
                      className="w-1/2 px-3 py-2 border rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.duration?.max || ''}
                      onChange={(e) => setFilters({
                        ...filters,
                        duration: {
                          ...filters.duration,
                          max: e.target.value ? parseInt(e.target.value) : undefined
                        }
                      })}
                      className="w-1/2 px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setFilters({})
                      setSearchQuery('')
                    }}
                    className="w-full px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-100"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-blue-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-700">
              {filteredGuides.length} guide{filteredGuides.length !== 1 ? 's' : ''} found
            </span>
            <div className="flex items-center space-x-4 text-blue-600">
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4" />
                <span>Popular destinations</span>
              </div>
              <div className="flex items-center space-x-1">
                <Globe className="w-4 h-4" />
                <span>Worldwide coverage</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Debug info */}
        <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
          <p>Total guides loaded: {guides.length}</p>
          <p>Filtered guides: {filteredGuides.length}</p>
          <button 
            onClick={() => {
              console.log('Manual refresh triggered')
              loadGuides()
            }}
            className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh Guides
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredGuides.length === 0 ? (
          <div className="text-center py-12">
            <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">No guides found</h2>
            <p className="text-gray-500 mb-4">
              {guides.length === 0 
                ? "You haven't created any guides yet. Click 'Create Guide' to get started!"
                : "Try adjusting your search or filters"}
            </p>
            {guides.length === 0 && (
              <button
                onClick={() => navigate('/create/guide')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Your First Guide
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGuides.map((guide) => (
              <div
                key={guide.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                onClick={() => navigate(`/guides/${guide.id}`)}
              >
                {/* Cover Image */}
                {guide.metadata.coverImage ? (
                  <img
                    src={guide.metadata.coverImage}
                    alt={`${guide.metadata.destination.city} cover`}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                    <MapPin className="w-12 h-12 text-white opacity-50" />
                  </div>
                )}

                <div className="p-4">
                  {/* Destination */}
                  <h3 className="text-lg font-semibold mb-1">
                    {guide.metadata.destination.city}, {guide.metadata.destination.country}
                  </h3>
                  {guide.metadata.destination.region && (
                    <p className="text-sm text-gray-500 mb-2">{guide.metadata.destination.region}</p>
                  )}

                  {/* Author */}
                  <div className="flex items-center space-x-2 mb-3">
                    {guide.metadata.author.profilePicture ? (
                      <img
                        src={guide.metadata.author.profilePicture}
                        alt={guide.metadata.author.name}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-xs text-gray-600">
                          {guide.metadata.author.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="text-sm text-gray-600">by {guide.metadata.author.name}</span>
                  </div>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatTravelDate(guide.metadata.travelDate.month, guide.metadata.travelDate.year)}
                    </div>
                    {guide.metadata.tripDuration && (
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {guide.metadata.tripDuration} days
                      </div>
                    )}
                    {guide.metadata.budget && (
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        {guide.metadata.budget}
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {guide.metadata.tags && guide.metadata.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {guide.metadata.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                      {guide.metadata.tags.length > 3 && (
                        <span className="px-2 py-1 text-gray-500 text-xs">
                          +{guide.metadata.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Trip Type Badge */}
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs capitalize">
                      {guide.metadata.tripType}
                    </span>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSaveGuide(guide.id)
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Bookmark 
                        className={`w-4 h-4 ${
                          savedGuides.has(guide.id) 
                            ? 'fill-blue-600 text-blue-600' 
                            : 'text-gray-400'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default GuideDiscovery