import { useState, useEffect, useRef } from 'react'
import { MapPin, Search } from 'lucide-react'
import { useDebounce } from '../../hooks/useDebounce'
import { realApiService } from '../../services/realApi'
import { googlePlacesService } from '../../services/googlePlaces'
import { simplePlacesService } from '../../services/simplePlaces'
import { isGoogleMapsConfigured } from '../../config/api'
import { cn } from '../../utils/cn'

interface DestinationSuggestion {
  place_id: string
  description: string
  main_text: string
  secondary_text: string
}

// Fallback destinations when Google Places is not available
const fallbackDestinations = [
  { name: 'Paris, France', lat: 48.8566, lng: 2.3522 },
  { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503 },
  { name: 'New York, NY, USA', lat: 40.7128, lng: -74.0060 },
  { name: 'London, UK', lat: 51.5074, lng: -0.1278 },
  { name: 'Rome, Italy', lat: 41.9028, lng: 12.4964 },
  { name: 'Barcelona, Spain', lat: 41.3851, lng: 2.1734 },
  { name: 'Amsterdam, Netherlands', lat: 52.3676, lng: 4.9041 },
  { name: 'Berlin, Germany', lat: 52.5200, lng: 13.4050 },
  { name: 'Sydney, Australia', lat: -33.8688, lng: 151.2093 },
  { name: 'Bali, Indonesia', lat: -8.3405, lng: 115.0920 },
]

interface DestinationAutocompleteProps {
  label?: string
  value?: string
  onChange: (destination: string, coordinates?: { lat: number; lng: number }) => void
  placeholder?: string
  error?: string
  helperText?: string
}

export function DestinationAutocomplete({ 
  label, 
  value, 
  onChange, 
  placeholder = "Where do you want to go?",
  error,
  helperText
}: DestinationAutocompleteProps) {
  const [query, setQuery] = useState(value || '')
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<DestinationSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [skipFetch, setSkipFetch] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const debouncedQuery = useDebounce(query, 500)
  
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
  }, [debouncedQuery])
  
  const fetchSuggestions = async (searchQuery: string) => {
    console.log('🔍 Fetching suggestions for:', searchQuery)
    
    setIsLoading(true)
    
    try {
      if (isGoogleMapsConfigured()) {
        // Try the simple places service first
        const simpleSuggestions = await simplePlacesService.getDestinationSuggestions(searchQuery)
        
        if (simpleSuggestions.length > 0) {
          setSuggestions(simpleSuggestions)
        } else {
          // Fallback to the original service
          const predictions = await realApiService.getDestinationSuggestions(searchQuery)
          
          const destinationSuggestions: DestinationSuggestion[] = predictions.map(prediction => ({
            place_id: prediction.place_id,
            description: prediction.description,
            main_text: prediction.structured_formatting.main_text,
            secondary_text: prediction.structured_formatting.secondary_text,
          }))
          setSuggestions(destinationSuggestions)
        }
      } else {
        // Use fallback destinations
        const filtered = fallbackDestinations
          .filter(dest => dest.name.toLowerCase().includes(searchQuery.toLowerCase()))
          .map(dest => ({
            place_id: dest.name,
            description: dest.name,
            main_text: dest.name.split(',')[0],
            secondary_text: dest.name.split(',').slice(1).join(',').trim(),
          }))
        setSuggestions(filtered)
      }
      
      setIsOpen(true)
    } catch (error) {
      console.error('❌ Failed to fetch destination suggestions:', error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleDestinationSelect = async (suggestion: DestinationSuggestion) => {
    const selectedText = suggestion.main_text
    
    // Update the input and close dropdown immediately
    setQuery(selectedText)
    setIsOpen(false)
    setSuggestions([])
    setSkipFetch(true) // Skip the next fetch triggered by setQuery
    
    // Get coordinates for the selected destination
    if (isGoogleMapsConfigured()) {
      try {
        const placeDetails = await googlePlacesService.getPlaceDetails(suggestion.place_id)
        onChange(selectedText, {
          lat: placeDetails.geometry.location.lat,
          lng: placeDetails.geometry.location.lng,
        })
      } catch (error) {
        console.error('Failed to get place details:', error)
        onChange(selectedText)
      }
    } else {
      // Use fallback coordinates
      const fallback = fallbackDestinations.find(dest => dest.name === suggestion.place_id)
      onChange(selectedText, fallback ? { lat: fallback.lat, lng: fallback.lng } : undefined)
    }
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setQuery(newValue)
    setSkipFetch(false) // Allow fetching when user types
  }
  
  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={cn(
            "input-field pl-10",
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
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
      
      {isOpen && (
        <div className="absolute z-[100] mt-1 w-full bg-white rounded-xl shadow-lg border border-gray-200 max-h-60 overflow-auto">
          {isLoading ? (
            <div className="px-4 py-3 text-center text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500 mx-auto mb-2"></div>
              Searching destinations...
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((suggestion) => (
              <button
                key={suggestion.place_id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault() // Prevent input blur
                  handleDestinationSelect(suggestion)
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 border-b border-gray-100 last:border-b-0"
              >
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-900">{suggestion.main_text}</div>
                  <div className="text-sm text-gray-500">{suggestion.secondary_text}</div>
                </div>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-center text-gray-500">
              No destinations found
            </div>
          )}
        </div>
      )}
    </div>
  )
}