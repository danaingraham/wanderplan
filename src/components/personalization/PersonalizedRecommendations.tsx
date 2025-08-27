import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, TrendingUp, Star, Clock, DollarSign } from 'lucide-react'
import { useUserPreferences } from '../../hooks/useUserPreferences'
import { formatCurrency } from '../../utils/formatters'

interface Recommendation {
  id: string
  destination: string
  reason: string
  match: number // percentage match
  highlights: string[]
  estimatedBudget?: number
  bestTimeToVisit?: string
  icon: React.ElementType
}

export function PersonalizedRecommendations() {
  const { preferences } = useUserPreferences()
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    generateRecommendations()
  }, [preferences])

  const generateRecommendations = () => {
    if (!preferences) {
      setLoading(false)
      return
    }

    // Generate recommendations based on user preferences
    const recs: Recommendation[] = []

    // Budget-based recommendations
    if (preferences.budget_range?.max) {
      const budget = preferences.budget_range.max
      
      if (budget <= 1500) {
        recs.push({
          id: 'budget-1',
          destination: 'Mexico City, Mexico',
          reason: 'Perfect for your budget',
          match: 85,
          highlights: ['Amazing street food', 'Rich culture', 'Great value'],
          estimatedBudget: 800,
          bestTimeToVisit: 'Oct - May',
          icon: DollarSign
        })
      } else if (budget <= 3000) {
        recs.push({
          id: 'budget-2',
          destination: 'Lisbon, Portugal',
          reason: 'European charm within budget',
          match: 78,
          highlights: ['Historic trams', 'Coastal views', 'Vibrant nightlife'],
          estimatedBudget: 2200,
          bestTimeToVisit: 'Mar - Oct',
          icon: DollarSign
        })
      } else {
        recs.push({
          id: 'budget-3',
          destination: 'Tokyo, Japan',
          reason: 'Premium experiences await',
          match: 82,
          highlights: ['Michelin dining', 'Luxury hotels', 'Unique culture'],
          estimatedBudget: 4500,
          bestTimeToVisit: 'Apr - May, Oct - Nov',
          icon: Star
        })
      }
    }

    // Activity-based recommendations
    if (preferences.activity_types?.length > 0) {
      const hasAdventure = preferences.activity_types.includes('adventure')
      const hasRelaxation = preferences.activity_types.includes('relaxation')
      const hasCultural = preferences.activity_types.includes('cultural')

      if (hasAdventure) {
        recs.push({
          id: 'activity-1',
          destination: 'Queenstown, New Zealand',
          reason: 'Adventure capital matches your style',
          match: 92,
          highlights: ['Bungee jumping', 'Hiking trails', 'Stunning landscapes'],
          bestTimeToVisit: 'Dec - Feb',
          icon: TrendingUp
        })
      }

      if (hasRelaxation) {
        recs.push({
          id: 'activity-2',
          destination: 'Bali, Indonesia',
          reason: 'Ultimate relaxation destination',
          match: 88,
          highlights: ['Beach resorts', 'Spa retreats', 'Yoga centers'],
          bestTimeToVisit: 'Apr - Oct',
          icon: Clock
        })
      }

      if (hasCultural) {
        recs.push({
          id: 'activity-3',
          destination: 'Istanbul, Turkey',
          reason: 'Rich cultural heritage',
          match: 86,
          highlights: ['Historic sites', 'Grand Bazaar', 'Diverse cuisine'],
          bestTimeToVisit: 'Apr - May, Sep - Nov',
          icon: MapPin
        })
      }
    }

    // Travel style based recommendations
    if (preferences.travel_style?.includes('luxury')) {
      recs.push({
        id: 'style-1',
        destination: 'Dubai, UAE',
        reason: 'Luxury travel paradise',
        match: 90,
        highlights: ['5-star hotels', 'World-class shopping', 'Fine dining'],
        estimatedBudget: 5000,
        bestTimeToVisit: 'Nov - Mar',
        icon: Star
      })
    } else if (preferences.travel_style?.includes('budget')) {
      recs.push({
        id: 'style-2',
        destination: 'Bangkok, Thailand',
        reason: 'Budget-friendly adventure',
        match: 87,
        highlights: ['Street markets', 'Affordable luxury', 'Vibrant culture'],
        estimatedBudget: 1200,
        bestTimeToVisit: 'Nov - Feb',
        icon: DollarSign
      })
    }

    // Limit to top 4 recommendations, sorted by match percentage
    const topRecs = recs
      .sort((a, b) => b.match - a.match)
      .slice(0, 4)

    setRecommendations(topRecs)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="skeleton h-6 w-48 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="card">
              <div className="skeleton h-4 w-32 mb-2"></div>
              <div className="skeleton-text w-full"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Always show section for debugging
  if (recommendations.length === 0) {
    return (
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Recommended for You
        </h2>
        <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4">
          Create your Travel DNA in your profile to get personalized recommendations!
        </div>
      </section>
    )
  }

  return (
    <section className="mb-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
        Recommended for You
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {recommendations.map((rec) => {
          const Icon = rec.icon
          return (
            <Link
              key={rec.id}
              to={`/create?destination=${encodeURIComponent(rec.destination)}`}
              className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 transition-all duration-300 hover:shadow-md group relative overflow-hidden"
            >
              {/* Match indicator */}
              <div className="absolute top-2 right-2">
                <div className="text-[10px] sm:text-xs bg-green-100 text-green-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium">
                  {rec.match}%
                </div>
              </div>

              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                    {rec.destination}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 line-clamp-2">
                    {rec.reason}
                  </p>
                  
                  <div className="mt-2 sm:mt-3 space-y-0.5 sm:space-y-1 hidden sm:block">
                    {rec.highlights.slice(0, 2).map((highlight, idx) => (
                      <div key={idx} className="text-[10px] sm:text-xs text-gray-500 flex items-center">
                        <span className="w-1 h-1 bg-gray-400 rounded-full mr-1.5"></span>
                        {highlight}
                      </div>
                    ))}
                  </div>

                  {(rec.estimatedBudget || rec.bestTimeToVisit) && (
                    <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] sm:text-xs">
                      {rec.estimatedBudget && (
                        <span className="text-gray-500">
                          ~{formatCurrency(rec.estimatedBudget)}
                        </span>
                      )}
                      {rec.bestTimeToVisit && (
                        <span className="text-gray-500">
                          {rec.bestTimeToVisit}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}