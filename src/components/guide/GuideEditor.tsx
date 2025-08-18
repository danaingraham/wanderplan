import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Save, X, Plus, Trash2, 
  ChevronDown, ChevronUp, Loader2,
  Hotel, Utensils, Activity, Car, Lightbulb, Package
} from 'lucide-react'
import { useUser } from '../../contexts/UserContext'
import { useTrips } from '../../contexts/TripContext'

interface GuideData {
  id: string
  metadata: {
    title: string
    destination: {
      city: string
      country: string
      region?: string
    }
    tripType: string
    budget?: string
    duration?: number
    groupSize?: number
    travelDates?: {
      start?: string
      end?: string
    }
    author: {
      id: string
      name: string
      profilePicture?: string
    }
    createdAt: Date
    updatedAt: Date
    isPublished: boolean
    coverImage?: string
  }
  accommodations: Array<{
    id: string
    name: string
    type: 'hotel' | 'airbnb' | 'hostel' | 'resort' | 'other'
    neighborhood?: string
    description?: string
    priceRange?: string
    bookingLink?: string
  }>
  activities: Array<{
    id: string
    name: string
    category: string
    description?: string
    duration?: string
    price?: string
    bookingRequired?: boolean
    bestTime?: string
  }>
  dining: Array<{
    id: string
    name: string
    type: string
    cuisine?: string
    neighborhood?: string
    description?: string
    priceRange?: string
    mustTry?: string[]
  }>
  transportation: Array<{
    id: string
    type: string
    description: string
    cost?: string
    tips?: string
  }>
  packingTips?: string[]
  localTips?: string[]
  bestTimeToVisit?: string
  avoidThese?: string[]
}

