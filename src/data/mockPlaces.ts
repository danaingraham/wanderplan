import type { MockPlaceData } from '../types'

export const mockPlaces: MockPlaceData[] = [
  // Paris
  {
    id: 'place-1',
    name: 'Eiffel Tower',
    category: 'attraction',
    address: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France',
    latitude: 48.8584,
    longitude: 2.2945,
    photo_url: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52',
    website: 'https://www.toureiffel.paris/',
    rating: 4.6,
    price_level: 2,
    description: 'Iconic iron lattice tower and symbol of Paris'
  },
  {
    id: 'place-2',
    name: 'Le Jules Verne',
    category: 'restaurant',
    address: 'Tour Eiffel, 2nd floor, Avenue Gustave Eiffel, 75007 Paris',
    latitude: 48.8584,
    longitude: 2.2945,
    photo_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0',
    website: 'https://www.lejulesverne-paris.com/',
    rating: 4.4,
    price_level: 4,
    description: 'Michelin-starred restaurant in the Eiffel Tower'
  },
  {
    id: 'place-3',
    name: 'Louvre Museum',
    category: 'attraction',
    address: 'Rue de Rivoli, 75001 Paris, France',
    latitude: 48.8606,
    longitude: 2.3376,
    photo_url: 'https://images.unsplash.com/photo-1566139884782-56e6c1d6b476',
    website: 'https://www.louvre.fr/',
    rating: 4.7,
    price_level: 2,
    description: "World's largest art museum and historic monument"
  },
  
  // Tokyo
  {
    id: 'place-4',
    name: 'Senso-ji Temple',
    category: 'attraction',
    address: '2-3-1 Asakusa, Taito City, Tokyo 111-0032, Japan',
    latitude: 35.7148,
    longitude: 139.7967,
    photo_url: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9',
    rating: 4.3,
    price_level: 0,
    description: 'Ancient Buddhist temple in Asakusa district'
  },
  {
    id: 'place-5',
    name: 'Sukiyabashi Jiro',
    category: 'restaurant',
    address: 'Tsukamoto Sogyo Building, Basement 1 Floor, 4-2-15 Ginza, Chuo City, Tokyo',
    latitude: 35.6762,
    longitude: 139.7653,
    rating: 4.8,
    price_level: 4,
    description: 'World-famous sushi restaurant'
  },
  {
    id: 'place-6',
    name: 'Tokyo Skytree',
    category: 'attraction',
    address: '1-1-2 Oshiage, Sumida City, Tokyo 131-8634, Japan',
    latitude: 35.7101,
    longitude: 139.8107,
    photo_url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf',
    website: 'https://www.tokyo-skytree.jp/',
    rating: 4.2,
    price_level: 2,
    description: 'Broadcasting and observation tower, tallest in Japan'
  },
  
  // New York
  {
    id: 'place-7',
    name: 'Central Park',
    category: 'attraction',
    address: 'New York, NY 10024, USA',
    latitude: 40.7829,
    longitude: -73.9654,
    photo_url: 'https://images.unsplash.com/photo-1518391846015-55a9cc003b25',
    rating: 4.7,
    price_level: 0,
    description: 'Large public park in Manhattan'
  },
  {
    id: 'place-8',
    name: 'Statue of Liberty',
    category: 'attraction',
    address: 'New York, NY 10004, USA',
    latitude: 40.6892,
    longitude: -74.0445,
    photo_url: 'https://images.unsplash.com/photo-1569982175971-d92b01cf8694',
    rating: 4.5,
    price_level: 1,
    description: 'Iconic symbol of freedom and democracy'
  },
  {
    id: 'place-9',
    name: 'Eleven Madison Park',
    category: 'restaurant',
    address: '11 Madison Ave, New York, NY 10010, USA',
    latitude: 40.7424,
    longitude: -73.9877,
    website: 'https://elevenmadisonpark.com/',
    rating: 4.3,
    price_level: 4,
    description: 'Contemporary American fine dining restaurant'
  },
  
  // London
  {
    id: 'place-10',
    name: 'Tower Bridge',
    category: 'attraction',
    address: 'Tower Bridge Rd, London SE1 2UP, UK',
    latitude: 51.5055,
    longitude: -0.0754,
    photo_url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad',
    rating: 4.6,
    price_level: 1,
    description: 'Victorian Gothic bascule bridge across the Thames'
  },
  {
    id: 'place-11',
    name: 'British Museum',
    category: 'attraction',
    address: 'Great Russell St, Bloomsbury, London WC1B 3DG, UK',
    latitude: 51.5194,
    longitude: -0.1270,
    photo_url: 'https://images.unsplash.com/photo-1576773716993-d45c4c0ffdc5',
    website: 'https://www.britishmuseum.org/',
    rating: 4.7,
    price_level: 0,
    description: 'World-famous museum of art and antiquities'
  },
  {
    id: 'place-12',
    name: 'Sketch',
    category: 'restaurant',
    address: '9 Conduit St, Mayfair, London W1S 2XG, UK',
    latitude: 51.5132,
    longitude: -0.1416,
    website: 'https://sketch.london/',
    rating: 4.2,
    price_level: 4,
    description: 'Artistic dining experience with unique interiors'
  }
]

export const getPlacesByDestination = (destination: string): MockPlaceData[] => {
  const destinationMap: Record<string, string[]> = {
    'Paris': ['place-1', 'place-2', 'place-3'],
    'Tokyo': ['place-4', 'place-5', 'place-6'],
    'New York': ['place-7', 'place-8', 'place-9'],
    'London': ['place-10', 'place-11', 'place-12']
  }
  
  // Try exact match first
  let placeIds = destinationMap[destination] || []
  
  // If no exact match, try case-insensitive match
  if (placeIds.length === 0) {
    const lowerDestination = destination.toLowerCase()
    for (const [key, ids] of Object.entries(destinationMap)) {
      if (key.toLowerCase() === lowerDestination) {
        placeIds = ids
        break
      }
    }
  }
  
  // If still no match, return some default places (Paris as fallback)
  if (placeIds.length === 0) {
    placeIds = destinationMap['Paris'] || []
  }
  
  return mockPlaces.filter(place => placeIds.includes(place.id))
}

export const searchPlaces = (query: string, destination?: string): MockPlaceData[] => {
  let places = destination ? getPlacesByDestination(destination) : mockPlaces
  
  if (!query) return places
  
  const searchTerm = query.toLowerCase()
  return places.filter(place =>
    place.name.toLowerCase().includes(searchTerm) ||
    place.category.toLowerCase().includes(searchTerm) ||
    place.address.toLowerCase().includes(searchTerm) ||
    place.description?.toLowerCase().includes(searchTerm)
  )
}