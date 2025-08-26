import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { ChevronLeft, ChevronRight, X, Sparkles, Mail, Edit, Check } from 'lucide-react';
import { GmailScanProgress } from './GmailScanProgress';
import { TravelProfileSummary } from './TravelProfileSummary';

export function OnboardingWizard() {
  const {
    currentStep,
    isComplete,
    nextStep,
    previousStep,
    selectPath,
    skipOnboarding,
    completeOnboarding,
    temporaryPreferences,
    detectedPreferences,
    updateTemporaryPreferences
  } = useOnboarding();
  
  const navigate = useNavigate();

  // Redirect if already complete
  useEffect(() => {
    if (isComplete && currentStep === 'success') {
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    }
  }, [isComplete, currentStep, navigate]);

  // Step progress indicator - 4 actual steps
  const steps = ['Welcome', 'Connect', 'Scan', 'Complete'];
  const currentStepIndex = {
    'welcome': 0,
    'gmail-connect': 1,
    'scanning': 2,
    'results': 3,
    'gaps': 3,
    'success': 3
  }[currentStep];

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary-50 to-secondary-50 z-50 overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="relative p-6 border-b border-gray-200">
            <button
              onClick={skipOnboarding}
              className="absolute right-6 top-6 text-gray-400 hover:text-gray-600"
              aria-label="Skip onboarding"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Progress indicator */}
            <div className="flex items-center justify-center space-x-2 mb-4">
              {steps.map((step, index) => (
                <div
                  key={step}
                  className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      index <= currentStepIndex
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {index < currentStepIndex ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-2 ${
                        index < currentStepIndex
                          ? 'bg-primary-500'
                          : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 text-center">
              {currentStep === 'welcome' && 'Welcome to Wanderplan!'}
              {currentStep === 'gmail-connect' && 'Connect Your Gmail'}
              {currentStep === 'scanning' && 'Analyzing Your Travel History'}
              {currentStep === 'results' && 'Your Travel Profile'}
              {currentStep === 'gaps' && 'Complete Your Profile'}
              {currentStep === 'success' && '🎉 All Set!'}
            </h2>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Welcome Step */}
            {currentStep === 'welcome' && (
              <div className="space-y-6">
                <p className="text-gray-600 text-center">
                  Let's personalize your travel experience! Choose how you'd like to get started:
                </p>
                
                <div className="space-y-3">
                  <button
                    onClick={() => selectPath('gmail')}
                    className="w-full p-4 rounded-lg border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 transition-all group"
                  >
                    <div className="flex items-center">
                      <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition-colors">
                        <Mail className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="ml-4 text-left">
                        <h3 className="font-semibold text-gray-900">
                          ✨ Build Profile from Gmail (Recommended)
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Instantly create your travel profile by analyzing your booking emails
                        </p>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => selectPath('manual')}
                    className="w-full p-4 rounded-lg border-2 border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all group"
                  >
                    <div className="flex items-center">
                      <div className="bg-gray-100 p-3 rounded-lg group-hover:bg-gray-200 transition-colors">
                        <Edit className="w-6 h-6 text-gray-600" />
                      </div>
                      <div className="ml-4 text-left">
                        <h3 className="font-semibold text-gray-900">
                          Set Preferences Manually
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Take 2 minutes to tell us about your travel style
                        </p>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => selectPath('skip')}
                    className="w-full p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all"
                  >
                    <p className="text-gray-600">Skip for now</p>
                  </button>
                </div>
              </div>
            )}

            {/* Gmail Connect Step */}
            {currentStep === 'gmail-connect' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="mx-auto w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <Mail className="w-10 h-10 text-purple-600" />
                  </div>
                  <p className="text-gray-600 mb-6">
                    We'll securely connect to your Gmail to find travel bookings.
                    Your privacy is protected - we only read booking confirmations.
                  </p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm text-gray-600">
                  <div className="flex items-start">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span>We only access booking confirmation emails</span>
                  </div>
                  <div className="flex items-start">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span>Your data stays private and secure</span>
                  </div>
                  <div className="flex items-start">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span>Disconnect anytime from settings</span>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    // TODO: Initiate OAuth flow
                    console.log('Starting OAuth flow...');
                    nextStep();
                  }}
                  className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Connect Gmail Account
                </button>
              </div>
            )}

            {/* Scanning Step */}
            {currentStep === 'scanning' && (
              <GmailScanProgress />
            )}

            {/* Results Step */}
            {currentStep === 'results' && (
              <TravelProfileSummary 
                preferences={detectedPreferences || temporaryPreferences}
                onEdit={(prefs) => updateTemporaryPreferences(prefs)}
              />
            )}

            {/* Gaps Step - Manual Preferences */}
            {currentStep === 'gaps' && (
              <div className="space-y-6">
                <p className="text-gray-600 text-center">
                  Let's fill in a few more details to complete your travel profile:
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What's your typical trip budget per day?
                    </label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      value={temporaryPreferences.budget_type || 'mid_range'}
                      onChange={(e) => updateTemporaryPreferences({ 
                        budget_type: e.target.value as any 
                      })}
                    >
                      <option value="shoestring">Shoestring ($0-50)</option>
                      <option value="mid_range">Mid-range ($50-200)</option>
                      <option value="luxury">Luxury ($200-500)</option>
                      <option value="ultra_luxury">Ultra Luxury ($500+)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred accommodation style
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Hotel', 'Airbnb', 'Hostel', 'Resort'].map((style) => {
                        const hasStyle = (temporaryPreferences.accommodation_style || [])
                          .some(pref => typeof pref === 'object' ? pref.style === style.toLowerCase() : false);
                        
                        return (
                        <button
                          key={style}
                          onClick={() => {
                            const current = temporaryPreferences.accommodation_style || [];
                            const styleLower = style.toLowerCase();
                            const updated = hasStyle
                              ? current.filter(s => typeof s === 'object' && s.style !== styleLower)
                              : [...current, { 
                                  style: styleLower, 
                                  confidence: 0.5, 
                                  last_seen: new Date().toISOString(), 
                                  count: 1 
                                }];
                            updateTemporaryPreferences({ accommodation_style: updated });
                          }}
                          className={`p-2 rounded-lg border-2 transition-all ${
                            hasStyle
                              ? 'border-purple-400 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {style}
                        </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dietary restrictions (if any)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Vegetarian, Gluten-free"
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      value={(temporaryPreferences.dietary_restrictions || []).join(', ')}
                      onChange={(e) => updateTemporaryPreferences({ 
                        dietary_restrictions: e.target.value
                          .split(',')
                          .map(s => s.trim())
                          .filter(Boolean)
                      })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Success Step */}
            {currentStep === 'success' && (
              <div className="text-center py-8">
                <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  You're all set!
                </h3>
                <p className="text-gray-600 mb-6">
                  Your personalized travel profile is ready. Let's plan your next adventure!
                </p>
                <p className="text-sm text-gray-500">
                  Redirecting to dashboard...
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {currentStep !== 'success' && (
            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-between items-center">
              <button
                onClick={previousStep}
                disabled={currentStep === 'welcome'}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  currentStep === 'welcome'
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </button>
              
              {currentStep === 'gaps' || currentStep === 'results' ? (
                <button
                  onClick={completeOnboarding}
                  className="flex items-center px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Complete Setup
                  <Check className="w-4 h-4 ml-2" />
                </button>
              ) : currentStep !== 'welcome' && currentStep !== 'gmail-connect' ? (
                <button
                  onClick={nextStep}
                  className="flex items-center px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}