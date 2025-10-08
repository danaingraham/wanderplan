import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Place } from '../../types'

// Fix for default markers in Leaflet with Vite
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
})

interface TripMapProps {
  places: Place[]
  selectedDay?: number
  onPlaceSelect?: (place: Place) => void
  onPlaceHover?: (place: Place | null) => void
  hoveredPlaceId?: string | null
  className?: string
}

// Color scheme for different days
const dayColors = [
  '#ff6b6b', // Day 1 - Primary red
  '#4ecdc4', // Day 2 - Teal
  '#45b7d1', // Day 3 - Blue
  '#f9ca24', // Day 4 - Yellow
  '#6c5ce7', // Day 5 - Purple
  '#a55eea', // Day 6 - Violet
  '#26de81', // Day 7 - Green
  '#fd79a8', // Day 8 - Pink
  '#fdcb6e', // Day 9 - Orange
  '#74b9ff', // Day 10 - Light blue
]

const categoryIcons = {
  restaurant: '🍽️',
  attraction: '🎯',
  hotel: '🏨',
  activity: '🎪',
  shop: '🛍️',
  transport: '🚗',
  tip: '💡',
  cafe: '☕',
  bar: '🍷',
  flight: '✈️',
  accommodation: '🏠',
}

export function TripMap({ places, selectedDay, onPlaceSelect, className = '' }: TripMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const routeLayersRef = useRef<L.Polyline[]>([])

  useEffect(() => {
    if (!mapRef.current) return

    // Initialize map
    const map = L.map(mapRef.current, {
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
    if (!mapInstanceRef.current || places.length === 0) return

    const map = mapInstanceRef.current

    // Clear existing markers and routes
    markersRef.current.forEach(marker => map.removeLayer(marker))
    routeLayersRef.current.forEach(route => map.removeLayer(route))
    markersRef.current = []
    routeLayersRef.current = []

    // Filter places based on selected day
    const filteredPlaces = selectedDay ? places.filter(place => place.day === selectedDay) : places

    if (filteredPlaces.length === 0) return

    const bounds = L.latLngBounds([])

    // Group places by day for routing
    const placesByDay = filteredPlaces.reduce((acc, place) => {
      if (!acc[place.day]) acc[place.day] = []
      acc[place.day].push(place)
      return acc
    }, {} as Record<number, Place[]>)

    // Add markers and routes for each day
    Object.entries(placesByDay).forEach(([dayStr, dayPlaces]) => {
      const day = parseInt(dayStr)
      const dayColor = dayColors[(day - 1) % dayColors.length]

      // Sort places by order within the day
      const sortedPlaces = dayPlaces.sort((a, b) => a.order - b.order)

      // Assign sequence numbers BEFORE filtering
      const placesWithSequence = sortedPlaces.map((place, index) => ({
        ...place,
        sequenceNumber: index + 1
      }))

      // Filter to only places with coordinates
      const placesWithCoords = placesWithSequence.filter(place => place.latitude && place.longitude)

      // Create markers
      placesWithCoords.forEach((place) => {
        if (!place.latitude || !place.longitude) return

        const latlng = L.latLng(place.latitude, place.longitude)
        bounds.extend(latlng)

        // Create custom icon using the pre-calculated sequence number
        const icon = L.divIcon({
          html: `
            <div class="relative">
              <div class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg"
                   style="background-color: ${dayColor}">
                ${place.sequenceNumber}
              </div>
              <div class="absolute -top-8 -left-4 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                ${categoryIcons[place.category] || '📍'} ${place.name}
              </div>
            </div>
          `,
          className: 'group',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        })

        const marker = L.marker([place.latitude, place.longitude], { icon })
          .bindPopup(`
            <div class="p-2 min-w-[200px]">
              <div class="flex items-center mb-2">
                <span class="text-lg mr-2">${categoryIcons[place.category] || '📍'}</span>
                <h3 class="font-semibold text-gray-900">${place.name}</h3>
              </div>
              ${place.address ? `<p class="text-sm text-gray-600 mb-2">${place.address}</p>` : ''}
              ${place.start_time ? `<p class="text-sm text-gray-500"><strong>Time:</strong> ${place.start_time}</p>` : ''}
              ${place.notes ? `<p class="text-sm text-gray-600 mt-2">${place.notes}</p>` : ''}
              <div class="mt-2 flex items-center justify-between">
                <span class="text-xs px-2 py-1 bg-gray-100 rounded-full">${place.category}</span>
                <span class="text-xs text-gray-500">Day ${place.day}</span>
              </div>
            </div>
          `)
          .on('click', () => {
            if (onPlaceSelect) onPlaceSelect(place)
          })

        marker.addTo(map)
        markersRef.current.push(marker)
      })

      // Create route between places for this day (only for places with coords)
      if (placesWithCoords.length > 1) {
        const routeCoords = placesWithCoords.map(place => [place.latitude!, place.longitude!] as [number, number])
        
        const polyline = L.polyline(routeCoords, {
          color: dayColor,
          weight: 3,
          opacity: 0.7,
          dashArray: selectedDay && selectedDay !== day ? '5, 5' : undefined,
        }).addTo(map)

        routeLayersRef.current.push(polyline)
      }
    })

    // Fit map to bounds
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] })
    }
  }, [places, selectedDay, onPlaceSelect])

  return (
    <div className={`rounded-xl overflow-hidden shadow-lg ${className}`}>
      <div ref={mapRef} className="w-full h-full min-h-[400px]" />
    </div>
  )
}