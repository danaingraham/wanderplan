import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOnboarding } from '../contexts/OnboardingContext';
import { useUser } from '../contexts/UserContext';
import { TravelDNA } from '../components/dna/TravelDNA';
import { TravelArchetypeCard } from '../components/dna/TravelArchetype';
import { PreferenceCard, PreferenceItem } from '../components/preferences/PreferenceCard';
import { OnboardingWizard } from '../components/onboarding/OnboardingWizard';
import { useUserPreferences } from '../hooks/useUserPreferences';
// TODO: Re-enable Gmail integration
// import { gmailAuthService } from '../services/gmail/gmailAuthService';
// import { gmailSyncService } from '../services/gmail/gmailSync';
import { googleAuthService } from '../services/googleAuthService';
import { 
  calculateDNAScores, 
  determineArchetype, 
  calculateCompleteness,
  updateDNA 
} from '../utils/travelDNA';
import { Sparkles, RefreshCw, Mail, X, LogOut, Settings, CheckCircle, AlertCircle } from 'lucide-react';

export function Profile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useUser();
  const { currentStep } = useOnboarding();
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const { preferences, savePreferences } = useUserPreferences();
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [dnaUpdateKey, setDnaUpdateKey] = useState(0); // For forcing DNA animation
  const [gmailConnected, setGmailConnected] = useState(false);
  const [checkingGmail, setCheckingGmail] = useState(true);
  const [syncingGmail, setSyncingGmail] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);

  // Calculate DNA from preferences
  const dnaData = preferences ? {
    scores: preferences.dna_scores || calculateDNAScores(preferences),
    archetype: preferences.travel_archetype || determineArchetype(preferences.dna_scores || calculateDNAScores(preferences)),
    completeness: preferences.dna_completeness || calculateCompleteness(preferences)
  } : null;

  // Check Gmail connection status on mount
  useEffect(() => {
    const checkGmailConnection = async () => {
      if (user?.id) {
        try {
          // TODO: Re-enable Gmail integration
          // const status = await gmailAuthService.getConnectionStatus(user.id);
          // setGmailConnected(status.isConnected);
          setGmailConnected(false); // Temporarily disabled
        } catch (error) {
          console.error('Failed to check Gmail connection:', error);
        } finally {
          setCheckingGmail(false);
        }
      } else {
        setCheckingGmail(false);
      }
    };

    checkGmailConnection();
  }, [user]);

  // Handle OAuth callback result
  useEffect(() => {
    const gmailParam = searchParams.get('gmail');
    if (gmailParam === 'connected') {
      setConnectionMessage('Gmail connected successfully!');
      setGmailConnected(true);
      setTimeout(() => setConnectionMessage(null), 5000);
    } else if (gmailParam === 'error') {
      setConnectionMessage('Failed to connect Gmail. Please try again.');
      setTimeout(() => setConnectionMessage(null), 5000);
    }
  }, [searchParams]);

  // Update DNA when preferences change
  useEffect(() => {
    if (preferences && !preferences.dna_scores) {
      const updatedPrefs = updateDNA(preferences);
      savePreferences(updatedPrefs);
    }
  }, [preferences]);

  const handleConnectGmail = async () => {
    // Redirect to Google OAuth
    const authUrl = await googleAuthService.authorizeGmail();
    window.location.href = authUrl;
  };

  const handleSyncGmail = async () => {
    if (!user?.id) return;

    setSyncingGmail(true);
    try {
      // TODO: Re-enable Gmail integration
      // const result = await gmailSyncService.performInitialSync(user.id);
      const result = { success: false, message: 'Gmail integration temporarily disabled' }; // Temporarily disabled
      if (result.success) {
        // setConnectionMessage(`Synced ${result.bookingsFound} bookings from ${result.emailsFetched} emails`);
        // Refresh preferences to show new data
        window.location.reload();
      } else {
        setConnectionMessage('Sync failed. Please try again.');
      }
    } catch (error) {
      console.error('Gmail sync failed:', error);
      setConnectionMessage('Failed to sync Gmail. Please try again.');
    } finally {
      setSyncingGmail(false);
      setTimeout(() => setConnectionMessage(null), 5000);
    }
  };

  const handleCreateDNA = () => {
    if (gmailConnected) {
      handleSyncGmail();
    } else {
      handleConnectGmail();
    }
  };

  // Close modal when onboarding completes
  useEffect(() => {
    if (currentStep === 'success' && showOnboardingModal) {
      setShowOnboardingModal(false);
      window.location.reload();
    }
  }, [currentStep, showOnboardingModal]);

  const handleUpdateDNA = async () => {
    if (preferences) {
      const updatedPrefs = updateDNA(preferences);
      await savePreferences(updatedPrefs);
      setDnaUpdateKey(prev => prev + 1); // Trigger animation
    }
  };

  const handlePreferenceUpdate = async (field: string, value: any) => {
    if (!preferences) return;
    
    const updatedPrefs = {
      ...preferences,
      [field]: value
    };
    
    // Recalculate DNA with new preferences
    const withDNA = updateDNA(updatedPrefs);
    await savePreferences(withDNA);
    setDnaUpdateKey(prev => prev + 1); // Trigger animation
  };

  const hasDNA = dnaData && dnaData.completeness > 0;

  const toggleCard = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };


  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Your Travel Profile</h1>
          <p className="text-sm sm:text-base text-gray-600">Discover and refine your unique travel style</p>
        </div>
      </div>

      {!hasDNA ? (
        // Show Create DNA prompt if no DNA exists
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
                Discover your unique travel personality and get personalized trip recommendations
              </p>
            </div>

            <div className="max-w-xs mx-auto">
              {connectionMessage && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${
                  connectionMessage.includes('success') || connectionMessage.includes('Synced') 
                    ? 'bg-green-50 text-green-800' 
                    : 'bg-red-50 text-red-800'
                }`}>
                  {connectionMessage}
                </div>
              )}
              <button
                onClick={handleCreateDNA}
                disabled={checkingGmail || syncingGmail}
                className="w-full p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-primary-400 hover:shadow-lg transition-all group flex flex-col items-center justify-center text-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {syncingGmail ? (
                  <>
                    <RefreshCw className="w-8 h-8 text-primary-600 mb-3 animate-spin" />
                    <div className="font-semibold">Syncing...</div>
                    <div className="text-xs text-gray-600 mt-1">Please wait</div>
                  </>
                ) : gmailConnected ? (
                  <>
                    <CheckCircle className="w-8 h-8 text-green-600 mb-3" />
                    <div className="font-semibold">Sync Travel History</div>
                    <div className="text-xs text-gray-600 mt-1">Gmail connected - Click to sync</div>
                  </>
                ) : (
                  <>
                    <Mail className="w-8 h-8 text-primary-600 mb-3" />
                    <div className="font-semibold">Connect Gmail</div>
                    <div className="text-xs text-gray-600 mt-1">Auto-detect from past trips</div>
                  </>
                )}
              </button>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setExpandedCard('travel-style')}
                className="text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                Or start by adding preferences manually →
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Show existing Travel DNA with integrated preferences
        <div className="space-y-6">
            {/* Connection Status Message */}
            {connectionMessage && (
              <div className={`p-4 rounded-lg ${
                connectionMessage.includes('success') || connectionMessage.includes('Synced') 
                  ? 'bg-green-50 text-green-800' 
                  : 'bg-red-50 text-red-800'
              }`}>
                <div className="flex items-center">
                  {connectionMessage.includes('success') || connectionMessage.includes('Synced') 
                    ? <CheckCircle className="w-5 h-5 mr-2" />
                    : <AlertCircle className="w-5 h-5 mr-2" />
                  }
                  {connectionMessage}
                </div>
              </div>
            )}
            
            {/* Archetype Card */}
            <TravelArchetypeCard 
              archetype={dnaData.archetype} 
              size="lg"
            />
            
            {/* DNA Chart with Actions */}
            <div className="card overflow-visible">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-semibold">Your Travel DNA</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCreateDNA}
                    disabled={checkingGmail || syncingGmail}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={gmailConnected ? "Sync travel history from Gmail" : "Connect Gmail account"}
                  >
                    {syncingGmail ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span className="hidden sm:inline">Syncing...</span>
                      </>
                    ) : gmailConnected ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">Sync Gmail</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        <span className="hidden sm:inline">Connect Gmail</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleUpdateDNA}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span className="hidden sm:inline">Refresh</span>
                  </button>
                </div>
              </div>
              
              {/* Desktop/Tablet: Radar Chart */}
              <div className="hidden md:flex justify-center">
                <div className="hidden lg:block">
                  <TravelDNA scores={dnaData.scores} size="lg" key={dnaUpdateKey} />
                </div>
                <div className="block lg:hidden">
                  <TravelDNA scores={dnaData.scores} size="md" key={dnaUpdateKey} />
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

            {/* Preference Cards */}
            <div className="space-y-4">
              {/* Travel Style Card */}
              <PreferenceCard
                title="Travel Style"
                icon="✈️"
                expanded={expandedCard === 'travel-style'}
                onToggle={() => toggleCard('travel-style')}
              >
                <div className="space-y-4">
                  <PreferenceItem
                    label="Travel Pace"
                    value={preferences?.pace_preference}
                    type="select"
                    options={[
                      { value: 'relaxed', label: 'Relaxed - Few activities, lots of downtime' },
                      { value: 'moderate', label: 'Moderate - Balanced mix of activities' },
                      { value: 'packed', label: 'Packed - See and do as much as possible' }
                    ]}
                    onSave={(value) => handlePreferenceUpdate('pace_preference', value)}
                  />
                  
                  <PreferenceItem
                    label="Daily Budget"
                    value={preferences?.budget}
                    type="budget"
                    onSave={(value) => handlePreferenceUpdate('budget', value)}
                  />
                  
                  <PreferenceItem
                    label="Budget Type"
                    value={preferences?.budget_type}
                    type="select"
                    options={[
                      { value: 'shoestring', label: 'Shoestring ($0-50/day)' },
                      { value: 'mid_range', label: 'Mid Range ($50-150/day)' },
                      { value: 'luxury', label: 'Luxury ($150-500/day)' },
                      { value: 'ultra_luxury', label: 'Ultra Luxury ($500+/day)' }
                    ]}
                    onSave={(value) => handlePreferenceUpdate('budget_type', value)}
                  />
                  
                  <PreferenceItem
                    label="Group Size Preference"
                    value={preferences?.group_size_preference}
                    type="select"
                    options={[
                      { value: 'solo', label: 'Solo Travel' },
                      { value: 'couple', label: 'Couple/Partner' },
                      { value: 'small_group', label: 'Small Group (3-5)' },
                      { value: 'large_group', label: 'Large Group (6+)' }
                    ]}
                    onSave={(value) => handlePreferenceUpdate('group_size_preference', value)}
                  />
                </div>
              </PreferenceCard>

              {/* Accommodation Card */}
              <PreferenceCard
                title="Accommodation"
                icon="🏨"
                expanded={expandedCard === 'accommodation'}
                onToggle={() => toggleCard('accommodation')}
              >
                <PreferenceItem
                  label="Preferred Styles"
                  value={preferences?.accommodation_style?.map((a: any) => 
                    typeof a === 'string' ? a : a.style
                  )}
                  type="chips"
                  options={[
                    { value: 'hotel', label: 'Hotel' },
                    { value: 'airbnb', label: 'Airbnb' },
                    { value: 'hostel', label: 'Hostel' },
                    { value: 'resort', label: 'Resort' },
                    { value: 'boutique', label: 'Boutique' },
                    { value: 'vacation_rental', label: 'Vacation Rental' }
                  ]}
                  onSave={(value) => handlePreferenceUpdate('accommodation_style', 
                    value.map((v: string) => ({ style: v, confidence: 0.8, count: 1, last_seen: new Date().toISOString() }))
                  )}
                />
              </PreferenceCard>

              {/* Food & Dining Card */}
              <PreferenceCard
                title="Food & Dining"
                icon="🍽️"
                expanded={expandedCard === 'dining'}
                onToggle={() => toggleCard('dining')}
              >
                <div className="space-y-4">
                  <PreferenceItem
                    label="Favorite Cuisines"
                    value={preferences?.preferred_cuisines?.map((c: any) => c.cuisine)}
                    type="chips"
                    options={[
                      'Italian', 'Japanese', 'Mexican', 'Thai', 'Indian',
                      'French', 'Chinese', 'Mediterranean', 'American', 'Korean'
                    ]}
                    onSave={(value) => handlePreferenceUpdate('preferred_cuisines',
                      value.map((v: string) => ({ cuisine: v, confidence: 0.8, sample_size: 1 }))
                    )}
                  />
                  
                  <PreferenceItem
                    label="Dietary Restrictions"
                    value={preferences?.dietary_restrictions}
                    type="chips"
                    options={[
                      'Vegetarian', 'Vegan', 'Gluten-Free', 'Kosher', 'Halal',
                      'Dairy-Free', 'Nut-Free', 'Pescatarian'
                    ]}
                    onSave={(value) => handlePreferenceUpdate('dietary_restrictions', value)}
                  />
                </div>
              </PreferenceCard>

              {/* Activities Card */}
              <PreferenceCard
                title="Activities & Interests"
                icon="🎯"
                expanded={expandedCard === 'activities'}
                onToggle={() => toggleCard('activities')}
              >
                <PreferenceItem
                  label="Preferred Activities"
                  value={preferences?.activity_types?.map((a: any) => a.type)}
                  type="chips"
                  options={[
                    'Museums', 'Hiking', 'Beach', 'Shopping', 'Nightlife',
                    'Food Tours', 'Cultural Sites', 'Adventure Sports', 'Spa & Wellness',
                    'Photography', 'Local Markets', 'Wine Tasting', 'Art Galleries'
                  ]}
                  onSave={(value) => handlePreferenceUpdate('activity_types',
                    value.map((v: string) => ({ type: v, confidence: 0.8, recency_weight: 1, count: 1 }))
                  )}
                />
              </PreferenceCard>
            </div>

            {/* Account Settings */}
            <div className="mt-8 card">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold">Account Settings</h2>
              </div>
              
              {user && (
                <div className="space-y-3">
                  {/* User Info */}
                  <div className="pb-3 border-b border-gray-200">
                    <p className="text-sm text-gray-600">Signed in as</p>
                    <p className="font-medium text-gray-900">{user.email}</p>
                  </div>
                  
                  {/* Sign Out Button */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full justify-center sm:justify-start sm:w-auto"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
        </div>
      )}


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
  );
}