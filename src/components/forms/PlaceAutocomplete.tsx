import { useState, useEffect, useRef } from 'react'
import { Search, Star, Clock, DollarSign } from 'lucide-react'
import { useDebounce } from '../../hooks/useDebounce'
import { googlePlacesService, type GooglePlace, type PlaceDetailsResponse } from '../../services/googlePlaces'
import { isGoogleMapsConfigured } from '../../config/api'
import { cn } from '../../utils/cn'

interface PlaceAutocompleteProps {
  value: string
  onChange: (name: string) => void
  onPlaceSelect: (place: PlaceDetailsResponse) => void
  destination?: string
  destinationCoords?: { lat: number; lng: number }
  placeholder?: string
  error?: string
}

export function PlaceAutocomplete({ 
  value, 
  onChange, 
  onPlaceSelect,
  destination,
  destinationCoords,
  placeholder = "Search for places...",
  error
}: PlaceAutocompleteProps) {
  const [query, setQuery] = useState(value || '')
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<GooglePlace[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [skipFetch, setSkipFetch] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const debouncedQuery = useDebounce(query, 500)
  
  // Update query when value prop changes
  useEffect(() => {
    if (value !== query) {
      setQuery(value)
    }
  }, [value])
  
  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])
  
  useEffect(() => {
    if (skipFetch) {
      setSkipFetch(false)
      return
    }
    
    if (debouncedQuery.length > 2) {
      fetchSuggestions(debouncedQuery)
    } else {
      setSuggestions([])
      setIsOpen(false)
    }
  }, [debouncedQuery, destination])
  
  const fetchSuggestions = async (searchQuery: string) => {
    if (!isGoogleMapsConfigured()) {
      console.warn('Google Places API not configured')
      return
    }
    
    setIsLoading(true)
    
    try {
      // Create search query with destination context
      const fullQuery = destination 
        ? `${searchQuery} near ${destination}`
        : searchQuery
      
      const places = await googlePlacesService.searchPlaces(fullQuery, destinationCoords)
      setSuggestions(places)
      setIsOpen(places.length > 0)
    } catch (error) {
      console.error('Failed to fetch place suggestions:', error)
      setSuggestions([])
      setIsOpen(false)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handlePlaceSelect = async (place: GooglePlace) => {
    // Update the input immediately
    setQuery(place.name)
    setIsOpen(false)
    setSuggestions([])
    setSkipFetch(true)
    
    // Call onChange to update the name field
    onChange(place.name)
    
    try {
      // Get detailed place information
      const placeDetails = await googlePlacesService.getPlaceDetails(place.place_id)
      onPlaceSelect(placeDetails)
    } catch (error) {
      console.error('Failed to get place details:', error)
      // Still update with basic place info if details fail
      onPlaceSelect({
        ...place,
        formatted_phone_number: undefined,
        website: undefined,
        url: undefined,
        reviews: undefined
      })
    }
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setQuery(newValue)
    onChange(newValue)
    setSkipFetch(false)
  }

  const getPriceLevel = (level?: number) => {
    if (!level) return null
    return Array(level).fill('$').join('')
  }

  const getCategoryIcon = (types: string[]) => {
    if (types.some(type => ['restaurant', 'food', 'meal_takeaway', 'cafe'].includes(type))) {
      return '🍽️'
    }
    if (types.some(type => ['lodging', 'hotel'].includes(type))) {
      return '🏨'
    }
    if (types.some(type => ['tourist_attraction', 'museum', 'park'].includes(type))) {
      return '🎯'
    }
    if (types.some(type => ['store', 'shopping_mall'].includes(type))) {
      return '🛍️'
    }
    return '📍'
  }
  
  if (!isGoogleMapsConfigured()) {
    return (
      <div>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={cn(
            "input-field",
            error && "border-red-300 focus:border-red-500 focus:ring-red-500"
          )}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }
  
  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={cn(
            "input-field pl-9",
            error && "border-red-300 focus:border-red-500 focus:ring-red-500"
          )}
          onFocus={() => {
            if (suggestions.length > 0 && query.length > 2) {
              setIsOpen(true)
            }
          }}
        />
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {isOpen && (
        <div className="absolute z-[100] mt-1 w-full bg-white rounded-xl shadow-lg border border-gray-200 max-h-80 overflow-auto">
          {isLoading ? (
            <div className="px-4 py-3 text-center text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500 mx-auto mb-2"></div>
              Searching places...
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((place) => (
              <button
                key={place.place_id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  handlePlaceSelect(place)
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-start space-x-3">
                  <div className="text-lg flex-shrink-0 mt-0.5">
                    {getCategoryIcon(place.types)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{place.name}</div>
                    <div className="text-sm text-gray-500 truncate">{place.formatted_address}</div>
                    
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      {place.rating && (
                        <div className="flex items-center">
                          <Star className="w-3 h-3 mr-1 fill-current text-yellow-400" />
                          <span>{place.rating}</span>
                        </div>
                      )}
                      {place.price_level && (
                        <div className="flex items-center">
                          <DollarSign className="w-3 h-3 mr-1" />
                          <span>{getPriceLevel(place.price_level)}</span>
                        </div>
                      )}
                      {place.opening_hours?.open_now !== undefined && (
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          <span className={place.opening_hours.open_now ? 'text-green-600' : 'text-red-600'}>
                            {place.opening_hours.open_now ? 'Open' : 'Closed'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-center text-gray-500">
              No places found
            </div>
          )}
        </div>
      )}
    </div>
  )
}