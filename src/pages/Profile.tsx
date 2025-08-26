import { useState, useEffect } from 'react'
import { useUser } from '../contexts/UserContext'
import { useOnboarding } from '../contexts/OnboardingContext'
import { PreferencesDisplay } from '../components/preferences/PreferencesDisplay'
import { PreferencesForm } from '../components/preferences/PreferencesForm'
import { TravelDNA } from '../components/dna/TravelDNA'
import { TravelArchetypeCard } from '../components/dna/TravelArchetype'
import { DNACompleteness } from '../components/dna/DNACompleteness'
import { DNAStats } from '../components/dna/DNAStats'
import { OnboardingWizard } from '../components/onboarding/OnboardingWizard'
import { useUserPreferences } from '../hooks/useUserPreferences'
import { 
  calculateDNAScores, 
  determineArchetype, 
  calculateCompleteness,
  updateDNA 
} from '../utils/travelDNA'
import { Sparkles, RefreshCw, Edit, Mail, TrendingUp, X } from 'lucide-react'

export function Profile() {
  const { user, logout } = useUser()
  const { startWithGmail, currentStep } = useOnboarding()
  const [showEditForm, setShowEditForm] = useState(false)
  const [showOnboardingModal, setShowOnboardingModal] = useState(false)
  const { preferences, loading, savePreferences } = useUserPreferences()
  const [activeTab, setActiveTab] = useState<'dna' | 'preferences' | 'account'>('dna')

  // Calculate DNA from preferences
  const dnaData = preferences ? {
    scores: preferences.dna_scores || calculateDNAScores(preferences),
    archetype: preferences.travel_archetype || determineArchetype(preferences.dna_scores || calculateDNAScores(preferences)),
    completeness: preferences.dna_completeness || calculateCompleteness(preferences)
  } : null

  // Update DNA when preferences change
  useEffect(() => {
    if (preferences && !preferences.dna_scores) {
      const updatedPrefs = updateDNA(preferences)
      savePreferences(updatedPrefs)
    }
  }, [preferences])

  const handleCreateDNA = (method: 'gmail' | 'manual' | 'quiz') => {
    if (method === 'gmail') {
      // Start Gmail sync flow in modal
      startWithGmail()
      setShowOnboardingModal(true)
    } else if (method === 'manual') {
      // Go directly to edit preferences
      setActiveTab('preferences')
      setShowEditForm(true)
    } else if (method === 'quiz') {
      // TODO: Navigate to quiz page when implemented
      alert('Quiz coming soon!')
    }
  }

  // Close modal when onboarding completes
  useEffect(() => {
    if (currentStep === 'success' && showOnboardingModal) {
      setShowOnboardingModal(false)
      // Refresh the page to show new DNA
      window.location.reload()
    }
  }, [currentStep, showOnboardingModal])

  const handleUpdateDNA = async () => {
    if (preferences) {
      const updatedPrefs = updateDNA(preferences)
      await savePreferences(updatedPrefs)
    }
  }

  const hasDNA = dnaData && dnaData.completeness > 0

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Profile</h1>
        <p className="text-gray-600">Manage your Travel DNA and account settings</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('dna')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'dna'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Travel DNA
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'preferences'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Preferences
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'account'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Account
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'dna' && (
          <>
            {hasDNA ? (
              // Show existing Travel DNA
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main DNA Visualization */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Archetype Card */}
                  <TravelArchetypeCard 
                    archetype={dnaData.archetype} 
                    size="lg"
                  />
                  
                  {/* DNA Chart */}
                  <div className="card overflow-visible">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg sm:text-xl font-semibold">Your Travel DNA</h2>
                      <button
                        onClick={handleUpdateDNA}
                        className="flex items-center gap-1 sm:gap-2 text-primary-600 hover:text-primary-700 text-sm"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span className="hidden sm:inline">Refresh DNA</span>
                        <span className="sm:hidden">Refresh</span>
                      </button>
                    </div>
                    {/* Desktop/Tablet: Radar Chart */}
                    <div className="hidden md:flex justify-center">
                      <div className="hidden lg:block">
                        <TravelDNA scores={dnaData.scores} size="lg" />
                      </div>
                      <div className="block lg:hidden">
                        <TravelDNA scores={dnaData.scores} size="md" />
                      </div>
                    </div>
                    
                    {/* Mobile: Score List */}
                    <div className="block md:hidden space-y-3">
                      {Object.entries(dnaData.scores).map(([key, value]) => {
                        const dimension = {
                          adventure: { label: 'Adventure', color: '#10b981', icon: '🏔️' },
                          culture: { label: 'Culture', color: '#8b5cf6', icon: '🏛️' },
                          luxury: { label: 'Luxury', color: '#ec4899', icon: '💎' },
                          social: { label: 'Social', color: '#3b82f6', icon: '👥' },
                          relaxation: { label: 'Relaxation', color: '#06b6d4', icon: '🏖️' },
                          culinary: { label: 'Culinary', color: '#f97316', icon: '🍽️' }
                        }[key];
                        
                        if (!dimension) return null;
                        
                        return (
                          <div key={key} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{dimension.icon}</span>
                              <span className="font-medium text-gray-700">{dimension.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="h-2 rounded-full transition-all duration-500"
                                  style={{ 
                                    width: `${value}%`,
                                    backgroundColor: dimension.color 
                                  }}
                                />
                              </div>
                              <span className="text-sm font-semibold text-gray-600 w-10 text-right">
                                {value as number}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Update Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button
                      onClick={() => handleCreateDNA('gmail')}
                      className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-primary-400 transition-colors group flex flex-col items-center justify-center text-center"
                    >
                      <Mail className="w-6 h-6 text-primary-600 mb-2" />
                      <div className="font-medium">Sync Gmail</div>
                      <div className="text-xs text-gray-600">Update from trips</div>
                    </button>
                    
                    <button
                      onClick={() => handleCreateDNA('manual')}
                      className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-primary-400 transition-colors group flex flex-col items-center justify-center text-center"
                    >
                      <Edit className="w-6 h-6 text-primary-600 mb-2" />
                      <div className="font-medium">Edit Manually</div>
                      <div className="text-xs text-gray-600">Fine-tune preferences</div>
                    </button>
                    
                    <button
                      onClick={() => handleCreateDNA('quiz')}
                      className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-primary-400 transition-colors group flex flex-col items-center justify-center text-center"
                    >
                      <Sparkles className="w-6 h-6 text-primary-600 mb-2" />
                      <div className="font-medium">Take Quiz</div>
                      <div className="text-xs text-gray-600">Discover your style</div>
                    </button>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Completeness */}
                  <div className="card">
                    <h3 className="text-lg font-semibold mb-4">DNA Completeness</h3>
                    <DNACompleteness 
                      completeness={dnaData.completeness} 
                      size="md"
                    />
                  </div>

                  {/* Stats */}
                  <div className="card">
                    <h3 className="text-lg font-semibold mb-4">Travel Stats</h3>
                    <DNAStats preferences={preferences || {}} variant="list" />
                  </div>

                  {/* How DNA Helps */}
                  <div className="card bg-gradient-to-br from-primary-50 to-secondary-50">
                    <h3 className="text-lg font-semibold mb-2">How Your DNA Helps</h3>
                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-primary-600 mt-0.5" />
                        <span>Personalized trip recommendations</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-primary-600 mt-0.5" />
                        <span>Better hotel & restaurant matches</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-primary-600 mt-0.5" />
                        <span>Activities tailored to your style</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Show Create DNA prompt
              <div className="max-w-2xl mx-auto">
                <div className="card text-center py-12">
                  <div className="mb-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full mb-4">
                      <Sparkles className="w-10 h-10 text-primary-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Create Your Travel DNA
                    </h2>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Discover your unique travel personality and get personalized trip recommendations tailored just for you
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
                    <button
                      onClick={() => handleCreateDNA('gmail')}
                      className="p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-primary-400 hover:shadow-lg transition-all group flex flex-col items-center justify-center text-center"
                    >
                      <Mail className="w-8 h-8 text-primary-600 mb-3" />
                      <div className="font-semibold">Gmail Sync</div>
                      <div className="text-xs text-gray-600 mt-1">Auto-detect from trips</div>
                    </button>
                    
                    <button
                      onClick={() => handleCreateDNA('manual')}
                      className="p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-primary-400 hover:shadow-lg transition-all group flex flex-col items-center justify-center text-center"
                    >
                      <Edit className="w-8 h-8 text-primary-600 mb-3" />
                      <div className="font-semibold">Manual Setup</div>
                      <div className="text-xs text-gray-600 mt-1">Enter preferences</div>
                    </button>
                    
                    <button
                      onClick={() => handleCreateDNA('quiz')}
                      className="p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-primary-400 hover:shadow-lg transition-all group flex flex-col items-center justify-center text-center"
                    >
                      <Sparkles className="w-8 h-8 text-primary-600 mb-3" />
                      <div className="font-semibold">Quick Quiz</div>
                      <div className="text-xs text-gray-600 mt-1">5 minute quiz</div>
                    </button>
                  </div>

                  <div className="mt-8 p-4 bg-gray-50 rounded-lg max-w-md mx-auto">
                    <p className="text-sm text-gray-700">
                      <strong>Why create your Travel DNA?</strong><br />
                      We'll analyze your travel style to provide personalized recommendations for hotels, restaurants, and activities that match your unique preferences.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'preferences' && (
          <div className="card">
            {!showEditForm ? (
              <>
                <PreferencesDisplay 
                  preferences={preferences} 
                  loading={loading} 
                />
                <button
                  onClick={() => setShowEditForm(true)}
                  className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                >
                  Edit Preferences
                </button>
              </>
            ) : (
              <>
                <PreferencesForm
                  preferences={preferences}
                  onSave={async (newPrefs) => {
                    const updatedPrefs = updateDNA(newPrefs)
                    await savePreferences(updatedPrefs)
                    setShowEditForm(false)
                  }}
                  loading={loading}
                />
                <button
                  onClick={() => setShowEditForm(false)}
                  className="mt-4 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        )}

        {activeTab === 'account' && (
          <>
            {/* Account Information */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-6">Account Information</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={user?.full_name || ''}
                    className="input-field"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    className="input-field"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <input
                    type="text"
                    value={user?.role || ''}
                    className="input-field"
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <div className="card">
              <button
                onClick={logout}
                className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
              >
                Sign Out
              </button>
            </div>
          </>
        )}
      </div>

      {/* Onboarding Modal */}
      {showOnboardingModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setShowOnboardingModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <OnboardingWizard isModal={true} onClose={() => setShowOnboardingModal(false)} />
          </div>
        </div>
      )}
    </div>
  )
}