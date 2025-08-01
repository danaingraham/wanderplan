
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Sparkles, FileText, Baby } from 'lucide-react'
import { StepIndicator } from '../components/forms/StepIndicator'
import { DestinationAutocomplete } from '../components/forms/DestinationAutocomplete'
import { DateRangePicker } from '../components/forms/DateRangePicker'
import { PreferenceSelector } from '../components/forms/PreferenceSelector'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { ApiStatus } from '../components/ui/ApiStatus'
import { useTrips } from '../contexts/TripContext'
import { realApiService } from '../services/realApi'

const steps = ['Basic Info', 'Preferences', 'Generate']

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
  
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    destination: '',
    destinationCoords: null as { lat: number; lng: number } | null,
    startDate: '',
    endDate: '',
    generationMode: 'ai' as 'paste' | 'ai',
    originalInput: '',
    tripType: '',
    groupSize: 2,
    hasKids: false,
    pace: '',
    preferences: [] as string[],
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
    
    if (step === 1) {
      if (!formData.title.trim()) newErrors.title = 'Trip title is required'
      if (!formData.destination.trim()) newErrors.destination = 'Destination is required'
      if (!formData.startDate) newErrors.startDate = 'Start date is required'
      if (!formData.endDate) newErrors.endDate = 'End date is required'
      if (formData.startDate && formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
        newErrors.endDate = 'End date must be after start date'
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
      console.log('Generating trip with data:', {
        destination: formData.destination,
        start_date: formData.startDate,
        end_date: formData.endDate,
        trip_type: formData.tripType,
        group_size: formData.groupSize,
        has_kids: formData.hasKids,
        pace: formData.pace,
        preferences: formData.preferences,
        original_input: formData.originalInput,
      })
      
      const response = await realApiService.generateItinerary({
        destination: formData.destination,
        start_date: formData.startDate,
        end_date: formData.endDate,
        trip_type: formData.tripType,
        group_size: formData.groupSize,
        has_kids: formData.hasKids,
        pace: formData.pace,
        preferences: formData.preferences,
        original_input: formData.originalInput,
      })
      
      console.log('API response:', response)
      
      if (response.success && response.data) {
        // Create the trip
        const tripId = createTrip({
          ...response.data.trip,
          title: formData.title,
          latitude: formData.destinationCoords?.lat,
          longitude: formData.destinationCoords?.lng,
        })
        
        console.log('Created trip with ID:', tripId)
        
        // Create all places
        response.data.places.forEach(place => {
          createPlace({
            ...place,
            trip_id: tripId,
          })
        })
        
        console.log('Created', response.data.places.length, 'places')
        
        // Navigate to the trip
        navigate(`/trip/${tripId}`)
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
            Let's plan your next adventure! We'll help you create the perfect itinerary.
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
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Trip Information</h2>
                  
                  <div className="space-y-4">
                    <Input
                      label="Trip Title"
                      value={formData.title}
                      onChange={(e) => updateFormData({ title: e.target.value })}
                      placeholder="My Amazing Adventure"
                      error={errors.title}
                    />
                    
                    <DestinationAutocomplete
                      label="Destination"
                      value={formData.destination}
                      onChange={(destination, coords) => updateFormData({ 
                        destination, 
                        destinationCoords: coords || null 
                      })}
                      error={errors.destination}
                    />
                    
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
                      minDate={new Date()}
                      error={errors.startDate || errors.endDate}
                      placeholder="Click to select your travel dates"
                    />
                  </div>
                </div>
                
                {/* Generation Mode */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">How would you like to plan?</h3>
                  
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
                      <h4 className="font-medium text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">AI Creates from Scratch</h4>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Let our AI build a complete itinerary based on your preferences
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
                      <h4 className="font-medium text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Paste Ideas & Organize</h4>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Have places in mind? Paste them and we'll organize into a schedule
                      </p>
                    </button>
                  </div>
                  
                  {formData.generationMode === 'paste' && (
                    <div className="mt-4">
                      <textarea
                        value={formData.originalInput}
                        onChange={(e) => updateFormData({ originalInput: e.target.value })}
                        placeholder="Paste your travel ideas, places you want to visit, restaurants, etc..."
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
                      <p><span className="font-medium">Dates:</span> {formData.startDate} to {formData.endDate}</p>
                      <p><span className="font-medium">Trip Type:</span> {tripTypeOptions.find(t => t.value === formData.tripType)?.label}</p>
                      <p><span className="font-medium">Group Size:</span> {formData.groupSize} {formData.hasKids ? '(with kids)' : ''}</p>
                      <p><span className="font-medium">Pace:</span> {paceOptions.find(p => p.value === formData.pace)?.label}</p>
                      <p><span className="font-medium">Interests:</span> {formData.preferences.map(p => preferenceOptions.find(opt => opt.value === p)?.label).join(', ')}</p>
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
                disabled={currentStep === 1}
                className={currentStep === 1 ? 'invisible' : ''}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              
              <div className="text-sm text-gray-500">
                Step {currentStep} of {steps.length}
              </div>
              
              {currentStep < steps.length ? (
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