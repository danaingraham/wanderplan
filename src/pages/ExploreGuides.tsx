import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Calendar, Users, Search, Filter, Eye } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useTrips } from '../contexts/TripContext'
import { formatDate } from '../utils/date'
import type { Trip } from '../types'

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

export function ExploreGuides() {
  const { getPublicTrips } = useTrips()
  const [guides, setGuides] = useState<Trip[]>([])
  const [selectedGuide, setSelectedGuide] = useState<Trip | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])

  useEffect(() => {
    // Filter for only guide trips (not regular itineraries)
    const trips = getPublicTrips().filter(trip => trip.is_guide)
    setGuides(trips)
  }, [getPublicTrips])

  const filteredGuides = guides.filter(guide => {
    const matchesSearch = guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         guide.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         guide.preferences.some(pref => pref.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesFilter = filterType === 'all' || guide.trip_type === filterType
    
    return matchesSearch && matchesFilter
  })

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Create map centered on world view
    const map = L.map(mapRef.current).setView([30, 0], 2)
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map)

    mapInstanceRef.current = map

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Update markers when guides change
  useEffect(() => {
    if (!mapInstanceRef.current) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    // Add markers for filtered guides
    filteredGuides.forEach(guide => {
      if (guide.latitude && guide.longitude && mapInstanceRef.current) {
        // Create custom icon for guides
        const icon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div class="relative">
              <div class="absolute -translate-x-1/2 -translate-y-full">
                <div class="bg-primary-600 text-white rounded-full p-2 shadow-lg hover:bg-primary-700 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </div>
                <div class="w-2 h-2 bg-primary-600 mx-auto -mt-1 rotate-45"></div>
              </div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 40],
        })

        const marker = L.marker([guide.latitude, guide.longitude], { icon })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div class="p-2 min-w-[200px]">
              <h3 class="font-semibold text-gray-900 mb-1">${guide.title}</h3>
              <p class="text-sm text-gray-600 mb-2">${guide.destination}</p>
              <div class="text-xs text-gray-500 space-y-1">
                <div class="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  ${guide.group_size} people
                </div>
                ${guide.start_date ? `
                  <div class="flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    ${formatDate(guide.start_date)}
                  </div>
                ` : ''}
              </div>
            </div>
          `)

        marker.on('click', () => {
          setSelectedGuide(guide)
        })

        markersRef.current.push(marker)
      }
    })

    // Fit map to show all markers if there are any
    if (markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current)
      mapInstanceRef.current.fitBounds(group.getBounds(), { padding: [50, 50] })
    }
  }, [filteredGuides])

  return (
    <div className="h-full flex">
      {/* Map Container */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="h-full w-full" />
        
        {/* Search Overlay */}
        <div className="absolute top-4 left-4 right-4 z-[1000] max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-4 space-y-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search destinations or trip guides..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="appearance-none block flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 bg-white"
              >
                <option value="all">All Types</option>
                <option value="solo">Solo</option>
                <option value="romantic">Romantic</option>
                <option value="family">Family</option>
                <option value="friends">Friends</option>
                <option value="business">Business</option>
              </select>
              
              <div className="text-sm text-gray-500">
                {filteredGuides.length} guide{filteredGuides.length !== 1 ? 's' : ''} found
              </div>
            </div>
          </div>
        </div>
        
        {/* Selected Guide Card */}
        {selectedGuide && (
          <div className="absolute bottom-4 left-4 right-4 max-w-md mx-auto z-[1000]">
            <div className="bg-white rounded-lg shadow-xl p-4">
              <button
                onClick={() => setSelectedGuide(null)}
                className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded"
              >
                ×
              </button>
              
              <h3 className="font-semibold text-gray-900 mb-2">{selectedGuide.title}</h3>
              
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  {selectedGuide.destination}
                </div>
                {selectedGuide.start_date && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formatDate(selectedGuide.start_date)}
                  </div>
                )}
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  {selectedGuide.group_size} {selectedGuide.group_size === 1 ? 'person' : 'people'} • {selectedGuide.trip_type}
                </div>
              </div>
              
              {selectedGuide.preferences.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {selectedGuide.preferences.slice(0, 3).map(pref => (
                    <span
                      key={pref}
                      className="text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded-full"
                    >
                      {pref}
                    </span>
                  ))}
                  {selectedGuide.preferences.length > 3 && (
                    <span className="text-xs text-gray-400">
                      +{selectedGuide.preferences.length - 3} more
                    </span>
                  )}
                </div>
              )}
              
              <Link
                to={`/trip/${selectedGuide.id}`}
                className="inline-flex items-center justify-center w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Guide
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}