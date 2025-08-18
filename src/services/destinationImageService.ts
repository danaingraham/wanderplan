import { googlePlacesService } from './googlePlaces'

// Cache for destination images to avoid repeated API calls
// Separate caches for different sizes
const imageCacheSmall = new Map<string, string>()
const imageCacheLarge = new Map<string, string>()

export async function getDestinationImage(destination: string, size: 'small' | 'large' = 'small'): Promise<string | null> {
  if (!destination) return null
  
  // Check cache first
  const cacheKey = destination.toLowerCase().trim()
  const cache = size === 'large' ? imageCacheLarge : imageCacheSmall
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey) || null
  }
  
  try {
    // Get autocomplete predictions for the destination
    const predictions = await googlePlacesService.getAutocompletePredictions(destination)
    
    if (predictions.length > 0) {
      // Get details for the first prediction
      const placeDetails = await googlePlacesService.getPlaceDetails(predictions[0].place_id)
      
      if (placeDetails.photos && placeDetails.photos.length > 0) {
        // The photo_reference is already a full URL from our service at max resolution (2400px)
        const photoUrl = placeDetails.photos[0].photo_reference
        
        // Cache the result
        cache.set(cacheKey, photoUrl)
        
        return photoUrl
      }
    }
  } catch (error) {
    console.error('Error fetching destination image:', error)
  }
  
  return null
}

// Helper to get a fallback gradient based on destination name
export function getDestinationGradient(destination?: string): string {
  if (!destination) {
    return 'from-red-100 to-red-200'
  }
  
  // Use destination hash to generate consistent colors
  let hash = 0
  for (let i = 0; i < destination.length; i++) {
    hash = destination.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const gradients = [
    'from-blue-100 to-blue-200',
    'from-green-100 to-green-200',
    'from-purple-100 to-purple-200',
    'from-pink-100 to-pink-200',
    'from-indigo-100 to-indigo-200',
    'from-yellow-100 to-yellow-200',
    'from-red-100 to-red-200',
    'from-teal-100 to-teal-200',
  ]
  
  return gradients[Math.abs(hash) % gradients.length]
}