import { Link, useNavigate } from 'react-router-dom'
import { MapPin, Calendar, Users, Sparkles, TrendingUp, ArrowRight, Plus } from 'lucide-react'
import { useTrips } from '../contexts/TripContext'
import { formatDate, isDateInFuture } from '../utils/date'
import { useUserPreferences } from '../hooks/useUserPreferences'
import { calculateCompleteness } from '../utils/travelDNA'
import { EmailVerificationBanner } from '../components/auth/EmailVerificationBanner'
import { PersonalizedRecommendations } from '../components/personalization/PersonalizedRecommendations'
import { TrendingDestinations } from '../components/personalization/TrendingDestinations'
import { userActivityService } from '../services/userActivity'
import { useEffect, useState } from 'react'

export function Dashboard() {
  const { trips, loading } = useTrips()
  const { preferences } = useUserPreferences()
  const navigate = useNavigate()
  const [isMobile, setIsMobile] = useState(false)
  
  const dnaCompleteness = preferences ? calculateCompleteness(preferences) : 0
  const hasDNA = dnaCompleteness > 0

  // Check viewport size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // Use lg breakpoint to match navigation
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Track page view
  useEffect(() => {
    console.log('🏠 Dashboard: Component mounted')
    userActivityService.trackActivity('trip_view', 'dashboard', {
      tripTitle: 'Dashboard',
      destination: 'Home'
    })
  }, [])

  console.log('📊 Dashboard: Rendering with trips:', trips.length)
  console.log('📊 Dashboard: Loading state:', loading)
  console.log('📊 Dashboard: Preferences:', preferences)
  console.log('📊 Dashboard: Trip details:', trips.map(trip => ({ id: trip.id, title: trip.title, created_by: trip.created_by })))

  // Sort trips by updated date (most recent first)
  const allTrips = trips
    .sort((a, b) => new Date(b.updated_date).getTime() - new Date(a.updated_date).getTime())

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="animate-pulse">
          <div className="skeleton h-8 w-64 mb-2"></div>
          <div className="skeleton-text w-96 mb-8"></div>
          
          {/* Skeleton cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card">
                <div className="skeleton h-6 w-48 mb-4"></div>
                <div className="space-y-2">
                  <div className="skeleton-text w-full"></div>
                  <div className="skeleton-text w-3/4"></div>
                  <div className="skeleton-text w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Email Verification Banner */}
      <EmailVerificationBanner />
      
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Travel DNA Prompt - Show only if user hasn't created their DNA */}
      {!hasDNA && (
        <div className="mb-6 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-6 border border-primary-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Create Your Travel DNA</p>
                <p className="text-sm text-gray-600">Get personalized trip recommendations based on your unique travel style</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Create DNA
            </button>
          </div>
        </div>
      )}

      {/* Personalized Sections */}
      <PersonalizedRecommendations />
      <TrendingDestinations />



      {/* Call to Action - when no trips */}
      {trips.length === 0 && (
        <section className="mt-8">
          <div className="bg-gradient-to-br from-primary-50 via-white to-secondary-50 rounded-2xl p-6 md:p-8 border border-primary-100 text-center">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
                Start Your Journey
              </h2>
              <p className="text-sm md:text-base text-gray-600 mb-6">
                Create your first AI-powered itinerary and discover personalized travel recommendations
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Link
                  to="/create"
                  className="inline-flex items-center justify-center px-5 sm:px-6 py-2.5 sm:py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors shadow-lg hover:shadow-xl"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Trip
                </Link>
                <Link
                  to="/profile"
                  className="inline-flex items-center justify-center px-5 sm:px-6 py-2.5 sm:py-3 bg-white text-primary-600 font-medium rounded-lg hover:bg-gray-50 transition-colors border border-primary-200"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Create Travel DNA
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
    </>
  )
}