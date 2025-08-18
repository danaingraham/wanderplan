// Simple geocoding utility to get coordinates for major cities
// This is a basic implementation - in production, you'd use a real geocoding API

interface CityCoordinates {
  [key: string]: { lat: number; lng: number }
}

const cityCoordinates: CityCoordinates = {
  // Europe
  'paris': { lat: 48.8566, lng: 2.3522 },
  'london': { lat: 51.5074, lng: -0.1278 },
  'rome': { lat: 41.9028, lng: 12.4964 },
  'barcelona': { lat: 41.3851, lng: 2.1734 },
  'madrid': { lat: 40.4168, lng: -3.7038 },
  'berlin': { lat: 52.5200, lng: 13.4050 },
  'amsterdam': { lat: 52.3676, lng: 4.9041 },
  'vienna': { lat: 48.2082, lng: 16.3738 },
  'prague': { lat: 50.0755, lng: 14.4378 },
  'budapest': { lat: 47.4979, lng: 19.0402 },
  'lisbon': { lat: 38.7223, lng: -9.1393 },
  'athens': { lat: 37.9838, lng: 23.7275 },
  'dublin': { lat: 53.3498, lng: -6.2603 },
  'copenhagen': { lat: 55.6761, lng: 12.5683 },
  'stockholm': { lat: 59.3293, lng: 18.0686 },
  'oslo': { lat: 59.9139, lng: 10.7522 },
  'helsinki': { lat: 60.1699, lng: 24.9384 },
  'warsaw': { lat: 52.2297, lng: 21.0122 },
  'moscow': { lat: 55.7558, lng: 37.6173 },
  'istanbul': { lat: 41.0082, lng: 28.9784 },
  
  // North America
  'new york': { lat: 40.7128, lng: -74.0060 },
  'los angeles': { lat: 34.0522, lng: -118.2437 },
  'chicago': { lat: 41.8781, lng: -87.6298 },
  'san francisco': { lat: 37.7749, lng: -122.4194 },
  'miami': { lat: 25.7617, lng: -80.1918 },
  'boston': { lat: 42.3601, lng: -71.0589 },
  'seattle': { lat: 47.6062, lng: -122.3321 },
  'washington': { lat: 38.9072, lng: -77.0369 },
  'toronto': { lat: 43.6532, lng: -79.3832 },
  'vancouver': { lat: 49.2827, lng: -123.1207 },
  'montreal': { lat: 45.5017, lng: -73.5673 },
  'mexico city': { lat: 19.4326, lng: -99.1332 },
  
  // Asia
  'tokyo': { lat: 35.6762, lng: 139.6503 },
  'kyoto': { lat: 35.0116, lng: 135.7681 },
  'osaka': { lat: 34.6937, lng: 135.5023 },
  'beijing': { lat: 39.9042, lng: 116.4074 },
  'shanghai': { lat: 31.2304, lng: 121.4737 },
  'hong kong': { lat: 22.3193, lng: 114.1694 },
  'singapore': { lat: 1.3521, lng: 103.8198 },
  'bangkok': { lat: 13.7563, lng: 100.5018 },
  'seoul': { lat: 37.5665, lng: 126.9780 },
  'taipei': { lat: 25.0330, lng: 121.5654 },
  'dubai': { lat: 25.2048, lng: 55.2708 },
  'delhi': { lat: 28.6139, lng: 77.2090 },
  'mumbai': { lat: 19.0760, lng: 72.8777 },
  
  // South America
  'rio de janeiro': { lat: -22.9068, lng: -43.1729 },
  'sao paulo': { lat: -23.5505, lng: -46.6333 },
  'buenos aires': { lat: -34.6037, lng: -58.3816 },
  'lima': { lat: -12.0464, lng: -77.0428 },
  'santiago': { lat: -33.4489, lng: -70.6693 },
  'bogota': { lat: 4.7110, lng: -74.0721 },
  
  // Africa
  'cairo': { lat: 30.0444, lng: 31.2357 },
  'cape town': { lat: -33.9249, lng: 18.4241 },
  'marrakech': { lat: 31.6295, lng: -7.9811 },
  'nairobi': { lat: -1.2921, lng: 36.8219 },
  
  // Oceania
  'sydney': { lat: -33.8688, lng: 151.2093 },
  'melbourne': { lat: -37.8136, lng: 144.9631 },
  'auckland': { lat: -36.8485, lng: 174.7633 },
  'queenstown': { lat: -45.0312, lng: 168.6626 },
}

export function getCoordinatesForLocation(location: string | null): { latitude: number | null; longitude: number | null } {
  if (!location) {
    return { latitude: null, longitude: null }
  }
  
  // Extract city name from location string (e.g., "Paris, France" -> "paris")
  const cityName = location.toLowerCase().split(',')[0].trim()
  
  // Look up coordinates
  const coords = cityCoordinates[cityName]
  
  if (coords) {
    return { latitude: coords.lat, longitude: coords.lng }
  }
  
  // If not found, return null
  return { latitude: null, longitude: null }
}