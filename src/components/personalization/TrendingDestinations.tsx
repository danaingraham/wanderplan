import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, Users, Calendar, Sun, Snowflake, Leaf, Flower } from 'lucide-react'
import { useUserPreferences } from '../../hooks/useUserPreferences'

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
}

const SeasonIcon = ({ season }: { season: string }) => {
  switch (season) {
    case 'summer':
      return <Sun className="w-4 h-4" />
    case 'winter':
      return <Snowflake className="w-4 h-4" />
    case 'fall':
      return <Leaf className="w-4 h-4" />
    case 'spring':
      return <Flower className="w-4 h-4" />
    default:
      return <Calendar className="w-4 h-4" />
  }
}

export function TrendingDestinations() {
  const { preferences } = useUserPreferences()
  const [destinations, setDestinations] = useState<TrendingDestination[]>([])
  const [filter, setFilter] = useState<'all' | 'rising' | 'popular' | 'emerging'>('all')
  
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
        matchScore: preferences?.activity_types?.includes('cultural') ? 92 : 75
      },
      {
        id: '2',
        name: 'Reykjavik',
        country: 'Iceland',
        season: 'summer',
        trending: 'popular',
        travelers: 28300,
        tags: ['adventure', 'nature', 'northern lights'],
        matchScore: preferences?.activity_types?.includes('adventure') ? 88 : 70
      },
      {
        id: '3',
        name: 'Marrakech',
        country: 'Morocco',
        season: 'fall',
        trending: 'emerging',
        travelers: 8200,
        tags: ['cultural', 'markets', 'desert'],
        matchScore: preferences?.travel_style?.includes('cultural') ? 85 : 68
      },
      {
        id: '4',
        name: 'Patagonia',
        country: 'Argentina',
        season: 'winter',
        trending: 'rising',
        travelers: 12100,
        tags: ['adventure', 'hiking', 'wildlife'],
        matchScore: preferences?.activity_types?.includes('adventure') ? 94 : 72
      },
      {
        id: '5',
        name: 'Seoul',
        country: 'South Korea',
        season: 'spring',
        trending: 'popular',
        travelers: 31500,
        tags: ['urban', 'food', 'technology'],
        matchScore: preferences?.travel_style?.includes('urban') ? 86 : 74
      },
      {
        id: '6',
        name: 'Santorini',
        country: 'Greece',
        season: 'summer',
        trending: 'popular',
        travelers: 42000,
        tags: ['relaxation', 'romance', 'photography'],
        matchScore: preferences?.activity_types?.includes('relaxation') ? 90 : 78
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
  }

  const filteredDestinations = filter === 'all' 
    ? destinations 
    : destinations.filter(d => d.trending === filter)

  const getTrendingBadgeColor = (trending: string) => {
    switch (trending) {
      case 'rising':
        return 'bg-orange-100 text-orange-800'
      case 'popular':
        return 'bg-blue-100 text-blue-800'
      case 'emerging':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Always show the section even if no destinations for debugging
  if (!destinations || destinations.length === 0) {
    return (
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center mb-4">
          <TrendingUp className="w-5 h-5 mr-2 text-gray-500" />
          Trending Destinations
        </h2>
        <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4">
          Loading trending destinations...
        </div>
      </section>
    )
  }

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
          <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-gray-500" />
          <span className="hidden sm:inline">Trending Destinations</span>
          <span className="sm:hidden">Trending</span>
        </h2>
        
        <div className="flex gap-1 sm:gap-2">
          {(['all', 'rising', 'popular', 'emerging'] as const).map((option) => (
            <button
              key={option}
              onClick={() => setFilter(option)}
              className={`px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded-full capitalize transition-colors ${
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filteredDestinations.slice(0, 6).map((destination) => (
          <Link
            key={destination.id}
            to={`/create?destination=${encodeURIComponent(`${destination.name}, ${destination.country}`)}`}
            className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 transition-all hover:shadow-md group"
          >
            <div className="flex items-start justify-between mb-2 sm:mb-3">
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                  {destination.name}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">{destination.country}</p>
              </div>
              
              <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full capitalize ${getTrendingBadgeColor(destination.trending)}`}>
                {destination.trending === 'emerging' ? 'new' : destination.trending}
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-gray-500 mb-2 sm:mb-3">
              <div className="flex items-center">
                <SeasonIcon season={destination.season} />
                <span className="ml-0.5 sm:ml-1 capitalize">{destination.season}</span>
              </div>
              
              <div className="flex items-center">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
                {(destination.travelers / 1000).toFixed(0)}k
              </div>
              
              {destination.matchScore && destination.matchScore > 80 && (
                <div className="flex items-center text-green-600 font-medium">
                  {destination.matchScore}% match
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-1">
              {destination.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] sm:text-xs bg-gray-100 text-gray-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}