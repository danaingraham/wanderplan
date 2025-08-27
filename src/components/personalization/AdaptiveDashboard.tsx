import { useState, useEffect } from 'react'
import { Sparkles, Calendar, Globe, Heart, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useUserPreferences } from '../../hooks/useUserPreferences'
import { userActivityService } from '../../services/userActivity'

interface DashboardInsight {
  id: string
  type: 'tip' | 'achievement' | 'suggestion' | 'milestone'
  icon: React.ElementType
  title: string
  description: string
  action?: {
    label: string
    link: string
  }
}

export function AdaptiveDashboard() {
  const { preferences } = useUserPreferences()
  const [insights, setInsights] = useState<DashboardInsight[]>([])
  const [userStats, setUserStats] = useState<any>(null)
  const [greeting, setGreeting] = useState<string>('')

  useEffect(() => {
    console.log('🎯 AdaptiveDashboard: Initializing with preferences:', preferences)
    updateGreeting()
    loadUserStats()
    generateInsights()
  }, [preferences])

  const updateGreeting = () => {
    const hour = new Date().getHours()
    const patterns = userActivityService.getUserPatterns()
    
    let baseGreeting = ''
    if (hour < 12) {
      baseGreeting = 'Good morning'
    } else if (hour < 18) {
      baseGreeting = 'Good afternoon'
    } else {
      baseGreeting = 'Good evening'
    }

    // Personalize based on activity patterns
    if (patterns.totalTripsViewed > 10) {
      setGreeting(`${baseGreeting}, travel enthusiast!`)
    } else if (patterns.totalTripsViewed > 5) {
      setGreeting(`${baseGreeting}, explorer!`)
    } else if (patterns.totalTripsViewed > 0) {
      setGreeting(`${baseGreeting}, adventurer!`)
    } else {
      setGreeting(`${baseGreeting}! Ready to start planning?`)
    }
  }

  const loadUserStats = () => {
    const stats = userActivityService.getStats()
    const patterns = userActivityService.getUserPatterns()
    
    setUserStats({
      ...stats,
      ...patterns
    })
  }

  const generateInsights = () => {
    const newInsights: DashboardInsight[] = []
    const patterns = userActivityService.getUserPatterns()
    const stats = userActivityService.getStats()

    // First-time user insight
    if (stats.totalActivities === 0) {
      newInsights.push({
        id: 'welcome',
        type: 'tip',
        icon: Sparkles,
        title: 'Welcome to Wanderplan!',
        description: 'Start by creating your Travel DNA to get personalized recommendations',
        action: {
          label: 'Create Travel DNA',
          link: '/profile'
        }
      })
    }

    // Activity-based insights
    if (patterns.totalTripsViewed >= 5) {
      newInsights.push({
        id: 'explorer',
        type: 'achievement',
        icon: Globe,
        title: 'Active Explorer',
        description: `You've viewed ${patterns.totalTripsViewed} trips! Your wanderlust is inspiring.`
      })
    }

    // Preference-based suggestions
    if (preferences) {
      if (preferences.activity_types?.includes('adventure')) {
        newInsights.push({
          id: 'adventure-seeker',
          type: 'suggestion',
          icon: Zap,
          title: 'Adventure Awaits',
          description: 'Based on your preferences, check out our extreme sports destinations',
          action: {
            label: 'Explore Adventures',
            link: '/create?style=adventure'
          }
        })
      }

      if (preferences.travel_style?.includes('luxury')) {
        newInsights.push({
          id: 'luxury-travel',
          type: 'suggestion',
          icon: Heart,
          title: 'Luxury Escapes',
          description: 'Discover premium travel experiences tailored to your taste',
          action: {
            label: 'View Luxury Trips',
            link: '/create?style=luxury'
          }
        })
      }
    }

    // Time-based suggestions
    const month = new Date().getMonth()
    if (month >= 11 || month <= 1) {
      newInsights.push({
        id: 'winter-planning',
        type: 'tip',
        icon: Calendar,
        title: 'Winter Travel Season',
        description: 'Perfect time to plan ski trips or tropical getaways',
        action: {
          label: 'Plan Winter Trip',
          link: '/create'
        }
      })
    } else if (month >= 5 && month <= 7) {
      newInsights.push({
        id: 'summer-planning',
        type: 'tip',
        icon: Calendar,
        title: 'Summer Adventures',
        description: 'Peak season for European tours and beach destinations',
        action: {
          label: 'Plan Summer Trip',
          link: '/create'
        }
      })
    }

    // Most viewed destinations insight
    if (patterns.mostViewedDestinations.length > 0) {
      newInsights.push({
        id: 'favorite-destinations',
        type: 'milestone',
        icon: Heart,
        title: 'Your Favorite Destinations',
        description: `You seem to love ${patterns.mostViewedDestinations.slice(0, 2).join(' and ')}!`
      })
    }

    setInsights(newInsights.slice(0, 3)) // Show max 3 insights
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'tip':
        return 'bg-blue-50 border-blue-200 text-blue-900'
      case 'achievement':
        return 'bg-green-50 border-green-200 text-green-900'
      case 'suggestion':
        return 'bg-purple-50 border-purple-200 text-purple-900'
      case 'milestone':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900'
    }
  }

  const getIconColor = (type: string) => {
    switch (type) {
      case 'tip':
        return 'text-blue-600'
      case 'achievement':
        return 'text-green-600'
      case 'suggestion':
        return 'text-purple-600'
      case 'milestone':
        return 'text-yellow-600'
      default:
        return 'text-gray-600'
    }
  }

  // Always show something for debugging
  if (insights.length === 0) {
    return (
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {greeting || 'Welcome back!'}
        </h2>
        <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4">
          Start exploring trips to see personalized insights here!
        </div>
      </section>
    )
  }

  return (
    <section className="mb-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
        {greeting}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {insights.map((insight) => {
          const Icon = insight.icon
          
          return (
            <div
              key={insight.id}
              className={`p-3 sm:p-4 rounded-lg border ${getInsightColor(insight.type)}`}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <div className={`${getIconColor(insight.type)}`}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-xs sm:text-sm mb-1 truncate">
                    {insight.title}
                  </h3>
                  <p className="text-[10px] sm:text-xs opacity-75 mb-2 line-clamp-2">
                    {insight.description}
                  </p>
                  
                  {insight.action && (
                    <Link
                      to={insight.action.link}
                      className="inline-flex items-center text-xs font-medium hover:underline"
                    >
                      {insight.action.label} →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {userStats && userStats.averageSessionLength > 0 && (
        <div className="mt-4 text-xs text-gray-500 text-center">
          Average session: {userStats.averageSessionLength} minutes • 
          Most active: {userStats.preferredTimes?.[0] || 'anytime'}
        </div>
      )}
    </section>
  )
}