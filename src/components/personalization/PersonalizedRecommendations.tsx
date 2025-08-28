import { useState, useEffect } from 'react'
import { useUserPreferences } from '../../hooks/useUserPreferences'
import { DestinationCard } from '../cards/DestinationCard'
import { CardSkeleton } from '../cards/CardSkeleton'
import { MapPin, TrendingUp, Star, Clock, DollarSign } from 'lucide-react'

interface Recommendation {
  id: string
  destination: string
  country?: string
  reason: string
  match: number // percentage match
  highlights: string[]
  estimatedBudget?: number
  bestTimeToVisit?: string
  icon: React.ElementType
  duration?: number
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
          destination: 'Mexico City',
          country: 'Mexico',
          reason: 'Perfect for your budget',
          match: 85,
          highlights: ['Amazing street food', 'Rich culture', 'Great value'],
          estimatedBudget: 800,
          bestTimeToVisit: 'Oct-May',
          duration: 5,
          icon: DollarSign
        })
      } else if (budget <= 3000) {
        recs.push({
          id: 'budget-2',
          destination: 'Lisbon',
          country: 'Portugal',
          reason: 'European charm within budget',
          match: 78,
          highlights: ['Historic trams', 'Coastal views', 'Vibrant nightlife'],
          estimatedBudget: 2200,
          bestTimeToVisit: 'Mar-Oct',
          duration: 7,
          icon: DollarSign
        })
      } else {
        recs.push({
          id: 'budget-3',
          destination: 'Tokyo',
          country: 'Japan',
          reason: 'Premium experiences await',
          match: 82,
          highlights: ['Michelin dining', 'Luxury hotels', 'Unique culture'],
          estimatedBudget: 4500,
          bestTimeToVisit: 'Apr-May',
          duration: 10,
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
          destination: 'Queenstown',
          country: 'New Zealand',
          reason: 'Adventure capital matches your style',
          match: 92,
          highlights: ['Bungee jumping', 'Hiking trails', 'Stunning landscapes'],
          bestTimeToVisit: 'Dec-Feb',
          duration: 7,
          icon: TrendingUp
        })
      }

      if (hasRelaxation) {
        recs.push({
          id: 'activity-2',
          destination: 'Bali',
          country: 'Indonesia',
          reason: 'Ultimate relaxation destination',
          match: 88,
          highlights: ['Beach resorts', 'Spa retreats', 'Yoga centers'],
          bestTimeToVisit: 'Apr-Oct',
          duration: 10,
          icon: Clock
        })
      }

      if (hasCultural) {
        recs.push({
          id: 'activity-3',
          destination: 'Istanbul',
          country: 'Turkey',
          reason: 'Rich cultural heritage',
          match: 86,
          highlights: ['Historic sites', 'Grand Bazaar', 'Diverse cuisine'],
          bestTimeToVisit: 'Apr-May',
          duration: 5,
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
        bestTimeToVisit: 'Nov-Mar',
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
        bestTimeToVisit: 'Nov-Feb',
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
      <section className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Recommended for You
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} size="small" />
          ))}
        </div>
      </section>
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
    <section className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Recommended for You
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {recommendations.map((rec) => (
          <DestinationCard
            key={rec.id}
            destination={rec.destination}
            country={rec.country}
            metadata={`${rec.reason.split(' ').slice(0, 3).join(' ')} • ${rec.duration || 7} days`}
            href={`/create?destination=${encodeURIComponent(rec.destination)}`}
            matchPercentage={rec.match}
            size="small"
            infoCards={[
              { type: 'places', value: rec.highlights.length * 3 },
              ...(rec.estimatedBudget ? [{ type: 'budget' as const, value: rec.estimatedBudget }] : []),
              ...(rec.bestTimeToVisit ? [{ type: 'season' as const, value: rec.bestTimeToVisit }] : [])
            ]}
          />
        ))}
      </div>
    </section>
  )
}