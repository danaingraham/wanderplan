import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useTrips } from '../../contexts/TripContext'
import type { Trip } from '../../types'

// Fix for default markers
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
})

interface ExploreMapProps {
  onTripSelect?: (trip: Trip) => void
  className?: string
}

export function ExploreMap({ onTripSelect, className = '' }: ExploreMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const { trips } = useTrips()

  useEffect(() => {
    if (!mapRef.current) return

    // Initialize map
    const map = L.map(mapRef.current, {
      center: [20, 0], // Center on world
      zoom: 2,
      zoomControl: true,
      attributionControl: true,
    })

    mapInstanceRef.current = map

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapInstanceRef.current) return

    const map = mapInstanceRef.current

    // Clear existing markers
    markersRef.current.forEach(marker => map.removeLayer(marker))
    markersRef.current = []

    // Filter public trips with coordinates
    const publicTrips = trips.filter(trip => 
      trip.is_public && 
      trip.latitude && 
      trip.longitude
    )

    // Add markers for each public trip
    publicTrips.forEach(trip => {
      if (!trip.latitude || !trip.longitude) return

      // Create custom icon based on trip type
      const getIconColor = (tripType: string) => {
        switch (tripType) {
          case 'romantic': return '#ff6b6b'
          case 'family': return '#4ecdc4'
          case 'friends': return '#45b7d1'
          case 'business': return '#6c5ce7'
          case 'solo': return '#26de81'
          default: return '#74b9ff'
        }
      }

      const getIconEmoji = (tripType: string) => {
        switch (tripType) {
          case 'romantic': return '💕'
          case 'family': return '👨‍👩‍👧‍👦'
          case 'friends': return '👥'
          case 'business': return '💼'
          case 'solo': return '🚶'
          default: return '✈️'
        }
      }

      const color = getIconColor(trip.trip_type)
      const emoji = getIconEmoji(trip.trip_type)

      const icon = L.divIcon({
        html: `
          <div class="relative group cursor-pointer">
            <div class="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg transform transition-transform group-hover:scale-110" 
                 style="background-color: ${color}">
              <span class="text-lg">${emoji}</span>
            </div>
            <div class="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-90 text-white text-xs px-3 py-2 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              ${trip.destination}
            </div>
          </div>
        `,
        className: 'explore-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      })

      const marker = L.marker([trip.latitude, trip.longitude], { icon })
        .bindPopup(`
          <div class="p-3 min-w-[250px]">
            <div class="flex items-center mb-3">
              <span class="text-2xl mr-3">${emoji}</span>
              <div>
                <h3 class="font-bold text-gray-900">${trip.title}</h3>
                <p class="text-sm text-gray-600">${trip.destination}</p>
              </div>
            </div>
            ${trip.start_date ? `
              <div class="mb-2">
                <span class="text-sm text-gray-500">📅 ${new Date(trip.start_date).toLocaleDateString()}</span>
                ${trip.end_date ? ` - ${new Date(trip.end_date).toLocaleDateString()}` : ''}
              </div>
            ` : ''}
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm text-gray-600">👥 ${trip.group_size} ${trip.group_size === 1 ? 'person' : 'people'}</span>
              <span class="text-xs px-2 py-1 bg-gray-100 rounded-full capitalize">${trip.pace}</span>
            </div>
            ${trip.preferences.length > 0 ? `
              <div class="mb-3">
                <p class="text-xs text-gray-500 mb-1">Interests:</p>
                <div class="flex flex-wrap gap-1">
                  ${trip.preferences.slice(0, 3).map(pref => `
                    <span class="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">${pref}</span>
                  `).join('')}
                  ${trip.preferences.length > 3 ? `<span class="text-xs text-gray-400">+${trip.preferences.length - 3}</span>` : ''}
                </div>
              </div>
            ` : ''}
            <button 
              onclick="window.dispatchEvent(new CustomEvent('tripSelect', { detail: '${trip.id}' }))"
              class="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-4 rounded-lg transition-colors"
            >
              View Trip
            </button>
          </div>
        `)
        .on('click', () => {
          onTripSelect?.(trip)
        })

      marker.addTo(map)
      markersRef.current.push(marker)
    })

    // Listen for custom trip select events
    const handleTripSelect = (event: any) => {
      const tripId = event.detail
      const trip = trips.find(t => t.id === tripId)
      if (trip && onTripSelect) {
        onTripSelect(trip)
      }
    }

    window.addEventListener('tripSelect', handleTripSelect)

    return () => {
      window.removeEventListener('tripSelect', handleTripSelect)
    }
  }, [trips, onTripSelect])

  return (
    <div className={`rounded-xl overflow-hidden shadow-lg ${className}`}>
      <div ref={mapRef} className="w-full h-full min-h-[500px]" />
    </div>
  )
}