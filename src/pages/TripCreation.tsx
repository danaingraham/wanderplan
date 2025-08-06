
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Sparkles, FileText, Baby } from 'lucide-react'
import { StepIndicator } from '../components/forms/StepIndicator'
import { DestinationAutocomplete } from '../components/forms/DestinationAutocomplete'
import { DateRangePicker } from '../components/forms/DateRangePicker'
import { MonthYearPicker } from '../components/forms/MonthYearPicker'
import { PreferenceSelector } from '../components/forms/PreferenceSelector'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { ApiStatus } from '../components/ui/ApiStatus'
import { useTrips } from '../contexts/TripContext'
import { realApiService } from '../services/realApi'

const steps = ['Trip Mode', 'Basic Info', 'Preferences', 'Generate']

const tripTypeOptions = [
  { value: 'solo', label: 'Solo Adventure' },
  { value: 'romantic', label: 'Romantic Getaway' },
  { value: 'family', label: 'Family Trip' },
  { value: 'friends', label: 'Friends Trip' },
  { value: 'business', label: 'Business Travel' },
]

const preferenceOptions = [
  { value: 'foodie', label: 'Food & Dining' },
  { value: 'culture', label: 'Arts & Culture' },
  { value: 'nature', label: 'Nature & Parks' },
  { value: 'nightlife', label: 'Nightlife' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'history', label: 'Historical Sites' },
  { value: 'adventure', label: 'Adventure Sports' },
]

const paceOptions = [
  { value: 'relaxed', label: 'Relaxed' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'packed', label: 'Action-Packed' },
]

