import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Save, X, Plus, Trash2, Globe, Lock, 
  ChevronDown, ChevronUp, Loader2 
} from 'lucide-react'
import { TripGuideService } from '../../services/tripGuideService'
import { DataEnrichmentService } from '../../services/dataEnrichmentService'
import type { 
  TripGuide, 
  GuideUpdateRequest,
  AccommodationRecommendation,
  TripType,
  PriceRange
} from '../../types/guide'
import { useUser } from '../../contexts/UserContext'

const GuideEditor: React.FC = () => {
  const { guideId } = useParams<{ guideId: string }>()
  const navigate = useNavigate()
  const { user } = useUser()
  const [guide, setGuide] = useState<TripGuide | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [enriching, setEnriching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    metadata: true,
    accommodations: true,
    activities: true,
    dining: true,
    transportation: true,
    tips: true
  })

  const guideService = new TripGuideService()
  const enrichmentService = new DataEnrichmentService()

  useEffect(() => {
    if (guideId) {
      loadGuide()
    } else {
      // New guide
      setLoading(false)
    }
  }, [guideId])

  const loadGuide = async () => {
    try {
      setLoading(true)
      const guideData = await guideService.getGuide(guideId!)
      
      // Verify ownership
      if (guideData.metadata.author.id !== user?.id) {
        setError('You do not have permission to edit this guide')
        return
      }
      
      setGuide(guideData)
    } catch (err) {
      console.error('Error loading guide:', err)
      setError('Failed to load guide')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!guide || !user) return

    try {
      setSaving(true)
      
      const updateRequest: GuideUpdateRequest = {
        metadata: guide.metadata,
        accommodations: guide.accommodations,
        activities: guide.activities,
        dining: guide.dining,
        transportation: guide.transportation,
        highlights: guide.highlights,
        packingTips: guide.packingTips,
        localTips: guide.localTips,
        bestTimeToVisit: guide.bestTimeToVisit,
        avoidThese: guide.avoidThese
      }

      if (guideId) {
        await guideService.updateGuide(guideId, updateRequest, user.id)
      } else {
        // Create new guide
        const newGuide = await guideService.createGuide({
          metadata: guide.metadata
        }, user.id)
        navigate(`/guides/${newGuide.id}/edit`)
      }
      
      alert('Guide saved successfully!')
    } catch (err) {
      console.error('Error saving guide:', err)
      alert('Failed to save guide')
    } finally {
      setSaving(false)
    }
  }

  const handleEnrich = async () => {
    if (!guide) return

    try {
      setEnriching(true)
      await enrichmentService.enrichGuide({
        accommodations: guide.accommodations,
        activities: guide.activities,
        dining: guide.dining
      })
      setGuide({ ...guide })
      alert('Guide enriched with external data!')
    } catch (err) {
      console.error('Error enriching guide:', err)
      alert('Failed to enrich guide')
    } finally {
      setEnriching(false)
    }
  }

  const handlePublish = async () => {
    if (!guide || !guideId || !user) return

    try {
      await guideService.publishGuide(guideId, user.id)
      setGuide({
        ...guide,
        metadata: {
          ...guide.metadata,
          isPublished: true,
          publishedAt: new Date()
        }
      })
      alert('Guide published successfully!')
    } catch (err) {
      console.error('Error publishing guide:', err)
      alert('Failed to publish guide')
    }
  }

  const handleUnpublish = async () => {
    if (!guide || !guideId || !user) return

    try {
      await guideService.unpublishGuide(guideId, user.id)
      setGuide({
        ...guide,
        metadata: {
          ...guide.metadata,
          isPublished: false,
          publishedAt: undefined
        }
      })
      alert('Guide unpublished successfully!')
    } catch (err) {
      console.error('Error unpublishing guide:', err)
      alert('Failed to unpublish guide')
    }
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const addAccommodation = () => {
    if (!guide) return
    const newAccommodation: AccommodationRecommendation = {
      id: crypto.randomUUID(),
      name: '',
      type: 'hotel',
      neighborhood: '',
      description: '',
      priceRange: '$$',
      images: [],
      bookingLinks: []
    }
    setGuide({
      ...guide,
      accommodations: [...guide.accommodations, newAccommodation]
    })
  }

  const removeAccommodation = (id: string) => {
    if (!guide) return
    setGuide({
      ...guide,
      accommodations: guide.accommodations.filter(a => a.id !== id)
    })
  }

  const updateAccommodation = (id: string, updates: Partial<AccommodationRecommendation>) => {
    if (!guide) return
    setGuide({
      ...guide,
      accommodations: guide.accommodations.map(a => 
        a.id === id ? { ...a, ...updates } : a
      )
    })
  }

  // Note: Activity and Dining management functions removed as they're not currently used
  // These can be re-added when the full editor functionality is implemented

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/guides')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Guides
          </button>
        </div>
      </div>
    )
  }

  if (!guide) {
    // Initialize new guide
    const newGuide: TripGuide = {
      id: crypto.randomUUID(),
      metadata: {
        author: {
          id: user?.id || '',
          name: user?.full_name || '',
          profilePicture: user?.profile_picture_url
        },
        destination: {
          city: '',
          country: ''
        },
        tripType: 'solo',
        travelDate: {
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear()
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublished: false
      },
      accommodations: [],
      activities: [],
      dining: [],
      transportation: []
    }
    setGuide(newGuide)
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">
              {guideId ? 'Edit Guide' : 'Create New Guide'}
            </h1>
            
            <div className="flex items-center space-x-2">
              {guideId && (
                <>
                  <button
                    onClick={handleEnrich}
                    disabled={enriching}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    {enriching ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Enrich Data'
                    )}
                  </button>
                  
                  {guide.metadata.isPublished ? (
                    <button
                      onClick={handleUnpublish}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Unpublish</span>
                    </button>
                  ) : (
                    <button
                      onClick={handlePublish}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                    >
                      <Globe className="w-4 h-4" />
                      <span>Publish</span>
                    </button>
                  )}
                </>
              )}
              
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Save</span>
              </button>
              
              <button
                onClick={() => navigate(guideId ? `/guides/${guideId}` : '/guides')}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Metadata Section */}
          <div className="bg-white rounded-lg shadow-sm">
            <button
              onClick={() => toggleSection('metadata')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
            >
              <h2 className="text-lg font-semibold">Guide Information</h2>
              {expandedSections.metadata ? <ChevronUp /> : <ChevronDown />}
            </button>
            
            {expandedSections.metadata && (
              <div className="px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">City</label>
                    <input
                      type="text"
                      value={guide.metadata.destination.city}
                      onChange={(e) => setGuide({
                        ...guide,
                        metadata: {
                          ...guide.metadata,
                          destination: {
                            ...guide.metadata.destination,
                            city: e.target.value
                          }
                        }
                      })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Country</label>
                    <input
                      type="text"
                      value={guide.metadata.destination.country}
                      onChange={(e) => setGuide({
                        ...guide,
                        metadata: {
                          ...guide.metadata,
                          destination: {
                            ...guide.metadata.destination,
                            country: e.target.value
                          }
                        }
                      })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Trip Type</label>
                    <select
                      value={guide.metadata.tripType}
                      onChange={(e) => setGuide({
                        ...guide,
                        metadata: {
                          ...guide.metadata,
                          tripType: e.target.value as TripType
                        }
                      })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="solo">Solo</option>
                      <option value="romantic">Romantic</option>
                      <option value="family">Family</option>
                      <option value="group">Group</option>
                      <option value="business">Business</option>
                      <option value="adventure">Adventure</option>
                      <option value="relaxation">Relaxation</option>
                      <option value="cultural">Cultural</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Budget</label>
                    <select
                      value={guide.metadata.budget || ''}
                      onChange={(e) => setGuide({
                        ...guide,
                        metadata: {
                          ...guide.metadata,
                          budget: e.target.value as PriceRange
                        }
                      })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Select budget</option>
                      <option value="$">$ - Budget</option>
                      <option value="$$">$$ - Moderate</option>
                      <option value="$$$">$$$ - Premium</option>
                      <option value="$$$$">$$$$ - Luxury</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Duration (days)</label>
                    <input
                      type="number"
                      value={guide.metadata.tripDuration || ''}
                      onChange={(e) => setGuide({
                        ...guide,
                        metadata: {
                          ...guide.metadata,
                          tripDuration: parseInt(e.target.value)
                        }
                      })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Group Size</label>
                    <input
                      type="number"
                      value={guide.metadata.groupSize || ''}
                      onChange={(e) => setGuide({
                        ...guide,
                        metadata: {
                          ...guide.metadata,
                          groupSize: parseInt(e.target.value)
                        }
                      })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Accommodations Section */}
          <div className="bg-white rounded-lg shadow-sm">
            <button
              onClick={() => toggleSection('accommodations')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
            >
              <h2 className="text-lg font-semibold">Accommodations ({guide.accommodations.length})</h2>
              {expandedSections.accommodations ? <ChevronUp /> : <ChevronDown />}
            </button>
            
            {expandedSections.accommodations && (
              <div className="px-6 pb-6">
                <div className="space-y-4">
                  {guide.accommodations.map((accommodation) => (
                    <div key={accommodation.id} className="border rounded-lg p-4">
                      <div className="flex justify-between mb-3">
                        <input
                          type="text"
                          value={accommodation.name}
                          onChange={(e) => updateAccommodation(accommodation.id, { name: e.target.value })}
                          placeholder="Accommodation name"
                          className="text-lg font-semibold bg-transparent border-b"
                        />
                        <button
                          onClick={() => removeAccommodation(accommodation.id)}
                          className="text-red-600 hover:bg-red-50 p-1 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={accommodation.neighborhood}
                          onChange={(e) => updateAccommodation(accommodation.id, { neighborhood: e.target.value })}
                          placeholder="Neighborhood"
                          className="px-3 py-2 border rounded"
                        />
                        <select
                          value={accommodation.type}
                          onChange={(e) => updateAccommodation(accommodation.id, { type: e.target.value as any })}
                          className="px-3 py-2 border rounded"
                        >
                          <option value="hotel">Hotel</option>
                          <option value="airbnb">Airbnb</option>
                          <option value="hostel">Hostel</option>
                          <option value="resort">Resort</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      
                      <textarea
                        value={accommodation.description}
                        onChange={(e) => updateAccommodation(accommodation.id, { description: e.target.value })}
                        placeholder="Description"
                        className="w-full mt-3 px-3 py-2 border rounded"
                        rows={3}
                      />
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={addAccommodation}
                  className="mt-4 px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Accommodation</span>
                </button>
              </div>
            )}
          </div>

          {/* Similar sections for Activities, Dining, Transportation, and Tips */}
          {/* These would follow the same pattern as the Accommodations section */}
        </div>
      </div>
    </div>
  )
}

export default GuideEditor