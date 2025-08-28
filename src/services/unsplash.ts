// Simple Unsplash image service for destination images
// Using Unsplash Source API which doesn't require authentication

const UNSPLASH_BASE = 'https://source.unsplash.com'

// Cache for Unsplash URLs
const unsplashCache = new Map<string, string>()

export function getUnsplashImage(query: string, width = 800, height = 600): string {
  const cacheKey = `${query}-${width}x${height}`
  
  if (unsplashCache.has(cacheKey)) {
    return unsplashCache.get(cacheKey)!
  }
  
  // Unsplash Source API: https://source.unsplash.com/{WIDTH}x{HEIGHT}/?{QUERY}
  const url = `${UNSPLASH_BASE}/${width}x${height}/?${encodeURIComponent(query)},travel,landscape`
  
  unsplashCache.set(cacheKey, url)
  return url
}

// Get a travel/destination related image
export function getDestinationImageUnsplash(destination: string, size: 'small' | 'large' = 'small'): string {
  const dimensions = size === 'large' ? { width: 1200, height: 800 } : { width: 600, height: 400 }
  
  // Add travel-related keywords for better results
  const searchQuery = `${destination} travel destination`
  
  return getUnsplashImage(searchQuery, dimensions.width, dimensions.height)
}