export function TripCreation() {
  const navigate = useNavigate()
  const { createTrip, createPlace } = useTrips()
  
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState({
    tripMode: '' as 'future' | 'guide' | '', // New field for trip mode
    title: '',
    destination: '',
    destinationCoords: null as { lat: number; lng: number } | null,
    startDate: '',
    endDate: '',
    // For trip guides - month/year instead of specific dates
    tripMonth: '',
    tripYear: '',
    generationMode: 'ai' as 'paste' | 'ai',
    originalInput: '',
    tripType: '',
    groupSize: 2,
    hasKids: false,
    pace: '',
    preferences: [] as string[],
    isPublic: false,
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Auto-save draft (temporarily disabled to fix infinite re-render issue)
  // TODO: Re-implement auto-save with proper dependencies
  /*
  useEffect(() => {
    if (user && Object.values(formData).some(v => v !== '' && v !== 2 && v !== false && (Array.isArray(v) ? v.length > 0 : true))) {
      const draftData: Omit<DraftTrip, 'id' | 'last_updated' | 'created_by'> = {
        title: formData.title,
        destination: formData.destination,
        start_date: formData.startDate,
        end_date: formData.endDate,
        trip_type: formData.tripType,
        group_size: formData.groupSize,
        has_kids: formData.hasKids,
        pace: formData.pace,
        preferences: formData.preferences,
        generation_mode: formData.generationMode,
        original_input: formData.originalInput,
        is_guide: false,
        step: currentStep,
      }
      
      if (draftId) {
        updateDraftTrip(draftId, draftData)
      } else {
        const newDraftId = saveDraftTrip(draftData)
        setDraftId(newDraftId)
      }
    }
  }, [formData, currentStep, user, draftId, saveDraftTrip, updateDraftTrip])
  */
  
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (step === 0) {
      if (!formData.tripMode) newErrors.tripMode = 'Please select a trip mode'
    }
    
    if (step === 1) {
      if (!formData.title.trim()) newErrors.title = 'Trip title is required'
      if (!formData.destination.trim()) newErrors.destination = 'Destination is required'
      
      if (formData.tripMode === 'guide') {
        // For trip guides, validate month/year
        if (!formData.tripMonth) newErrors.tripMonth = 'Trip month is required'
        if (!formData.tripYear) newErrors.tripYear = 'Trip year is required'
      } else {
        // For future trips, validate start/end dates
        if (!formData.startDate) newErrors.startDate = 'Start date is required'
        if (!formData.endDate) newErrors.endDate = 'End date is required'
        if (formData.startDate && formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
          newErrors.endDate = 'End date must be after start date'
        }
      }
      
      if (formData.generationMode === 'paste' && !formData.originalInput.trim()) {
        newErrors.originalInput = 'Please paste your travel ideas'
      }
    }
    
    if (step === 2) {
      if (!formData.tripType) newErrors.tripType = 'Please select a trip type'
      if (formData.groupSize < 1) newErrors.groupSize = 'Group size must be at least 1'
      if (!formData.pace) newErrors.pace = 'Please select a travel pace'
      if (formData.preferences.length === 0) newErrors.preferences = 'Please select at least one preference'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep])
      }
      setCurrentStep(currentStep + 1)
    }
  }
  
  const handleBack = () => {
    setCurrentStep(currentStep - 1)
  }
  
  const handleGenerateTrip = async () => {
    if (!validateStep(2)) return
    
    setIsGenerating(true)
    setErrors({}) // Clear any previous errors
    
    try {
      // For trip guides, convert month/year to dates
      let startDate = formData.startDate
      let endDate = formData.endDate
      
      if (formData.tripMode === 'guide' && formData.tripMonth && formData.tripYear) {
        // Create dates for the first day of the month and last day of the month
        const year = parseInt(formData.tripYear)
        const month = parseInt(formData.tripMonth)
        startDate = `${year}-${formData.tripMonth.padStart(2, '0')}-01`
        
        // Get last day of the month
        const lastDay = new Date(year, month, 0).getDate()
        endDate = `${year}-${formData.tripMonth.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`
      }
      
      console.log('Generating trip with data:', {
        destination: formData.destination,
        start_date: startDate,
        end_date: endDate,
        trip_type: formData.tripType,
        group_size: formData.groupSize,
        has_kids: formData.hasKids,
        pace: formData.pace,
        preferences: formData.preferences,
        original_input: formData.originalInput,
      })
      
      const response = await realApiService.generateItinerary({
        destination: formData.destination,
        start_date: startDate,
        end_date: endDate,
        trip_type: formData.tripType,
        group_size: formData.groupSize,
        has_kids: formData.hasKids,
        pace: formData.pace,
        preferences: formData.preferences,
        original_input: formData.originalInput,
      })
      
      console.log('🎯 TripCreation: API response:', response)
      console.log('🎯 TripCreation: Response success:', response.success)
      console.log('🎯 TripCreation: Response data exists:', !!response.data)
      
      if (response.success && response.data) {
        console.log('🎯 TripCreation: Places in response:', response.data.places.length)
        console.log('🎯 TripCreation: All places details:', JSON.stringify(response.data.places, null, 2))
        
        // Create the trip
        const tripId = createTrip({
          ...response.data.trip,
          title: formData.title,
          latitude: formData.destinationCoords?.lat,
          longitude: formData.destinationCoords?.lng,
          is_public: formData.isPublic,
        })
        
        console.log('🎯 TripCreation: Created trip with ID:', tripId)
        
        // Create all places
        response.data.places.forEach((place, index) => {
          console.log(`🎯 TripCreation: Creating place ${index + 1}:`, place.name, `(Day ${place.day}, Order ${place.order})`)
          const placeId = createPlace({
            ...place,
            trip_id: tripId,
          })
          console.log(`🎯 TripCreation: Created place with ID:`, placeId)
        })
        
        console.log('🎯 TripCreation: TOTAL CREATED:', response.data.places.length, 'places')
        
        // Force a small delay to ensure all places are saved
        setTimeout(() => {
          console.log('🎯 TripCreation: Navigating to trip after delay')
          navigate(`/trip/${tripId}`)
        }, 100)
      } else {
        console.error('API returned error:', response.error)
        setErrors({ generation: response.error || 'Failed to generate trip' })
      }
    } catch (error) {
      console.error('Error generating trip:', error)
      setErrors({ generation: `An error occurred while generating your trip: ${error}` })
    } finally {
      setIsGenerating(false)
    }
  }
  
  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
    // Clear related errors
    const newErrors = { ...errors }
    Object.keys(updates).forEach(key => {
      delete newErrors[key]
    })
    setErrors(newErrors)
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Create New Trip</h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Planning your next adventure or sharing a completed trip as a guide? We'll help you create the perfect itinerary.
          </p>
        </div>
        
        {/* Step Indicator */}
        <StepIndicator 
          steps={steps} 
          currentStep={currentStep} 
          completedSteps={completedSteps} 
        />
        
        {/* Form Content */}
        <div className="max-w-2xl mx-auto">
          <ApiStatus />
          <div className="card">
            {/* Step 0: Trip Mode Selection */}
            {currentStep === 0 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">What would you like to do?</h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <button
                      type="button"
                      onClick={() => updateFormData({ tripMode: 'future' })}
                      className={`p-6 rounded-xl border-2 transition-all text-left animate-scale-in ${
                        formData.tripMode === 'future'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                        formData.tripMode === 'future' ? 'bg-primary-500' : 'bg-gray-100'
                      }`}>
                        <span className={`text-2xl ${
                          formData.tripMode === 'future' ? 'text-white' : 'text-gray-500'
                        }`}>✈️</span>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">Plan Future Trip</h4>
                      <p className="text-sm text-gray-600">
                        Planning an upcoming adventure? We'll help you create the perfect itinerary for your next journey.
                      </p>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => updateFormData({ tripMode: 'guide', isPublic: true })}
                      className={`p-6 rounded-xl border-2 transition-all text-left animate-scale-in ${
                        formData.tripMode === 'guide'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={{animationDelay: '0.1s'}}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                        formData.tripMode === 'guide' ? 'bg-primary-500' : 'bg-gray-100'
                      }`}>
                        <span className={`text-2xl ${
                          formData.tripMode === 'guide' ? 'text-white' : 'text-gray-500'
                        }`}>📖</span>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">Create Trip Guide</h4>
                      <p className="text-sm text-gray-600">
                        Share a completed trip as a guide for others? Document your past adventure and help fellow travelers.
                      </p>
                    </button>
                  </div>
                  
                  {errors.tripMode && (
                    <p className="mt-4 text-sm text-red-600 text-center">{errors.tripMode}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    {formData.tripMode === 'guide' ? 'Trip Guide Information' : 'Basic Trip Information'}
                  </h2>
                  
                  <div className="space-y-4">
                    <Input
                      label={formData.tripMode === 'guide' ? 'Guide Title' : 'Trip Title'}
                      value={formData.title}
                      onChange={(e) => updateFormData({ title: e.target.value })}
                      placeholder={formData.tripMode === 'guide' ? 'Ultimate Tokyo Food Guide' : 'My Amazing Adventure'}
                      error={errors.title}
                    />
                    
                    <DestinationAutocomplete
                      label="Destination"
                      value={formData.destination}
                      onChange={(destination, coords) => updateFormData({ 
                        destination, 
                        destinationCoords: coords || null 
                      })}
                      placeholder={formData.tripMode === 'guide' ? 'Where did you travel?' : 'Where do you want to go?'}
                      helperText={formData.tripMode === 'guide' 
                        ? 'Enter the destination where you traveled for this completed trip'
                        : 'Enter your desired travel destination'
                      }
                      error={errors.destination}
                    />
                    
                    {formData.tripMode === 'guide' ? (
                      <MonthYearPicker
                        label="When did you take this trip?"
                        month={formData.tripMonth}
                        year={formData.tripYear}
                        onMonthChange={(month) => updateFormData({ tripMonth: month })}
                        onYearChange={(year) => updateFormData({ tripYear: year })}
                        error={errors.tripMonth || errors.tripYear}
                      />
                    ) : (
                      <DateRangePicker
                        label="Travel Dates"
                        startDate={formData.startDate}
                        endDate={formData.endDate}
                        onStartDateChange={(date) => {
                          console.log('📅 TripCreation: Start date changed to:', date)
                          updateFormData({ startDate: date })
                        }}
                        onEndDateChange={(date) => {
                          console.log('📅 TripCreation: End date changed to:', date)
                          updateFormData({ endDate: date })
                        }}
                        error={errors.startDate || errors.endDate}
                        placeholder="When are you traveling?"
                        minDate={new Date()}
                      />
                    )}
                  </div>
                </div>
                
                {/* Generation Mode */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {formData.tripMode === 'guide' ? 'How would you like to create your guide?' : 'How would you like to plan?'}
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <button
                      type="button"
                      onClick={() => updateFormData({ generationMode: 'ai', originalInput: '' })}
                      className={`p-4 sm:p-6 rounded-xl border-2 transition-all text-left animate-scale-in ${
                        formData.generationMode === 'ai'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Sparkles className={`w-6 h-6 sm:w-8 sm:h-8 mb-2 sm:mb-3 ${
                        formData.generationMode === 'ai' ? 'text-primary-600' : 'text-gray-400'
                      }`} />
                      <h4 className="font-medium text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">
                        {formData.tripMode === 'guide' ? 'AI Enhances Your Guide' : 'AI Creates from Scratch'}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {formData.tripMode === 'guide' 
                          ? 'Let our AI help improve and organize your completed trip into a comprehensive guide'
                          : 'Let our AI build a complete itinerary based on your preferences'
                        }
                      </p>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => updateFormData({ generationMode: 'paste' })}
                      className={`p-4 sm:p-6 rounded-xl border-2 transition-all text-left animate-scale-in ${
                        formData.generationMode === 'paste'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={{animationDelay: '0.1s'}}
                    >
                      <FileText className={`w-6 h-6 sm:w-8 sm:h-8 mb-2 sm:mb-3 ${
                        formData.generationMode === 'paste' ? 'text-primary-600' : 'text-gray-400'
                      }`} />
                      <h4 className="font-medium text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">
                        {formData.tripMode === 'guide' ? 'List Your Trip Places' : 'Paste Ideas & Organize'}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {formData.tripMode === 'guide'
                          ? 'Add the places you visited, restaurants you loved, and tips you learned'
                          : 'Have places in mind? Paste them and we\'ll organize into a schedule'
                        }
                      </p>
                    </button>
                  </div>
                  
                  {formData.generationMode === 'paste' && (
                    <div className="mt-4">
                      <textarea
                        value={formData.originalInput}
                        onChange={(e) => updateFormData({ originalInput: e.target.value })}
                        placeholder={formData.tripMode === 'guide' 
                          ? 'List the places you visited: restaurants, attractions, hotels, hidden gems, local tips...'
                          : 'Paste places you want to visit, restaurants, attractions, activities...'
                        }
                        rows={4}
                        className={`input-field resize-none ${
                          errors.originalInput ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                        }`}
                      />
                      {errors.originalInput && (
                        <p className="mt-1 text-sm text-red-600">{errors.originalInput}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Step 2: Preferences */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Trip Preferences</h2>
                  
                  <div className="space-y-6">
                    <PreferenceSelector
                      label="What type of trip is this?"
                      options={tripTypeOptions}
                      selectedValues={formData.tripType ? [formData.tripType] : []}
                      onChange={(values) => updateFormData({ tripType: values[0] || '' })}
                      type="trip-type"
                      singleSelect
                    />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Group Size
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={formData.groupSize}
                          onChange={(e) => updateFormData({ groupSize: parseInt(e.target.value) || 1 })}
                          className="input-field"
                        />
                        {errors.groupSize && (
                          <p className="mt-1 text-sm text-red-600">{errors.groupSize}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => updateFormData({ hasKids: !formData.hasKids })}
                          className={`flex items-center space-x-2 sm:space-x-3 p-3 sm:p-4 rounded-xl border-2 transition-all w-full animate-scale-in ${
                            formData.hasKids
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-200 text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <Baby className={`w-4 h-4 sm:w-5 sm:h-5 ${
                            formData.hasKids ? 'text-primary-600' : 'text-gray-400'
                          }`} />
                          <span className="font-medium text-sm sm:text-base">Traveling with kids</span>
                        </button>
                      </div>
                    </div>
                    
                    <PreferenceSelector
                      label="Travel Pace"
                      options={paceOptions}
                      selectedValues={formData.pace ? [formData.pace] : []}
                      onChange={(values) => updateFormData({ pace: values[0] || '' })}
                      singleSelect
                    />
                    
                    <PreferenceSelector
                      label="What are you interested in?"
                      options={preferenceOptions}
                      selectedValues={formData.preferences}
                      onChange={(values) => updateFormData({ preferences: values })}
                      maxSelections={5}
                      type="preferences"
                    />
                    
                    {/* Privacy Settings */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Privacy Settings
                      </label>
                      <button
                        type="button"
                        onClick={() => updateFormData({ isPublic: !formData.isPublic })}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all w-full animate-scale-in ${
                          formData.isPublic
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            formData.isPublic ? 'bg-green-500' : 'bg-gray-300'
                          }`}>
                            {formData.isPublic && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-gray-900">
                              {formData.isPublic ? 'Public Trip' : 'Private Trip'}
                            </p>
                            <p className="text-sm text-gray-600">
                              {formData.isPublic 
                                ? 'Other users can discover and view your trip'
                                : 'Only you can see this trip'
                              }
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                    
                    {errors.tripType && (
                      <p className="text-sm text-red-600">{errors.tripType}</p>
                    )}
                    {errors.pace && (
                      <p className="text-sm text-red-600">{errors.pace}</p>
                    )}
                    {errors.preferences && (
                      <p className="text-sm text-red-600">{errors.preferences}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 3: Generate */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fade-in text-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Ready to Generate Your Trip!</h2>
                  
                  <div className="bg-gray-50 rounded-xl p-6 text-left mb-6">
                    <h3 className="font-medium text-gray-900 mb-3">Trip Summary</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><span className="font-medium">Destination:</span> {formData.destination}</p>
                      <p><span className="font-medium">Dates:</span> {
                        formData.tripMode === 'guide' && formData.tripMonth && formData.tripYear
                          ? `${new Date(parseInt(formData.tripYear), parseInt(formData.tripMonth) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
                          : `${formData.startDate} to ${formData.endDate}`
                      }</p>
                      <p><span className="font-medium">Trip Type:</span> {tripTypeOptions.find(t => t.value === formData.tripType)?.label}</p>
                      <p><span className="font-medium">Group Size:</span> {formData.groupSize} {formData.hasKids ? '(with kids)' : ''}</p>
                      <p><span className="font-medium">Pace:</span> {paceOptions.find(p => p.value === formData.pace)?.label}</p>
                      <p><span className="font-medium">Interests:</span> {formData.preferences.map(p => preferenceOptions.find(opt => opt.value === p)?.label).join(', ')}</p>
                      <p><span className="font-medium">Privacy:</span> {formData.isPublic ? 'Public (shareable)' : 'Private'}</p>
                    </div>
                  </div>
                  
                  {errors.generation && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                      <p className="text-red-600 text-sm">{errors.generation}</p>
                    </div>
                  )}
                  
                  <Button
                    onClick={handleGenerateTrip}
                    isLoading={isGenerating}
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    {isGenerating ? 'Generating Your Trip...' : 'Generate My Trip'}
                  </Button>
                  
                  <p className="text-sm text-gray-500 mt-4">
                    This will create a complete itinerary with recommended places, activities, and timing.
                  </p>
                </div>
              </div>
            )}
            
            {/* Navigation */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 0}
                className={currentStep === 0 ? 'invisible' : ''}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              
              <div className="text-sm text-gray-500">
                Step {currentStep + 1} of {steps.length}
              </div>
              
              {currentStep < steps.length - 1 ? (
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <div className="w-20" /> // Spacer
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}