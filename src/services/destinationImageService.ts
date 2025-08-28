import { googlePlacesService } from './googlePlaces'
import { getDestinationImageUnsplash } from './unsplash'

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
    // Try Google Places first
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
    console.log('Google Places failed, falling back to Unsplash for:', destination)
  }
  
  // Fallback to Unsplash if Google Places fails or returns no photos
  try {
    const unsplashUrl = getDestinationImageUnsplash(destination, size)
    
    // Cache the Unsplash URL
    cache.set(cacheKey, unsplashUrl)
    
    return unsplashUrl
  } catch (error) {
    console.error('Error fetching destination image from both sources:', error)
  }
  
  return null
}

// Helper to get a fallback gradient based on destination name
export function getDestinationGradient(destination?: string): string {
  if (!destination) {
    return 'from-primary-400 to-secondary-400'
  }
  
  // Use destination hash to generate consistent colors
  let hash = 0
  for (let i = 0; i < destination.length; i++) {
    hash = destination.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  // More vibrant gradients that look good with overlaid text
  const gradients = [
    'from-blue-400 to-indigo-600',
    'from-green-400 to-emerald-600',
    'from-purple-400 to-pink-600',
    'from-orange-400 to-red-600',
    'from-teal-400 to-cyan-600',
    'from-amber-400 to-orange-600',
    'from-rose-400 to-pink-600',
    'from-violet-400 to-purple-600',
    'from-sky-400 to-blue-600',
    'from-lime-400 to-green-600',
  ]
  
  return gradients[Math.abs(hash) % gradients.length]
}