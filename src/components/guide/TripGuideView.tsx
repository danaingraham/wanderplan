import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Calendar, Clock, Users, DollarSign, MapPin, Share2, Bookmark, Edit } from 'lucide-react'
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

  useEffect(() => {
    if (guideId) {
      loadGuide()
    }
  }, [guideId])

  const loadGuide = async () => {
    try {
      setLoading(true)
      console.log('🔍 TripGuideView: Loading guide with ID:', guideId)
      
      // First try to load from localStorage savedGuides
      // Handle both array format (old) and object format (new)
      const savedGuidesRaw = localStorage.getItem('savedGuides')
      let savedGuides: any = {}
      
      if (savedGuidesRaw) {
        try {
          const parsed = JSON.parse(savedGuidesRaw)
          // If it's an array (old format), convert to object
          if (Array.isArray(parsed)) {
            console.log('🔍 TripGuideView: savedGuides is array format:', parsed)
            savedGuides = {}
          } else {
            savedGuides = parsed
          }
        } catch (e) {
          console.error('Error parsing savedGuides:', e)
          savedGuides = {}
        }
      }
      
      console.log('🔍 TripGuideView: Saved guides in localStorage:', Object.keys(savedGuides))
      const localGuide = savedGuides[guideId!]
      console.log('🔍 TripGuideView: Found local guide:', !!localGuide, localGuide)
      
      if (localGuide) {
        // Ensure the guide has all required metadata fields
        const processedGuide = {
          ...localGuide,
          metadata: {
            ...localGuide.metadata,
            destination: localGuide.metadata?.destination || { city: 'Unknown', country: 'Unknown' },
            author: localGuide.metadata?.author || { id: 'unknown', name: 'Unknown Author' },
            tripType: localGuide.metadata?.tripType || 'solo',
            travelDate: localGuide.metadata?.travelDate || { month: 1, year: new Date().getFullYear() },
            createdAt: localGuide.metadata?.createdAt || new Date(),
            updatedAt: localGuide.metadata?.updatedAt || new Date(),
            isPublished: localGuide.metadata?.isPublished !== undefined ? localGuide.metadata.isPublished : true
          }
        }
        console.log('🔍 TripGuideView: Processed guide:', processedGuide)
        setGuide(processedGuide)
        setLoading(false)
      } else {
        // If not in savedGuides, try to find it as a trip with is_guide flag
        const trips = JSON.parse(localStorage.getItem('wanderplan_trips') || '[]')
        const tripGuide = trips.find((t: any) => t.id === guideId && t.is_guide)
        
        if (tripGuide) {
          // Load places for this trip to convert to activities
          const places = JSON.parse(localStorage.getItem('wanderplan_places') || '[]')
          const tripPlaces = places.filter((p: any) => p.trip_id === tripGuide.id)
          
          // Convert places to guide sections
          const activities: any[] = []
          const dining: any[] = []
          const accommodations: any[] = []
          
          tripPlaces.forEach((place: any) => {
            const item = {
              id: place.id,
              name: place.name,
              description: place.notes || '',
              location: place.address,
              category: place.category
            }
            
            if (place.category === 'restaurant' || place.category === 'cafe') {
              dining.push({
                ...item,
                cuisine: 'Local',
                mealTypes: ['lunch', 'dinner'] as any[],
                neighborhood: place.address?.split(',')[0] || '',
                priceRange: place.price_level ? '$'.repeat(Math.min(place.price_level, 4)) as any : '$$',
                images: [],
                reservationRequired: false
              })
            } else if (place.category === 'hotel' || place.category === 'accommodation') {
              accommodations.push({
                ...item,
                type: 'hotel' as any,
                neighborhood: place.address?.split(',')[0] || '',
                priceRange: '$$' as any,
                images: [],
                bookingLinks: []
              })
            } else {
              activities.push({
                ...item,
                category: place.category || 'sightseeing',
                duration: place.duration ? `${place.duration} hours` : '2-3 hours',
                images: [],
                bookingRequired: false
              })
            }
          })
          
          // Convert trip to guide format
          const convertedGuide = {
            id: tripGuide.id,
            metadata: {
              destination: {
                city: tripGuide.destination?.split(',')[0]?.trim() || 'Unknown',
                country: tripGuide.destination?.split(',')[1]?.trim() || 'Unknown'
              },
              author: {
                id: tripGuide.created_by || 'unknown',
                name: user?.full_name || 'Travel Expert'
              },
              tripType: 'solo' as const,
              travelDate: {
                month: tripGuide.start_date ? new Date(tripGuide.start_date).getMonth() + 1 : 1,
                year: tripGuide.start_date ? new Date(tripGuide.start_date).getFullYear() : new Date().getFullYear()
              },
              createdAt: new Date(tripGuide.created_date || Date.now()),
              updatedAt: new Date(tripGuide.updated_date || Date.now()),
              isPublished: tripGuide.is_public || false,
              coverImage: tripGuide.cover_image,
              tripDuration: tripGuide.duration,
              groupSize: tripGuide.group_size,
              budget: tripGuide.budget,
              title: tripGuide.title || `${tripGuide.destination} Guide`
            },
            accommodations,
            activities,
            dining,
            transportation: [],
            itineraryId: tripGuide.id,
            highlights: tripGuide.highlights || [],
            packingTips: tripGuide.packing_tips || [],
            localTips: tripGuide.local_tips || [],
            bestTimeToVisit: tripGuide.best_time_to_visit
          }
          
          console.log('🔍 TripGuideView: Converted trip to guide:', convertedGuide)
          setGuide(convertedGuide)
          setLoading(false)
        } else {
          // Guide not found anywhere
          console.error('Guide not found in localStorage or trips')
          setError('Guide not found')
          setLoading(false)
        }
      }
    } catch (err) {
      console.error('Error loading guide:', err)
      setError('Failed to load guide')
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
        
        // Analytics tracking removed - would require database
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
      // Analytics tracking removed - would require database
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
    
    // Analytics tracking removed - would require database
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
            {/* Check if guide has any content */}
            {guide.accommodations.length === 0 && 
             guide.activities.length === 0 && 
             guide.dining.length === 0 && 
             (!guide.transportation || guide.transportation.length === 0) &&
             (!guide.highlights || guide.highlights.length === 0) ? (
              <div className="bg-white rounded-lg p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <MapPin className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Guide Content Coming Soon</h3>
                <p className="text-gray-600 mb-4">
                  This guide is being prepared. Check back soon for recommendations on accommodations, activities, dining, and more!
                </p>
                {isOwner && (
                  <button
                    onClick={handleEdit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Content to Guide
                  </button>
                )}
              </div>
            ) : (
              <>
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
              </>
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