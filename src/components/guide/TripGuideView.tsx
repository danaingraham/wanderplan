import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Calendar, Clock, Users, DollarSign, MapPin, Share2, Bookmark, Edit } from 'lucide-react'
import { TripGuideService } from '../../services/tripGuideService'
import type { TripGuide } from '../../types/guide'
// import GuideHeader from './GuideHeader' // Not currently used
import AccommodationsSection from './AccommodationsSection'
import ActivitiesSection from './ActivitiesSection'
import DiningSection from './DiningSection'
import TransportationSection from './TransportationSection'
import GuideHighlights from './GuideHighlights'
import PackingTips from './PackingTips'
import { useUser } from '../../contexts/UserContext'

const TripGuideView: React.FC = () => {
  const { guideId } = useParams<{ guideId: string }>()
  const navigate = useNavigate()
  const { user } = useUser()
  const [guide, setGuide] = useState<TripGuide | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(false)

  const guideService = new TripGuideService()

  useEffect(() => {
    if (guideId) {
      loadGuide()
    }
  }, [guideId])

  const loadGuide = async () => {
    try {
      setLoading(true)
      
      // First try to load from localStorage
      const savedGuides = JSON.parse(localStorage.getItem('savedGuides') || '{}')
      const localGuide = savedGuides[guideId!]
      
      if (localGuide) {
        setGuide(localGuide)
      } else {
        // If not in localStorage, try database
        try {
          const guideData = await guideService.getGuide(guideId!)
          setGuide(guideData)
          
          // Track view analytics
          if (user) {
            await guideService.trackAnalytics(guideId!, user.id, 'view')
          }
        } catch {
          setError('Guide not found')
        }
      }
    } catch (err) {
      console.error('Error loading guide:', err)
      setError('Failed to load guide')
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    if (!guide) return

    const shareUrl = `${window.location.origin}/guides/${guide.id}`
    const shareText = `Check out this travel guide for ${guide.metadata.destination.city}, ${guide.metadata.destination.country}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Travel Guide: ${guide.metadata.destination.city}`,
          text: shareText,
          url: shareUrl
        })
        
        // Track share analytics
        if (user) {
          await guideService.trackAnalytics(guide.id, user.id, 'share')
        }
      } catch (err) {
        console.error('Error sharing:', err)
      }
    } else {
      // Fallback to copying link
      navigator.clipboard.writeText(shareUrl)
      alert('Link copied to clipboard!')
    }
  }

  const handleSave = async () => {
    if (!guide || !user) return

    try {
      setIsSaved(!isSaved)
      // Track save analytics
      await guideService.trackAnalytics(guide.id, user.id, 'save')
    } catch (err) {
      console.error('Error saving guide:', err)
    }
  }

  const handleEdit = () => {
    if (!guide) return
    navigate(`/guides/${guide.id}/edit`)
  }

  const handleUseForTrip = () => {
    if (!guide) return
    navigate(`/trips/new?fromGuide=${guide.id}`)
    
    // Track use for trip analytics
    if (user) {
      guideService.trackAnalytics(guide.id, user.id, 'use_for_trip')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !guide) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Guide Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The guide you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/guides')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Browse Guides
          </button>
        </div>
      </div>
    )
  }

  const isOwner = user && guide.metadata.author.id === user.id

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Cover Image */}
      <div className="relative h-96 bg-gradient-to-b from-blue-600 to-blue-800">
        {guide.metadata.coverImage && (
          <img
            src={guide.metadata.coverImage}
            alt={`${guide.metadata.destination.city} cover`}
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50"
          />
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 h-full flex flex-col justify-end pb-8">
          <div className="text-white">
            <h1 className="text-5xl font-bold mb-2">
              {guide.metadata.destination.city}, {guide.metadata.destination.country}
            </h1>
            {guide.metadata.destination.region && (
              <p className="text-xl opacity-90">{guide.metadata.destination.region}</p>
            )}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* Author Info */}
              <div className="flex items-center space-x-3">
                {guide.metadata.author.profilePicture ? (
                  <img
                    src={guide.metadata.author.profilePicture}
                    alt={guide.metadata.author.name}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-gray-600 font-semibold">
                      {guide.metadata.author.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Travel Guide by</p>
                  <p className="font-semibold">{guide.metadata.author.name}</p>
                </div>
              </div>

              {/* Trip Info */}
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(0, guide.metadata.travelDate.month - 1).toLocaleString('default', { month: 'long' })} {guide.metadata.travelDate.year}
                  </span>
                </div>
                {guide.metadata.tripDuration && (
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{guide.metadata.tripDuration} days</span>
                  </div>
                )}
                {guide.metadata.groupSize && (
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{guide.metadata.groupSize} {guide.metadata.groupSize === 1 ? 'person' : 'people'}</span>
                  </div>
                )}
                {guide.metadata.budget && (
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-4 h-4" />
                    <span>{guide.metadata.budget}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleUseForTrip}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <MapPin className="w-4 h-4" />
                <span>Use for My Trip</span>
              </button>
              
              <button
                onClick={handleSave}
                className={`p-2 rounded-lg border ${
                  isSaved 
                    ? 'bg-blue-50 border-blue-600 text-blue-600' 
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
              </button>
              
              <button
                onClick={handleShare}
                className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                <Share2 className="w-5 h-5" />
              </button>
              
              {isOwner && (
                <button
                  onClick={handleEdit}
                  className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  <Edit className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Highlights */}
            {guide.highlights && guide.highlights.length > 0 && (
              <GuideHighlights highlights={guide.highlights} />
            )}

            {/* Accommodations */}
            {guide.accommodations.length > 0 && (
              <AccommodationsSection accommodations={guide.accommodations} />
            )}

            {/* Activities */}
            {guide.activities.length > 0 && (
              <ActivitiesSection activities={guide.activities} />
            )}

            {/* Dining */}
            {guide.dining.length > 0 && (
              <DiningSection dining={guide.dining} />
            )}

            {/* Transportation */}
            {guide.transportation && guide.transportation.length > 0 && (
              <TransportationSection transportation={guide.transportation} />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trip Type Badge */}
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-semibold mb-3">Trip Type</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm capitalize">
                  {guide.metadata.tripType}
                </span>
                {guide.metadata.tags?.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Packing Tips */}
            {guide.packingTips && guide.packingTips.length > 0 && (
              <PackingTips tips={guide.packingTips} />
            )}

            {/* Local Tips */}
            {guide.localTips && guide.localTips.length > 0 && (
              <div className="bg-white rounded-lg p-6">
                <h3 className="font-semibold mb-3">Local Tips</h3>
                <ul className="space-y-2">
                  {guide.localTips.map((tip, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Best Time to Visit */}
            {guide.bestTimeToVisit && (
              <div className="bg-white rounded-lg p-6">
                <h3 className="font-semibold mb-3">Best Time to Visit</h3>
                <p className="text-sm text-gray-600">{guide.bestTimeToVisit}</p>
              </div>
            )}

            {/* Things to Avoid */}
            {guide.avoidThese && guide.avoidThese.length > 0 && (
              <div className="bg-white rounded-lg p-6">
                <h3 className="font-semibold mb-3">Things to Avoid</h3>
                <ul className="space-y-2">
                  {guide.avoidThese.map((item, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="text-red-600 mr-2">⚠</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TripGuideView