const GuideEditor: React.FC = () => {
  const { guideId } = useParams<{ guideId: string }>()
  const navigate = useNavigate()
  const { user } = useUser()
  const { trips, updateTrip } = useTrips()
  const [guide, setGuide] = useState<GuideData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    metadata: true,
    accommodations: false,
    activities: false,
    dining: false,
    transportation: false,
    tips: false
  })

  useEffect(() => {
    if (guideId) {
      loadGuide()
    } else {
      setError('No guide ID provided')
      setLoading(false)
    }
  }, [guideId])

  const loadGuide = () => {
    try {
      setLoading(true)
      
      // Load from localStorage savedGuides
      const savedGuides = JSON.parse(localStorage.getItem('savedGuides') || '{}')
      const localGuide = savedGuides[guideId!]
      
      if (localGuide) {
        // Verify ownership
        if (localGuide.metadata?.author?.id !== user?.id) {
          // Check if this is a trip-based guide
          const trip = trips.find(t => t.id === guideId)
          if (!trip || trip.created_by !== user?.id) {
            setError('You do not have permission to edit this guide')
            return
          }
        }
        
        setGuide(localGuide)
      } else {
        // Try to find it as a trip
        const trip = trips.find(t => t.id === guideId && t.is_guide)
        
        if (trip) {
          // Convert trip to guide format
          const newGuide: GuideData = {
            id: trip.id,
            metadata: {
              title: trip.title || `${trip.destination} Guide`,
              destination: {
                city: trip.destination?.split(',')[0]?.trim() || 'Unknown',
                country: trip.destination?.split(',')[1]?.trim() || 'Unknown'
              },
              tripType: 'solo',
              travelDates: {
                start: trip.start_date,
                end: trip.end_date
              },
              author: {
                id: user?.id || '',
                name: user?.full_name || 'Unknown',
                profilePicture: user?.profile_picture_url
              },
              createdAt: new Date(trip.created_date || Date.now()),
              updatedAt: new Date(trip.updated_date || Date.now()),
              isPublished: trip.is_public || false,
              coverImage: trip.cover_image
            },
            accommodations: [],
            activities: [],
            dining: [],
            transportation: [],
            packingTips: [],
            localTips: []
          }
          
          setGuide(newGuide)
        } else {
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

  const handleSave = async () => {
    if (!guide || !user) return

    try {
      setSaving(true)
      
      // Save to localStorage savedGuides
      const savedGuides = JSON.parse(localStorage.getItem('savedGuides') || '{}')
      savedGuides[guide.id] = {
        ...guide,
        metadata: {
          ...guide.metadata,
          updatedAt: new Date()
        }
      }
      localStorage.setItem('savedGuides', JSON.stringify(savedGuides))
      
      // Also update the trip if it exists
      const trip = trips.find(t => t.id === guide.id)
      if (trip) {
        await updateTrip(guide.id, {
          title: guide.metadata.title,
          destination: `${guide.metadata.destination.city}, ${guide.metadata.destination.country}`,
          is_public: guide.metadata.isPublished,
          cover_image: guide.metadata.coverImage,
          updated_date: new Date().toISOString()
        })
      }
      
      // Show success and navigate back
      alert('Guide saved successfully!')
      navigate(`/trip/${guide.id}`)
    } catch (err) {
      console.error('Error saving guide:', err)
      alert('Failed to save guide')
    } finally {
      setSaving(false)
    }
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Accommodation management
  const addAccommodation = () => {
    if (!guide) return
    const newAccommodation = {
      id: crypto.randomUUID(),
      name: '',
      type: 'hotel' as const,
      neighborhood: '',
      description: '',
      priceRange: '$$'
    }
    setGuide({
      ...guide,
      accommodations: [...guide.accommodations, newAccommodation]
    })
  }

  const updateAccommodation = (id: string, updates: any) => {
    if (!guide) return
    setGuide({
      ...guide,
      accommodations: guide.accommodations.map(a => 
        a.id === id ? { ...a, ...updates } : a
      )
    })
  }

  const removeAccommodation = (id: string) => {
    if (!guide) return
    setGuide({
      ...guide,
      accommodations: guide.accommodations.filter(a => a.id !== id)
    })
  }

  // Activity management
  const addActivity = () => {
    if (!guide) return
    const newActivity = {
      id: crypto.randomUUID(),
      name: '',
      category: 'Sightseeing',
      description: '',
      duration: '',
      price: ''
    }
    setGuide({
      ...guide,
      activities: [...guide.activities, newActivity]
    })
  }

  const updateActivity = (id: string, updates: any) => {
    if (!guide) return
    setGuide({
      ...guide,
      activities: guide.activities.map(a => 
        a.id === id ? { ...a, ...updates } : a
      )
    })
  }

  const removeActivity = (id: string) => {
    if (!guide) return
    setGuide({
      ...guide,
      activities: guide.activities.filter(a => a.id !== id)
    })
  }

  // Dining management
  const addDining = () => {
    if (!guide) return
    const newDining = {
      id: crypto.randomUUID(),
      name: '',
      type: 'Restaurant',
      cuisine: '',
      neighborhood: '',
      description: '',
      priceRange: '$$'
    }
    setGuide({
      ...guide,
      dining: [...guide.dining, newDining]
    })
  }

  const updateDining = (id: string, updates: any) => {
    if (!guide) return
    setGuide({
      ...guide,
      dining: guide.dining.map(d => 
        d.id === id ? { ...d, ...updates } : d
      )
    })
  }

  const removeDining = (id: string) => {
    if (!guide) return
    setGuide({
      ...guide,
      dining: guide.dining.filter(d => d.id !== id)
    })
  }

  // Transportation management
  const addTransportation = () => {
    if (!guide) return
    const newTransport = {
      id: crypto.randomUUID(),
      type: 'Public Transit',
      description: '',
      cost: '',
      tips: ''
    }
    setGuide({
      ...guide,
      transportation: [...guide.transportation, newTransport]
    })
  }

  const updateTransportation = (id: string, updates: any) => {
    if (!guide) return
    setGuide({
      ...guide,
      transportation: guide.transportation.map(t => 
        t.id === id ? { ...t, ...updates } : t
      )
    })
  }

  const removeTransportation = (id: string) => {
    if (!guide) return
    setGuide({
      ...guide,
      transportation: guide.transportation.filter(t => t.id !== id)
    })
  }

  // Tips management
  const addPackingTip = () => {
    if (!guide) return
    setGuide({
      ...guide,
      packingTips: [...(guide.packingTips || []), '']
    })
  }

  const updatePackingTip = (index: number, value: string) => {
    if (!guide) return
    const tips = [...(guide.packingTips || [])]
    tips[index] = value
    setGuide({ ...guide, packingTips: tips })
  }

  const removePackingTip = (index: number) => {
    if (!guide) return
    setGuide({
      ...guide,
      packingTips: guide.packingTips?.filter((_, i) => i !== index) || []
    })
  }

  const addLocalTip = () => {
    if (!guide) return
    setGuide({
      ...guide,
      localTips: [...(guide.localTips || []), '']
    })
  }

  const updateLocalTip = (index: number, value: string) => {
    if (!guide) return
    const tips = [...(guide.localTips || [])]
    tips[index] = value
    setGuide({ ...guide, localTips: tips })
  }

  const removeLocalTip = (index: number) => {
    if (!guide) return
    setGuide({
      ...guide,
      localTips: guide.localTips?.filter((_, i) => i !== index) || []
    })
  }

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

  if (!guide) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Edit Guide</h1>
            
            <div className="flex items-center space-x-2">
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
                onClick={() => navigate(`/trip/${guideId}`)}
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
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input
                      type="text"
                      value={guide.metadata.title}
                      onChange={(e) => setGuide({
                        ...guide,
                        metadata: { ...guide.metadata, title: e.target.value }
                      })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="My Amazing Travel Guide"
                    />
                  </div>

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
                            tripType: e.target.value
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
                            budget: e.target.value
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
                        value={guide.metadata.duration || ''}
                        onChange={(e) => setGuide({
                          ...guide,
                          metadata: {
                            ...guide.metadata,
                            duration: parseInt(e.target.value) || undefined
                          }
                        })}
                        className="w-full px-3 py-2 border rounded-lg"
                        min="1"
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
                            groupSize: parseInt(e.target.value) || undefined
                          }
                        })}
                        className="w-full px-3 py-2 border rounded-lg"
                        min="1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Cover Image URL</label>
                    <input
                      type="text"
                      value={guide.metadata.coverImage || ''}
                      onChange={(e) => setGuide({
                        ...guide,
                        metadata: {
                          ...guide.metadata,
                          coverImage: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={guide.metadata.isPublished}
                        onChange={(e) => setGuide({
                          ...guide,
                          metadata: {
                            ...guide.metadata,
                            isPublished: e.target.checked
                          }
                        })}
                        className="rounded"
                      />
                      <span className="text-sm font-medium">Make this guide public</span>
                    </label>
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
              <div className="flex items-center space-x-2">
                <Hotel className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold">Accommodations ({guide.accommodations.length})</h2>
              </div>
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
                          placeholder="Hotel name"
                          className="text-lg font-medium bg-transparent border-b flex-1 mr-2"
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
                          value={accommodation.neighborhood || ''}
                          onChange={(e) => updateAccommodation(accommodation.id, { neighborhood: e.target.value })}
                          placeholder="Neighborhood"
                          className="px-3 py-2 border rounded"
                        />
                        <select
                          value={accommodation.type}
                          onChange={(e) => updateAccommodation(accommodation.id, { type: e.target.value })}
                          className="px-3 py-2 border rounded"
                        >
                          <option value="hotel">Hotel</option>
                          <option value="airbnb">Airbnb</option>
                          <option value="hostel">Hostel</option>
                          <option value="resort">Resort</option>
                          <option value="other">Other</option>
                        </select>
                        <select
                          value={accommodation.priceRange || ''}
                          onChange={(e) => updateAccommodation(accommodation.id, { priceRange: e.target.value })}
                          className="px-3 py-2 border rounded"
                        >
                          <option value="">Price Range</option>
                          <option value="$">$</option>
                          <option value="$$">$$</option>
                          <option value="$$$">$$$</option>
                          <option value="$$$$">$$$$</option>
                        </select>
                        <input
                          type="text"
                          value={accommodation.bookingLink || ''}
                          onChange={(e) => updateAccommodation(accommodation.id, { bookingLink: e.target.value })}
                          placeholder="Booking link"
                          className="px-3 py-2 border rounded"
                        />
                      </div>
                      
                      <textarea
                        value={accommodation.description || ''}
                        onChange={(e) => updateAccommodation(accommodation.id, { description: e.target.value })}
                        placeholder="Description"
                        className="w-full mt-3 px-3 py-2 border rounded"
                        rows={2}
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

          {/* Activities Section */}
          <div className="bg-white rounded-lg shadow-sm">
            <button
              onClick={() => toggleSection('activities')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold">Activities ({guide.activities.length})</h2>
              </div>
              {expandedSections.activities ? <ChevronUp /> : <ChevronDown />}
            </button>
            
            {expandedSections.activities && (
              <div className="px-6 pb-6">
                <div className="space-y-4">
                  {guide.activities.map((activity) => (
                    <div key={activity.id} className="border rounded-lg p-4">
                      <div className="flex justify-between mb-3">
                        <input
                          type="text"
                          value={activity.name}
                          onChange={(e) => updateActivity(activity.id, { name: e.target.value })}
                          placeholder="Activity name"
                          className="text-lg font-medium bg-transparent border-b flex-1 mr-2"
                        />
                        <button
                          onClick={() => removeActivity(activity.id)}
                          className="text-red-600 hover:bg-red-50 p-1 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={activity.category}
                          onChange={(e) => updateActivity(activity.id, { category: e.target.value })}
                          placeholder="Category (e.g., Sightseeing)"
                          className="px-3 py-2 border rounded"
                        />
                        <input
                          type="text"
                          value={activity.duration || ''}
                          onChange={(e) => updateActivity(activity.id, { duration: e.target.value })}
                          placeholder="Duration (e.g., 2 hours)"
                          className="px-3 py-2 border rounded"
                        />
                        <input
                          type="text"
                          value={activity.price || ''}
                          onChange={(e) => updateActivity(activity.id, { price: e.target.value })}
                          placeholder="Price"
                          className="px-3 py-2 border rounded"
                        />
                        <input
                          type="text"
                          value={activity.bestTime || ''}
                          onChange={(e) => updateActivity(activity.id, { bestTime: e.target.value })}
                          placeholder="Best time to visit"
                          className="px-3 py-2 border rounded"
                        />
                      </div>
                      
                      <textarea
                        value={activity.description || ''}
                        onChange={(e) => updateActivity(activity.id, { description: e.target.value })}
                        placeholder="Description"
                        className="w-full mt-3 px-3 py-2 border rounded"
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={addActivity}
                  className="mt-4 px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Activity</span>
                </button>
              </div>
            )}
          </div>

          {/* Dining Section */}
          <div className="bg-white rounded-lg shadow-sm">
            <button
              onClick={() => toggleSection('dining')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center space-x-2">
                <Utensils className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold">Dining ({guide.dining.length})</h2>
              </div>
              {expandedSections.dining ? <ChevronUp /> : <ChevronDown />}
            </button>
            
            {expandedSections.dining && (
              <div className="px-6 pb-6">
                <div className="space-y-4">
                  {guide.dining.map((restaurant) => (
                    <div key={restaurant.id} className="border rounded-lg p-4">
                      <div className="flex justify-between mb-3">
                        <input
                          type="text"
                          value={restaurant.name}
                          onChange={(e) => updateDining(restaurant.id, { name: e.target.value })}
                          placeholder="Restaurant name"
                          className="text-lg font-medium bg-transparent border-b flex-1 mr-2"
                        />
                        <button
                          onClick={() => removeDining(restaurant.id)}
                          className="text-red-600 hover:bg-red-50 p-1 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={restaurant.type}
                          onChange={(e) => updateDining(restaurant.id, { type: e.target.value })}
                          placeholder="Type (e.g., Restaurant, Cafe)"
                          className="px-3 py-2 border rounded"
                        />
                        <input
                          type="text"
                          value={restaurant.cuisine || ''}
                          onChange={(e) => updateDining(restaurant.id, { cuisine: e.target.value })}
                          placeholder="Cuisine"
                          className="px-3 py-2 border rounded"
                        />
                        <input
                          type="text"
                          value={restaurant.neighborhood || ''}
                          onChange={(e) => updateDining(restaurant.id, { neighborhood: e.target.value })}
                          placeholder="Neighborhood"
                          className="px-3 py-2 border rounded"
                        />
                        <select
                          value={restaurant.priceRange || ''}
                          onChange={(e) => updateDining(restaurant.id, { priceRange: e.target.value })}
                          className="px-3 py-2 border rounded"
                        >
                          <option value="">Price Range</option>
                          <option value="$">$</option>
                          <option value="$$">$$</option>
                          <option value="$$$">$$$</option>
                          <option value="$$$$">$$$$</option>
                        </select>
                      </div>
                      
                      <textarea
                        value={restaurant.description || ''}
                        onChange={(e) => updateDining(restaurant.id, { description: e.target.value })}
                        placeholder="Description"
                        className="w-full mt-3 px-3 py-2 border rounded"
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={addDining}
                  className="mt-4 px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Restaurant</span>
                </button>
              </div>
            )}
          </div>

          {/* Transportation Section */}
          <div className="bg-white rounded-lg shadow-sm">
            <button
              onClick={() => toggleSection('transportation')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center space-x-2">
                <Car className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold">Transportation ({guide.transportation.length})</h2>
              </div>
              {expandedSections.transportation ? <ChevronUp /> : <ChevronDown />}
            </button>
            
            {expandedSections.transportation && (
              <div className="px-6 pb-6">
                <div className="space-y-4">
                  {guide.transportation.map((transport) => (
                    <div key={transport.id} className="border rounded-lg p-4">
                      <div className="flex justify-between mb-3">
                        <input
                          type="text"
                          value={transport.type}
                          onChange={(e) => updateTransportation(transport.id, { type: e.target.value })}
                          placeholder="Type (e.g., Public Transit, Taxi)"
                          className="text-lg font-medium bg-transparent border-b flex-1 mr-2"
                        />
                        <button
                          onClick={() => removeTransportation(transport.id)}
                          className="text-red-600 hover:bg-red-50 p-1 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={transport.cost || ''}
                          onChange={(e) => updateTransportation(transport.id, { cost: e.target.value })}
                          placeholder="Cost"
                          className="px-3 py-2 border rounded"
                        />
                        <input
                          type="text"
                          value={transport.tips || ''}
                          onChange={(e) => updateTransportation(transport.id, { tips: e.target.value })}
                          placeholder="Tips"
                          className="px-3 py-2 border rounded"
                        />
                      </div>
                      
                      <textarea
                        value={transport.description}
                        onChange={(e) => updateTransportation(transport.id, { description: e.target.value })}
                        placeholder="Description"
                        className="w-full mt-3 px-3 py-2 border rounded"
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={addTransportation}
                  className="mt-4 px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Transportation</span>
                </button>
              </div>
            )}
          </div>

          {/* Tips Section */}
          <div className="bg-white rounded-lg shadow-sm">
            <button
              onClick={() => toggleSection('tips')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold">Travel Tips</h2>
              </div>
              {expandedSections.tips ? <ChevronUp /> : <ChevronDown />}
            </button>
            
            {expandedSections.tips && (
              <div className="px-6 pb-6 space-y-6">
                {/* Best Time to Visit */}
                <div>
                  <label className="block text-sm font-medium mb-2">Best Time to Visit</label>
                  <textarea
                    value={guide.bestTimeToVisit || ''}
                    onChange={(e) => setGuide({ ...guide, bestTimeToVisit: e.target.value })}
                    placeholder="Describe the best time to visit this destination"
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={3}
                  />
                </div>

                {/* Packing Tips */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium flex items-center space-x-2">
                      <Package className="w-4 h-4" />
                      <span>Packing Tips</span>
                    </label>
                    <button
                      onClick={addPackingTip}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      + Add Tip
                    </button>
                  </div>
                  <div className="space-y-2">
                    {guide.packingTips?.map((tip, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={tip}
                          onChange={(e) => updatePackingTip(index, e.target.value)}
                          placeholder="Enter packing tip"
                          className="flex-1 px-3 py-2 border rounded"
                        />
                        <button
                          onClick={() => removePackingTip(index)}
                          className="text-red-600 hover:bg-red-50 p-1 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Local Tips */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Local Tips</label>
                    <button
                      onClick={addLocalTip}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      + Add Tip
                    </button>
                  </div>
                  <div className="space-y-2">
                    {guide.localTips?.map((tip, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={tip}
                          onChange={(e) => updateLocalTip(index, e.target.value)}
                          placeholder="Enter local tip"
                          className="flex-1 px-3 py-2 border rounded"
                        />
                        <button
                          onClick={() => removeLocalTip(index)}
                          className="text-red-600 hover:bg-red-50 p-1 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Things to Avoid */}
                <div>
                  <label className="block text-sm font-medium mb-2">Things to Avoid</label>
                  <textarea
                    value={guide.avoidThese?.join('\n') || ''}
                    onChange={(e) => setGuide({ 
                      ...guide, 
                      avoidThese: e.target.value.split('\n').filter(line => line.trim()) 
                    })}
                    placeholder="List things to avoid (one per line)"
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={4}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default GuideEditor