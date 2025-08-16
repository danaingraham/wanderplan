import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import { useTrips } from '../contexts/TripContext'
import { mockTripGuides } from '../data/mockGuides'
import type { Trip } from '../types'

// Geography data URL for world map
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"

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
  const [hoveredGuideId, setHoveredGuideId] = useState<string | null>(null)

  useEffect(() => {
    // Get real guides and combine with mock guides
    const realGuides = getPublicTrips().filter(trip => trip.is_guide)
    const allGuides = [...realGuides, ...mockTripGuides as Trip[]]
    setGuides(allGuides)
  }, [getPublicTrips])

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5EDE4' }}>
      {/* Map Container */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div 
          style={{
            backgroundColor: '#9BCCC3',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            padding: '0'
          }}
        >
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 140,
              center: [0, 20]
            }}
            style={{
              width: '100%',
              height: '550px'
            }}
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#F5EDE4"
                    stroke="#9BCCC3"
                    strokeWidth={0.5}
                    style={{
                      default: { 
                        outline: 'none',
                        transition: 'all 0.2s ease'
                      },
                      hover: { 
                        outline: 'none', 
                        fill: '#EDE0D4',
                        cursor: 'default'
                      },
                      pressed: { 
                        outline: 'none' 
                      }
                    }}
                  />
                ))
              }
            </Geographies>
            
            {/* Trip markers */}
            {guides.map((guide, index) => {
              if (!guide.latitude || !guide.longitude) return null
              
              const pinColor = PIN_COLORS[index % PIN_COLORS.length]
              const isHovered = hoveredGuideId === guide.id
              
              return (
                <Marker 
                  key={guide.id}
                  coordinates={[guide.longitude, guide.latitude]}
                  onMouseEnter={() => setHoveredGuideId(guide.id)}
                  onMouseLeave={() => setHoveredGuideId(null)}
                  onClick={() => setSelectedGuide(guide)}
                  style={{
                    cursor: 'pointer'
                  }}
                >
                  <g transform={isHovered ? 'scale(1.2) translate(0, -2)' : 'scale(1)'}>
                    {/* Pin shape */}
                    <path 
                      d="M0,-20 C-6,-20 -11,-15 -11,-9 C-11,0 0,20 0,20 C0,20 11,0 11,-9 C11,-15 6,-20 0,-20"
                      fill={pinColor}
                      stroke="#FFFFFF"
                      strokeWidth="0.5"
                      filter="drop-shadow(0 2px 3px rgba(0,0,0,0.15))"
                    />
                    {/* Inner circle */}
                    <circle 
                      r="4" 
                      cy="-9"
                      fill="#FFFFFF" 
                      fillOpacity="0.9"
                    />
                  </g>
                  
                  {/* Hover tooltip */}
                  {isHovered && (
                    <foreignObject x="-100" y="-70" width="200" height="100">
                      <div 
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                          fontSize: '12px',
                          color: '#2D2D2D'
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: '2px' }}>
                          {guide.title}
                        </div>
                        <div style={{ color: '#666', fontSize: '11px' }}>
                          {guide.destination}
                        </div>
                      </div>
                    </foreignObject>
                  )}
                </Marker>
              )
            })}
          </ComposableMap>
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