import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useTrips } from '../contexts/TripContext'
import { mockTripGuides } from '../data/mockGuides'
import type { Trip } from '../types'

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl

export function Explore() {
  const { getPublicTrips } = useTrips()
  const [guides, setGuides] = useState<Trip[]>([])
  const [selectedGuide, setSelectedGuide] = useState<Trip | null>(null)
  const [hoveredGuide, setHoveredGuide] = useState<Trip | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())

  useEffect(() => {
    // Get real guides and combine with mock guides
    const realGuides = getPublicTrips().filter(trip => trip.is_guide)
    // Cast mock guides to Trip type for now
    const allGuides = [...realGuides, ...mockTripGuides as Trip[]]
    setGuides(allGuides)
  }, [getPublicTrips])

  // Initialize map with custom styling
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Create map centered on world view
    const map = L.map(mapRef.current, {
      center: [25, 0],
      zoom: 2.2,
      minZoom: 2,
      maxZoom: 10,
      zoomControl: false,
      attributionControl: false
    })
    
    // Add custom tile layer with light style
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map)

    // Add zoom control to bottom right
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map)

    // Apply custom CSS to make the map teal
    const style = document.createElement('style')
    style.textContent = `
      .leaflet-container {
        background-color: #7dd3c0;
      }
      .leaflet-tile-pane {
        filter: sepia(0.3) hue-rotate(160deg) saturate(0.5) brightness(1.2);
        opacity: 0.6;
      }
      .custom-popup .leaflet-popup-content-wrapper {
        background: white;
        box-shadow: 0 3px 14px rgba(0,0,0,0.15);
        border-radius: 8px;
        padding: 0;
      }
      .custom-popup .leaflet-popup-content {
        margin: 0;
        min-width: 180px;
      }
      .custom-popup .leaflet-popup-tip {
        background: white;
      }
      .leaflet-marker-icon {
        transition: all 0.3s ease;
      }
      .leaflet-marker-icon:hover {
        transform: scale(1.2) translateY(-5px);
      }
    `
    document.head.appendChild(style)

    mapInstanceRef.current = map

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
      document.head.removeChild(style)
    }
  }, [])

  // Update markers when guides change
  useEffect(() => {
    if (!mapInstanceRef.current) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current.clear()

    // Add markers for all guides
    guides.forEach(guide => {
      if (guide.latitude && guide.longitude && mapInstanceRef.current) {
        // Create custom coral-colored pin icon
        const icon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div class="relative cursor-pointer">
              <svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24c0-6.63-5.37-12-12-12z" fill="#FB923C"/>
                <circle cx="12" cy="12" r="4" fill="white"/>
              </svg>
            </div>
          `,
          iconSize: [24, 36],
          iconAnchor: [12, 36],
          popupAnchor: [0, -36]
        })

        const marker = L.marker([guide.latitude, guide.longitude], { icon })
          .addTo(mapInstanceRef.current)

        // Create custom popup content
        const popupContent = `
          <div class="p-3">
            <div class="flex items-center gap-2 mb-2">
              ${guide.trip_type === 'romantic' ? '💕' : 
                guide.trip_type === 'family' ? '👨‍👩‍👧‍👦' :
                guide.trip_type === 'friends' ? '👥' :
                guide.trip_type === 'solo' ? '🚶' :
                guide.trip_type === 'business' ? '💼' : '✈️'}
              <h3 class="font-medium text-gray-900">${guide.title}</h3>
            </div>
            <p class="text-sm text-gray-600 mb-2">${guide.destination}</p>
            <button 
              onclick="window.location.href='/trip/${guide.id}'"
              class="text-sm text-orange-500 hover:text-orange-600 font-medium"
            >
              View Guide →
            </button>
          </div>
        `

        marker.bindPopup(popupContent, {
          className: 'custom-popup',
          closeButton: false,
          offset: [0, 0]
        })

        marker.on('mouseover', function() {
          this.openPopup()
          setHoveredGuide(guide)
        })

        marker.on('mouseout', function() {
          this.closePopup()
          setHoveredGuide(null)
        })

        marker.on('click', () => {
          setSelectedGuide(guide)
        })

        markersRef.current.set(guide.id, marker)
      }
    })
  }, [guides])

  return (
    <div className="min-h-screen bg-[#FEF7ED]">
      {/* Header */}
      <div className="text-center py-6">
        <h1 className="text-2xl font-medium text-gray-800">Homepage</h1>
      </div>

      {/* Map Container */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div ref={mapRef} className="h-[500px] w-full" />
        </div>
      </div>

      {/* Selected Guide Modal */}
      {selectedGuide && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[2000] p-4"
          onClick={() => setSelectedGuide(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedGuide.title}</h2>
                <p className="text-gray-600 mt-1">{selectedGuide.destination}</p>
              </div>
              <button
                onClick={() => setSelectedGuide(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>{selectedGuide.group_size} {selectedGuide.group_size === 1 ? 'person' : 'people'} • {selectedGuide.trip_type}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="capitalize">{selectedGuide.pace} pace</span>
              </div>

              {selectedGuide.preferences && selectedGuide.preferences.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedGuide.preferences.map(pref => (
                    <span
                      key={pref}
                      className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full"
                    >
                      {pref}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <Link
              to={`/trip/${selectedGuide.id}`}
              className="block w-full text-center px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              View Full Guide
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}