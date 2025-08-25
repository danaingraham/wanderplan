import { useState, useEffect } from 'react';
import { Settings, Check, Edit2 } from 'lucide-react';
import { userPreferencesService } from '../../services/userPreferences';
import { useUser } from '../../contexts/UserContext';
import type { UserPreferences } from '../../types/preferences';
import type { PreferenceTracking } from '../../types/preferenceTracking';
import { trackPreference } from '../../types/preferenceTracking';

interface PreferenceOverrideProps {
  onPreferencesChange?: (preferences: Partial<UserPreferences> | null) => void;
  onTrackingChange?: (tracking: PreferenceTracking) => void;
  className?: string;
}

export function PreferenceOverride({ onPreferencesChange, onTrackingChange, className = '' }: PreferenceOverrideProps) {
  const { user } = useUser();
  const [usePreferences, setUsePreferences] = useState(true);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [overrides, setOverrides] = useState<Partial<UserPreferences>>({});
  const [editingField, setEditingField] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [initialized, setInitialized] = useState(false);

  // Load user preferences on mount
  useEffect(() => {
    if (user?.id && !initialized) {
      console.log('📋 PreferenceOverride: Loading preferences for user:', user.id);
      setLoading(true);
      userPreferencesService.getPreferences(user.id)
        .then(prefs => {
          console.log('✅ PreferenceOverride: Preferences loaded:', prefs);
          setPreferences(prefs);
          setLoading(false);
          setInitialized(true);
        })
        .catch(err => {
          console.error('❌ PreferenceOverride: Failed to load preferences:', err);
          setLoading(false);
          setInitialized(true);
        });
    } else if (!user?.id) {
      console.log('ℹ️ PreferenceOverride: No user ID available');
      setLoading(false);
      setInitialized(true);
    }
  }, [user?.id, initialized]);

  // Notify parent when preferences change (but not on initial load)
  useEffect(() => {
    if (!initialized) return;
    
    if (usePreferences && preferences) {
      // Merge preferences with overrides
      const finalPreferences = { ...preferences, ...overrides };
      onPreferencesChange?.(finalPreferences);
      
      // Track preference sources
      const tracking: PreferenceTracking = {};
      
      // Track budget
      if (finalPreferences.budget) {
        tracking.budget = trackPreference(
          finalPreferences.budget,
          overrides.budget ? 'override' : 'profile'
        );
      }
      
      // Track budget type
      if (finalPreferences.budget_type) {
        tracking.budgetType = trackPreference(
          finalPreferences.budget_type,
          overrides.budget_type ? 'override' : 'profile'
        );
      }
      
      // Track dietary restrictions
      if (finalPreferences.dietary_restrictions?.length) {
        tracking.dietaryRestrictions = trackPreference(
          finalPreferences.dietary_restrictions,
          overrides.dietary_restrictions ? 'override' : 'profile'
        );
      }
      
      // Track accommodation style
      if (finalPreferences.accommodation_style?.length) {
        tracking.accommodationStyle = trackPreference(
          finalPreferences.accommodation_style,
          overrides.accommodation_style ? 'override' : 'profile'
        );
      }
      
      // Track accessibility needs
      if (finalPreferences.accessibility_needs) {
        tracking.accessibilityNeeds = trackPreference(
          finalPreferences.accessibility_needs,
          overrides.accessibility_needs ? 'override' : 'profile'
        );
      }
      
      onTrackingChange?.(tracking);
    } else {
      onPreferencesChange?.(null);
      onTrackingChange?.({});
    }
    // Deliberately not including callbacks in deps to avoid infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usePreferences, preferences, overrides, initialized]);

  const handleToggle = () => {
    setUsePreferences(!usePreferences);
  };

  const handleOverride = (field: string, value: any) => {
    setOverrides(prev => ({
      ...prev,
      [field]: value
    }));
    setEditingField(null);
  };

  const getBudgetLabel = (type?: string) => {
    switch (type) {
      case 'shoestring': return 'Shoestring';
      case 'mid_range': return 'Mid-range';
      case 'luxury': return 'Luxury';
      case 'ultra_luxury': return 'Ultra-luxury';
      default: return 'Mid-range';
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-purple-600 animate-pulse" />
          <span className="text-sm text-gray-600">Loading preferences...</span>
        </div>
      </div>
    );
  }

  // Don't show anything if no user
  if (!user) {
    return null;
  }

  // Show message if no preferences
  if (!preferences) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-gray-600">
          <Settings className="w-4 h-4" />
          <span className="text-sm">No saved preferences found. Set your preferences in your profile to use them here.</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Use My Preferences</h3>
          </div>
          <button
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              usePreferences ? 'bg-purple-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                usePreferences ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {usePreferences && (
          <div className="space-y-2 text-sm">
            {/* Budget */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Budget:</span>
                {overrides.budget_type && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">customized</span>
                )}
              </div>
              {editingField === 'budget' ? (
                <div className="flex items-center gap-2">
                  <select
                    value={overrides.budget_type || preferences.budget_type || 'mid_range'}
                    onChange={(e) => handleOverride('budget_type', e.target.value)}
                    className="px-2 py-1 border rounded text-sm"
                  >
                    <option value="shoestring">Shoestring</option>
                    <option value="mid_range">Mid-range</option>
                    <option value="luxury">Luxury</option>
                    <option value="ultra_luxury">Ultra-luxury</option>
                  </select>
                  <button
                    onClick={() => setEditingField(null)}
                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-gray-900">
                    {getBudgetLabel(overrides.budget_type || preferences.budget_type)}
                    {' '}
                    (${overrides.budget || preferences.budget || 200}/day)
                  </span>
                  <button
                    onClick={() => setEditingField('budget')}
                    className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Dietary Restrictions */}
            {preferences.dietary_restrictions && preferences.dietary_restrictions.length > 0 && (
              <div className="flex items-center justify-between py-1">
                <span className="text-gray-600">Dietary:</span>
                {editingField === 'dietary' ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={(overrides.dietary_restrictions || preferences.dietary_restrictions).join(', ')}
                      onChange={(e) => handleOverride('dietary_restrictions', e.target.value.split(',').map(s => s.trim()))}
                      className="px-2 py-1 border rounded text-sm w-32"
                    />
                    <button
                      onClick={() => setEditingField(null)}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900">
                      {(overrides.dietary_restrictions || preferences.dietary_restrictions).join(', ')}
                    </span>
                    <button
                      onClick={() => setEditingField('dietary')}
                      className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Accommodation Style */}
            {preferences.accommodation_style && preferences.accommodation_style.length > 0 && (
              <div className="flex items-center justify-between py-1">
                <span className="text-gray-600">Accommodation:</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-900">
                    {preferences.accommodation_style
                      .filter((item: any) => typeof item === 'string' || item.style)
                      .map((item: any) => typeof item === 'string' ? item : item.style)
                      .join(', ')}
                  </span>
                </div>
              </div>
            )}

            {/* Accessibility */}
            {preferences.accessibility_needs && (
              <div className="flex items-center justify-between py-1">
                <span className="text-gray-600">Accessibility:</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-900">{preferences.accessibility_needs}</span>
                </div>
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 italic">
                Preferences will be applied to trip recommendations. You can edit individual fields inline.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}