import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useTrips } from '../contexts/TripContext'
import { mockTripGuides } from '../data/mockGuides'
import type { Trip } from '../types'

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl

// Define pin colors to rotate through
const PIN_COLORS = [
  '#E85D4E', // coral red
  '#F4C95D', // golden yellow
  '#2C6E63', // deep teal green
  '#EE8B7A', // soft salmon
]

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
    
    // Add custom tile layer - using a simple tile provider
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 16,
    }).addTo(map)

    // Add zoom control to bottom right
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map)

    // Apply custom CSS to style the map with exact colors
    const style = document.createElement('style')
    style.textContent = `
      /* Map container background - soft teal for water */
      .leaflet-container {
        background-color: #9BCCC3;
      }
      
      /* Style the map tiles to have cream land masses */
      .leaflet-tile-pane {
        filter: sepia(100%) saturate(0.8) hue-rotate(20deg) brightness(1.1) contrast(0.9);
        opacity: 0.9;
        mix-blend-mode: multiply;
      }
      
      /* Ensure the tiles blend nicely */
      .leaflet-tile {
        filter: brightness(1.15);
      }
      
      /* Custom popup styling */
      .custom-popup .leaflet-popup-content-wrapper {
        background: #FFFFFF;
        box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
        border-radius: 12px;
        padding: 0;
        border: none;
      }
      
      .custom-popup .leaflet-popup-content {
        margin: 0;
        min-width: 200px;
        color: #2D2D2D;
        font-size: 14px;
      }
      
      .custom-popup .leaflet-popup-tip {
        background: #FFFFFF;
        box-shadow: 0 0 8px rgba(0, 0, 0, 0.05);
      }
      
      .custom-popup .leaflet-popup-close-button {
        display: none;
      }
      
      /* Marker hover effect */
      .leaflet-marker-icon {
        transition: all 0.2s ease;
      }
      
      .leaflet-marker-icon:hover {
        transform: scale(1.15) translateY(-3px);
      }
      
      /* Remove default attribution */
      .leaflet-control-attribution {
        display: none;
      }
      
      /* Style zoom controls */
      .leaflet-control-zoom {
        border: none !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
      }
      
      .leaflet-control-zoom a {
        background: #FFFFFF !important;
        color: #2D2D2D !important;
        border: none !important;
        font-size: 18px !important;
        font-weight: 400 !important;
      }
      
      .leaflet-control-zoom a:hover {
        background: #F5EDE4 !important;
      }
      
      .leaflet-control-zoom-in {
        border-radius: 4px 4px 0 0 !important;
      }
      
      .leaflet-control-zoom-out {
        border-radius: 0 0 4px 4px !important;
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
    guides.forEach((guide, index) => {
      if (guide.latitude && guide.longitude && mapInstanceRef.current) {
        // Get color for this pin (rotate through the palette)
        const pinColor = PIN_COLORS[index % PIN_COLORS.length]
        
        // Create custom colored pin icon
        const icon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div class="relative cursor-pointer">
              <svg width="28" height="40" viewBox="0 0 28 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g filter="url(#shadow${index})">
                  <path d="M14 2C7.37 2 2 7.37 2 14c0 9 12 24 12 24s12-15 12-24c0-6.63-5.37-12-12-12z" fill="${pinColor}"/>
                  <circle cx="14" cy="14" r="5" fill="white" fill-opacity="0.9"/>
                </g>
                <defs>
                  <filter id="shadow${index}" x="0" y="0" width="28" height="40" filterUnits="userSpaceOnUse">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.15"/>
                  </filter>
                </defs>
              </svg>
            </div>
          `,
          iconSize: [28, 40],
          iconAnchor: [14, 40],
          popupAnchor: [0, -40]
        })

        const marker = L.marker([guide.latitude, guide.longitude], { icon })
          .addTo(mapInstanceRef.current)

        // Create custom popup content
        const popupContent = `
          <div class="p-4">
            <div class="flex items-start gap-3 mb-3">
              <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style="background-color: ${pinColor}20;">
                ${guide.trip_type === 'romantic' ? '💕' : 
                  guide.trip_type === 'family' ? '👨‍👩‍👧' :
                  guide.trip_type === 'friends' ? '👥' :
                  guide.trip_type === 'solo' ? '🚶' :
                  guide.trip_type === 'business' ? '💼' : '✈️'}
              </div>
              <div class="flex-1">
                <h3 class="font-medium text-[#2D2D2D] text-sm mb-1">${guide.title}</h3>
                <p class="text-xs text-gray-500">${guide.destination}</p>
              </div>
            </div>
            <button 
              onclick="window.location.href='/trip/${guide.id}'"
              class="w-full text-center text-xs font-medium py-2 px-3 rounded-lg transition-colors"
              style="background-color: ${pinColor}15; color: ${pinColor};"
              onmouseover="this.style.backgroundColor='${pinColor}25'"
              onmouseout="this.style.backgroundColor='${pinColor}15'"
            >
              View Guide →
            </button>
          </div>
        `

        marker.bindPopup(popupContent, {
          className: 'custom-popup',
          closeButton: false,
          offset: [0, 0],
          autoPan: false
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
    <div className="min-h-screen" style={{ backgroundColor: '#F5EDE4' }}>
      {/* Header */}
      <div className="text-center py-8">
        <h1 className="text-2xl font-medium" style={{ color: '#2D2D2D', fontWeight: 500 }}>
          Homepage
        </h1>
      </div>

      {/* Map Container */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
          <div ref={mapRef} className="h-[550px] w-full" />
        </div>
      </div>

      {/* Selected Guide Modal */}
      {selectedGuide && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[2000] p-4"
          onClick={() => setSelectedGuide(null)}
        >
          <div 
            className="bg-white shadow-xl p-6 max-w-md w-full"
            style={{ 
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold" style={{ color: '#2D2D2D' }}>
                  {selectedGuide.title}
                </h2>
                <p className="text-gray-500 mt-1 text-sm">{selectedGuide.destination}</p>
              </div>
              <button
                onClick={() => setSelectedGuide(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm" style={{ color: '#2D2D2D' }}>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>{selectedGuide.group_size} {selectedGuide.group_size === 1 ? 'person' : 'people'} • {selectedGuide.trip_type}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm" style={{ color: '#2D2D2D' }}>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="capitalize">{selectedGuide.pace} pace</span>
              </div>

              {selectedGuide.preferences && selectedGuide.preferences.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedGuide.preferences.slice(0, 4).map(pref => (
                    <span
                      key={pref}
                      className="text-xs px-3 py-1 rounded-full"
                      style={{ 
                        backgroundColor: '#9BCCC3',
                        color: '#2D2D2D'
                      }}
                    >
                      {pref}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <Link
              to={`/trip/${selectedGuide.id}`}
              className="block w-full text-center px-4 py-3 text-white rounded-lg transition-all font-medium text-sm"
              style={{ 
                backgroundColor: '#E85D4E',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#D64D3E'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#E85D4E'}
            >
              View Full Guide
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}