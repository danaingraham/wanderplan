import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  FileText, Sparkles, ArrowRight, Loader2, AlertCircle, 
  CheckCircle, Edit, Eye, Save, ChevronDown, ChevronUp,
  Hotel, MapPin, Utensils, Calendar, DollarSign, Info
} from 'lucide-react'
import { GuideExtractorService } from '../services/guideExtractorService'
import { useTrips } from '../contexts/TripContext'
import { getCoordinatesForLocation } from '../utils/geocoding'
// import { TripGuideService } from '../services/tripGuideService'
// import { DataEnrichmentService } from '../services/dataEnrichmentService'
import { useUser } from '../contexts/UserContext'
import type { TripGuide } from '../types/guide'
import type { Trip } from '../types'

type Step = 'paste' | 'processing' | 'preview' | 'saving'

const CreateGuideFromPaste: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useUser()
  const { createTrip, createPlace } = useTrips()
  const [step, setStep] = useState<Step>('paste')
  const [pastedText, setPastedText] = useState('')
  const [extractedGuide, setExtractedGuide] = useState<Partial<TripGuide> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [_processing, setProcessing] = useState(false)
  const [progressMessage, setProgressMessage] = useState('')
  const [expandedSections, setExpandedSections] = useState({
    accommodations: true,
    activities: true,
    dining: true,
    tips: true
  })

  const extractorService = new GuideExtractorService()
  // Services removed as they're not used in the current localStorage implementation
  // const guideService = new TripGuideService()
  // const enrichmentService = new DataEnrichmentService()

  const handleExtract = async () => {
    if (!pastedText.trim()) {
      setError('Please paste your trip information first')
      return
    }

    if (!user) {
      navigate('/login')
      return
    }

    setStep('processing')
    setProcessing(true)
    setError(null)

    try {
      // Extract structured data from text with progress updates
      const extractedData = await extractorService.extractGuideFromText(
        pastedText,
        (message) => setProgressMessage(message)
      )
      
      setProgressMessage('Creating guide structure...')
      
      // Convert to TripGuide format
      const guide = extractorService.convertToTripGuide(
        extractedData,
        user.id,
        user.full_name || user.email,
        user.profile_picture_url
      )

      setExtractedGuide(guide)
      setStep('preview')
      setProgressMessage('')
    } catch (err: any) {
      console.error('Error extracting guide:', err)
      setError(err.message || 'Failed to extract guide information. Please try again.')
      setStep('paste')
      setProgressMessage('')
    } finally {
      setProcessing(false)
    }
  }

  const handleSave = async () => {
    if (!extractedGuide || !user) return

    setStep('saving')
    setProcessing(true)
    setProgressMessage('Creating travel guide...')

    try {
      // Get location string for geocoding
      const locationString = extractedGuide.metadata?.destination ? 
        `${extractedGuide.metadata.destination.city}, ${extractedGuide.metadata.destination.country}` : 
        null
      
      // Get coordinates for the location
      const coordinates = getCoordinatesForLocation(locationString)
      
      // Create a trip from the extracted guide data
      const tripData: Omit<Trip, 'id' | 'created_by' | 'created_date' | 'updated_date'> = {
        title: extractedGuide.metadata?.destination ? 
          `${extractedGuide.metadata.destination.city} Travel Guide` : 
          'Travel Guide',
        destination: locationString || 'Unknown',
        start_date: extractedGuide.metadata?.travelDate ? 
          `${extractedGuide.metadata.travelDate.year}-${String(extractedGuide.metadata.travelDate.month).padStart(2, '0')}-01` : 
          new Date().toISOString().split('T')[0],
        end_date: extractedGuide.metadata?.travelDate ? 
          `${extractedGuide.metadata.travelDate.year}-${String(extractedGuide.metadata.travelDate.month).padStart(2, '0')}-${extractedGuide.metadata.tripDuration || 7}` : 
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        trip_type: extractedGuide.metadata?.tripType === 'group' ? 'friends' :
                   extractedGuide.metadata?.tripType === 'adventure' ? 'friends' :
                   extractedGuide.metadata?.tripType === 'relaxation' ? 'romantic' :
                   extractedGuide.metadata?.tripType === 'cultural' ? 'friends' :
                   (extractedGuide.metadata?.tripType as any) || 'solo',
        group_size: extractedGuide.metadata?.groupSize || 2,
        has_kids: false,
        pace: 'moderate',
        budget: extractedGuide.metadata?.budget === '$' ? 'budget' : 
                extractedGuide.metadata?.budget === '$$$' || extractedGuide.metadata?.budget === '$$$$' ? 'luxury' : 
                'medium',
        preferences: extractedGuide.metadata?.tags || [],
        is_public: true,
        is_guide: true, // Mark this as a guide
        collaborators: [],
        latitude: coordinates.latitude || undefined,
        longitude: coordinates.longitude || undefined,
        currency: 'USD',
        location: locationString
      }

      // Create the trip
      const tripId = createTrip(tripData)
      
      setProgressMessage('Adding places to guide...')
      
      // Add places from the guide to the trip
      let dayCounter = 1
      let orderCounter = 0
      
      // Add accommodations as places
      if (extractedGuide.accommodations) {
        for (const accommodation of extractedGuide.accommodations) {
          createPlace({
            trip_id: tripId,
            name: accommodation.name,
            category: 'hotel',
            address: accommodation.neighborhood || '',
            day: dayCounter,
            order: orderCounter++,
            notes: `${accommodation.description || ''}${accommodation.authorNotes ? '\n' + accommodation.authorNotes : ''}${accommodation.priceRange ? '\nPrice: ' + accommodation.priceRange : ''}`.trim(),
            is_locked: false,
            is_reservation: false
          })
        }
      }
      
      // Add activities as places
      if (extractedGuide.activities) {
        for (const activity of extractedGuide.activities) {
          createPlace({
            trip_id: tripId,
            name: activity.name,
            category: 'attraction',
            address: activity.location || '',
            day: Math.min(dayCounter++, 7), // Distribute across days
            order: orderCounter++,
            notes: `${activity.description || ''}${activity.tips?.length ? '\nTips: ' + activity.tips.join(', ') : ''}`.trim(),
            duration: activity.duration ? parseInt(activity.duration) || undefined : undefined,
            is_locked: false,
            is_reservation: false
          })
        }
      }
      
      // Add dining as places
      if (extractedGuide.dining) {
        for (const dining of extractedGuide.dining) {
          createPlace({
            trip_id: tripId,
            name: dining.name,
            category: 'restaurant',
            address: dining.neighborhood || '',
            day: Math.min(Math.floor(dayCounter / 2), 7), // Distribute across days
            order: orderCounter++,
            notes: `${dining.description || ''}${dining.authorNotes ? '\n' + dining.authorNotes : ''}${dining.priceRange ? '\nPrice: ' + dining.priceRange : ''}`.trim(),
            is_locked: false,
            is_reservation: false
          })
        }
      }
      
      // Also save the full guide to localStorage for reference
      // Use the tripId as the guideId for consistency
      const fullGuide = {
        ...extractedGuide,
        id: tripId, // Use tripId as the guide ID
        tripId: tripId, // Link to the created trip
        metadata: {
          ...extractedGuide.metadata,
          author: {
            id: user.id,
            name: user.full_name || user.email,
            profilePicture: user.profile_picture_url
          },
          // Ensure destination is properly structured
          destination: extractedGuide.metadata?.destination || {
            city: extractedGuide.metadata?.destination?.city || locationString?.split(',')[0]?.trim() || 'Unknown',
            country: extractedGuide.metadata?.destination?.country || locationString?.split(',')[1]?.trim() || 'Unknown'
          },
          // Ensure other required fields exist
          tripType: extractedGuide.metadata?.tripType || 'solo',
          travelDate: extractedGuide.metadata?.travelDate || { month: new Date().getMonth() + 1, year: new Date().getFullYear() },
          createdAt: new Date(),
          updatedAt: new Date(),
          isPublished: true
        }
      }

      const savedGuides = JSON.parse(localStorage.getItem('savedGuides') || '{}')
      savedGuides[tripId] = fullGuide
      localStorage.setItem('savedGuides', JSON.stringify(savedGuides))
      
      console.log('✅ CreateGuideFromPaste: Saved guide with ID:', tripId)
      console.log('✅ CreateGuideFromPaste: Full guide data:', fullGuide)
      console.log('✅ CreateGuideFromPaste: All saved guides:', Object.keys(savedGuides))
      
      setProgressMessage('Guide created successfully!')
      
      // Navigate to the guide view page (which will show the trip as a guide)
      setTimeout(() => {
        console.log('🚀 CreateGuideFromPaste: Navigating to:', `/guides/${tripId}`)
        navigate(`/guides/${tripId}`)
      }, 1000)

    } catch (err: any) {
      console.error('Error saving guide:', err)
      setError(err.message || 'Failed to save guide. Please try again.')
      setStep('preview')
      setProgressMessage('')
    } finally {
      setProcessing(false)
    }
  }

  const handleEdit = () => {
    if (!extractedGuide) return
    
    // Save to session storage and navigate to editor
    sessionStorage.setItem('draftGuide', JSON.stringify(extractedGuide))
    navigate('/guides/new')
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const sampleText = `My Paris Trip - 5 Days in the City of Light

We stayed at Hotel des Grands Boulevards in the 2nd arrondissement. Beautiful boutique hotel with a great rooftop bar. About $200/night.

Day 1: Arrived and explored Montmartre. Visited Sacré-Cœur (stunning views!), wandered through Place du Tertre. Had lunch at La Consulat - try their French onion soup! Dinner at Pink Mamma (Italian) - make reservations in advance!

Day 2: Louvre Museum in the morning (book tickets online to skip lines). Lunch at Café Marly with views of the pyramid. Afternoon at Musée d'Orsay. Evening Seine river cruise.

Day 3: Day trip to Versailles. Take the RER C train (about 45 min). The gardens are massive - rent bikes! Back in Paris, had dinner at L'Ami Jean (Basque cuisine) - the rice pudding is incredible.

Day 4: Morning at Eiffel Tower (go early!). Picnic lunch in Champ de Mars. Afternoon shopping in Le Marais. Amazing falafel at L'As du Fallafel. Evening at a wine bar.

Day 5: Notre-Dame area (under construction but worth seeing). Shakespeare and Company bookstore. Latin Quarter for lunch. Final dinner at Le Comptoir du Relais.

Tips:
- Get a Paris Museum Pass for skip-the-line access
- Download Citymapper for public transport
- Many restaurants closed on Sundays
- Always greet shopkeepers with "Bonjour"
- Pack comfortable walking shoes
- Bring a portable charger`

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Create Travel Guide from Text</h1>
          <p className="text-gray-600 mt-2">
            Paste your trip notes, itinerary, or travel document and we'll extract and structure it into a beautiful guide
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center space-x-4">
          <div className={`flex items-center ${step === 'paste' ? 'text-blue-600' : 'text-gray-400'}`}>
            <FileText className="w-5 h-5 mr-2" />
            <span className="font-medium">Paste Text</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <div className={`flex items-center ${step === 'processing' ? 'text-blue-600' : step === 'preview' || step === 'saving' ? 'text-green-600' : 'text-gray-400'}`}>
            <Sparkles className="w-5 h-5 mr-2" />
            <span className="font-medium">Extract Data</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <div className={`flex items-center ${step === 'preview' ? 'text-blue-600' : step === 'saving' ? 'text-green-600' : 'text-gray-400'}`}>
            <Eye className="w-5 h-5 mr-2" />
            <span className="font-medium">Preview</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <div className={`flex items-center ${step === 'saving' ? 'text-blue-600' : 'text-gray-400'}`}>
            <Save className="w-5 h-5 mr-2" />
            <span className="font-medium">Save</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        {/* Paste Step */}
        {step === 'paste' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Paste your trip information here
                </label>
                <span className={`text-xs ${pastedText.length > 8000 ? 'text-red-600' : 'text-gray-500'}`}>
                  {pastedText.length} / 8000 characters
                </span>
              </div>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste your itinerary, trip notes, travel document, or any text describing your trip..."
                className="w-full h-64 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {pastedText.length > 8000 && (
                <p className="mt-1 text-xs text-red-600">
                  Text is too long and will be truncated. Consider splitting into multiple guides.
                </p>
              )}
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-800 font-medium">{error}</p>
                    <div className="mt-2 text-xs text-red-700">
                      <p>Troubleshooting tips:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Try with shorter text (under 2000 words)</li>
                        <li>Ensure text includes clear trip information</li>
                        <li>Check your internet connection</li>
                        <li>Try the sample text to test the system</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">What to include:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Hotel names and neighborhoods</li>
                    <li>Restaurants and what you ate</li>
                    <li>Activities and attractions visited</li>
                    <li>Transportation tips</li>
                    <li>Packing suggestions</li>
                    <li>Local tips and recommendations</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setPastedText(sampleText)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Use sample text
              </button>
              
              <button
                onClick={handleExtract}
                disabled={!pastedText.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Extract Guide Data
              </button>
            </div>
          </div>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <div className="bg-white rounded-lg shadow-sm p-12">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Analyzing Your Trip Data</h2>
              <p className="text-gray-600 mb-4">
                Using AI to extract accommodations, activities, restaurants, and tips...
              </p>
              {progressMessage && (
                <div className="mt-4">
                  <p className="text-sm text-blue-600 animate-pulse">{progressMessage}</p>
                </div>
              )}
              <div className="mt-6">
                <p className="text-xs text-gray-500">This may take 15-30 seconds</p>
              </div>
            </div>
          </div>
        )}

        {/* Preview Step */}
        {step === 'preview' && extractedGuide && (
          <div className="space-y-6">
            {/* Destination Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">
                    {extractedGuide.metadata?.destination.city}, {extractedGuide.metadata?.destination.country}
                  </h2>
                  {extractedGuide.metadata?.destination.region && (
                    <p className="text-gray-600">{extractedGuide.metadata.destination.region}</p>
                  )}
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {extractedGuide.metadata?.tripType && (
                  <div className="flex items-center">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded capitalize">
                      {extractedGuide.metadata.tripType}
                    </span>
                  </div>
                )}
                {extractedGuide.metadata?.tripDuration && (
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {extractedGuide.metadata.tripDuration} days
                  </div>
                )}
                {extractedGuide.metadata?.budget && (
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    {extractedGuide.metadata.budget}
                  </div>
                )}
              </div>
            </div>

            {/* Accommodations */}
            {extractedGuide.accommodations && extractedGuide.accommodations.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm">
                <button
                  onClick={() => toggleSection('accommodations')}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <Hotel className="w-5 h-5 mr-2" />
                    <h3 className="text-lg font-semibold">
                      Accommodations ({extractedGuide.accommodations.length})
                    </h3>
                  </div>
                  {expandedSections.accommodations ? <ChevronUp /> : <ChevronDown />}
                </button>
                
                {expandedSections.accommodations && (
                  <div className="px-6 pb-4 space-y-3">
                    {extractedGuide.accommodations.map((acc, index) => (
                      <div key={index} className="border-l-4 border-blue-500 pl-4">
                        <h4 className="font-semibold">{acc.name}</h4>
                        {acc.neighborhood && (
                          <p className="text-sm text-gray-600">📍 {acc.neighborhood}</p>
                        )}
                        {acc.description && (
                          <p className="text-sm text-gray-700 mt-1">{acc.description}</p>
                        )}
                        {acc.priceRange && (
                          <span className="inline-block mt-1 text-sm text-gray-500">
                            {acc.priceRange}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Activities */}
            {extractedGuide.activities && extractedGuide.activities.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm">
                <button
                  onClick={() => toggleSection('activities')}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    <h3 className="text-lg font-semibold">
                      Activities ({extractedGuide.activities.length})
                    </h3>
                  </div>
                  {expandedSections.activities ? <ChevronUp /> : <ChevronDown />}
                </button>
                
                {expandedSections.activities && (
                  <div className="px-6 pb-4 space-y-3">
                    {extractedGuide.activities.map((activity, index) => (
                      <div key={index} className="border-l-4 border-green-500 pl-4">
                        <h4 className="font-semibold">{activity.name}</h4>
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs capitalize">
                          {activity.category}
                        </span>
                        {activity.location && (
                          <p className="text-sm text-gray-600 mt-1">📍 {activity.location}</p>
                        )}
                        {activity.description && (
                          <p className="text-sm text-gray-700 mt-1">{activity.description}</p>
                        )}
                        {activity.tips && activity.tips.length > 0 && (
                          <ul className="mt-2 text-sm text-gray-600">
                            {activity.tips.map((tip, tipIndex) => (
                              <li key={tipIndex}>💡 {tip}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Dining */}
            {extractedGuide.dining && extractedGuide.dining.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm">
                <button
                  onClick={() => toggleSection('dining')}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <Utensils className="w-5 h-5 mr-2" />
                    <h3 className="text-lg font-semibold">
                      Restaurants ({extractedGuide.dining.length})
                    </h3>
                  </div>
                  {expandedSections.dining ? <ChevronUp /> : <ChevronDown />}
                </button>
                
                {expandedSections.dining && (
                  <div className="px-6 pb-4 space-y-3">
                    {extractedGuide.dining.map((restaurant, index) => (
                      <div key={index} className="border-l-4 border-orange-500 pl-4">
                        <h4 className="font-semibold">{restaurant.name}</h4>
                        {restaurant.cuisine && (
                          <p className="text-sm text-gray-600">{restaurant.cuisine} cuisine</p>
                        )}
                        {restaurant.neighborhood && (
                          <p className="text-sm text-gray-600">📍 {restaurant.neighborhood}</p>
                        )}
                        {restaurant.mustTryDishes && restaurant.mustTryDishes.length > 0 && (
                          <p className="text-sm text-gray-700 mt-1">
                            Must try: {restaurant.mustTryDishes.join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tips */}
            {(extractedGuide.highlights || extractedGuide.packingTips || extractedGuide.localTips) && (
              <div className="bg-white rounded-lg shadow-sm">
                <button
                  onClick={() => toggleSection('tips')}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <Info className="w-5 h-5 mr-2" />
                    <h3 className="text-lg font-semibold">Tips & Highlights</h3>
                  </div>
                  {expandedSections.tips ? <ChevronUp /> : <ChevronDown />}
                </button>
                
                {expandedSections.tips && (
                  <div className="px-6 pb-4 space-y-4">
                    {extractedGuide.highlights && extractedGuide.highlights.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Highlights</h4>
                        <ul className="space-y-1">
                          {extractedGuide.highlights.map((highlight, index) => (
                            <li key={index} className="text-sm text-gray-700">✨ {highlight}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {extractedGuide.packingTips && extractedGuide.packingTips.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Packing Tips</h4>
                        <ul className="space-y-1">
                          {extractedGuide.packingTips.map((tip, index) => (
                            <li key={index} className="text-sm text-gray-700">🎒 {tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {extractedGuide.localTips && extractedGuide.localTips.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Local Tips</h4>
                        <ul className="space-y-1">
                          {extractedGuide.localTips.map((tip, index) => (
                            <li key={index} className="text-sm text-gray-700">💡 {tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setStep('paste')
                    setExtractedGuide(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Start Over
                </button>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleEdit}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Details
                  </button>
                  
                  <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Guide
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Saving Step */}
        {step === 'saving' && (
          <div className="bg-white rounded-lg shadow-sm p-12">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Saving Your Guide</h2>
              <p className="text-gray-600 mb-4">
                Creating your travel guide...
              </p>
              {progressMessage && (
                <p className="text-sm text-green-600 animate-pulse">{progressMessage}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CreateGuideFromPaste