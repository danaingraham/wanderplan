import { useState, useEffect } from 'react'
import { useUserPreferences } from '../../hooks/useUserPreferences'
import { DestinationCard } from '../cards/DestinationCard'
import { CardSkeleton } from '../cards/CardSkeleton'

interface TrendingDestination {
  id: string
  name: string
  country: string
  season: 'spring' | 'summer' | 'fall' | 'winter'
  trending: 'rising' | 'popular' | 'emerging'
  travelers: number
  matchScore?: number
  tags: string[]
  imageUrl?: string
  duration: number
  budget?: number
}

export function TrendingDestinations() {
  const { preferences } = useUserPreferences()
  const [destinations, setDestinations] = useState<TrendingDestination[]>([])
  const [filter, setFilter] = useState<'all' | 'rising' | 'popular' | 'emerging'>('all')
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadTrendingDestinations()
  }, [preferences])

  const loadTrendingDestinations = () => {
    // Get current season
    const month = new Date().getMonth()
    const currentSeason = 
      month >= 2 && month <= 4 ? 'spring' :
      month >= 5 && month <= 7 ? 'summer' :
      month >= 8 && month <= 10 ? 'fall' : 'winter'

    // Mock trending destinations - in real app, this would come from an API
    const mockDestinations: TrendingDestination[] = [
      {
        id: '1',
        name: 'Kyoto',
        country: 'Japan',
        season: 'spring',
        trending: 'rising',
        travelers: 15420,
        tags: ['cultural', 'photography', 'food'],
        matchScore: preferences?.activity_types?.includes('cultural') ? 92 : 75,
        duration: 7,
        budget: 2500
      },
      {
        id: '2',
        name: 'Reykjavik',
        country: 'Iceland',
        season: 'summer',
        trending: 'popular',
        travelers: 28300,
        tags: ['adventure', 'nature', 'northern lights'],
        matchScore: preferences?.activity_types?.includes('adventure') ? 88 : 70,
        duration: 5,
        budget: 3200
      },
      {
        id: '3',
        name: 'Marrakech',
        country: 'Morocco',
        season: 'fall',
        trending: 'emerging',
        travelers: 8200,
        tags: ['cultural', 'markets', 'desert'],
        matchScore: preferences?.travel_style?.includes('cultural') ? 85 : 68,
        duration: 6,
        budget: 1800
      },
      {
        id: '4',
        name: 'Patagonia',
        country: 'Argentina',
        season: 'winter',
        trending: 'rising',
        travelers: 12100,
        tags: ['adventure', 'hiking', 'wildlife'],
        matchScore: preferences?.activity_types?.includes('adventure') ? 94 : 72,
        duration: 10,
        budget: 4000
      },
      {
        id: '5',
        name: 'Seoul',
        country: 'South Korea',
        season: 'spring',
        trending: 'popular',
        travelers: 31500,
        tags: ['urban', 'food', 'technology'],
        matchScore: preferences?.travel_style?.includes('urban') ? 86 : 74,
        duration: 5,
        budget: 2000
      },
      {
        id: '6',
        name: 'Santorini',
        country: 'Greece',
        season: 'summer',
        trending: 'popular',
        travelers: 42000,
        tags: ['relaxation', 'romance', 'photography'],
        matchScore: preferences?.activity_types?.includes('relaxation') ? 90 : 78,
        duration: 4,
        budget: 2800
      }
    ]

    // Sort by match score if preferences exist
    if (preferences) {
      mockDestinations.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    }

    // Prioritize current season destinations
    mockDestinations.sort((a, b) => {
      if (a.season === currentSeason && b.season !== currentSeason) return -1
      if (a.season !== currentSeason && b.season === currentSeason) return 1
      return 0
    })

    setDestinations(mockDestinations)
    setLoading(false)
  }

  const filteredDestinations = filter === 'all' 
    ? destinations 
    : destinations.filter(d => d.trending === filter)

  if (loading) {
    return (
      <section className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Trending Destinations
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} size="medium" />
          ))}
        </div>
      </section>
    )
  }

  if (!destinations || destinations.length === 0) {
    return null
  }

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          Trending Destinations
        </h2>
        
        <div className="flex gap-2">
          {(['all', 'rising', 'popular', 'emerging'] as const).map((option) => (
            <button
              key={option}
              onClick={() => setFilter(option)}
              className={`px-3 py-1 text-xs rounded-full capitalize transition-colors ${
                filter === option
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {option === 'emerging' ? 'New' : option}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDestinations.slice(0, 6).map((destination) => {
          // Convert season to specific months
          const seasonMonths = {
            spring: 'Mar-May',
            summer: 'Jun-Aug',
            fall: 'Sep-Nov',
            winter: 'Dec-Feb'
          }
          
          return (
            <DestinationCard
              key={destination.id}
              destination={destination.name}
              country={destination.country}
              metadata={`${destination.tags[0]} • ${destination.duration} days`}
              href={`/create?destination=${encodeURIComponent(`${destination.name}, ${destination.country}`)}`}
              matchPercentage={destination.matchScore && destination.matchScore > 80 ? destination.matchScore : undefined}
              size="medium"
              infoCards={[
                { type: 'season', value: seasonMonths[destination.season] || 'Year-round' },
                { type: 'budget', value: destination.budget || 2000 },
                { type: 'places', value: Math.floor(destination.duration * 3) }
              ]}
            />
          )
        })}
      </div>
    </section>
  )
}