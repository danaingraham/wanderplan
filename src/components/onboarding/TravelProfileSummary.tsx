import { useState } from 'react';
import { Edit2, MapPin, DollarSign, Home, Utensils, Activity, Check } from 'lucide-react';
import type { UserPreferences } from '../../types/preferences';

interface TravelProfileSummaryProps {
  preferences: Partial<UserPreferences>;
  onEdit: (preferences: Partial<UserPreferences>) => void;
}

export function TravelProfileSummary({ preferences, onEdit }: TravelProfileSummaryProps) {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editedAccommodation, setEditedAccommodation] = useState<string[]>([]);
  const [editedCuisines, setEditedCuisines] = useState<string>('');
  const [editedPace, setEditedPace] = useState<string>('');
  const [editedDietary, setEditedDietary] = useState<string>('');

  const handleEdit = (field: string, value: any) => {
    onEdit({ ...preferences, [field]: value });
    setIsEditing(null);
  };


  // Budget type display
  const budgetDisplay = {
    shoestring: { label: 'Shoestring', icon: '💵', color: 'text-green-600' },
    mid_range: { label: 'Mid-Range', icon: '💳', color: 'text-blue-600' },
    luxury: { label: 'Luxury', icon: '💎', color: 'text-primary-600' },
    ultra_luxury: { label: 'Ultra Luxury', icon: '👑', color: 'text-yellow-600' }
  };

  const currentBudget = budgetDisplay[preferences.budget_type || 'mid_range'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Your Travel DNA 🧬
        </h3>
        <p className="text-gray-600">
          Here's what we learned about your travel style
        </p>
      </div>

      {/* Profile Cards */}
      <div className="space-y-4">
        {/* Budget Preference */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <DollarSign className={`w-5 h-5 ${currentBudget.color} mr-2`} />
              <div>
                <p className="text-sm font-medium text-gray-700">Travel Budget</p>
                <p className={`text-lg font-bold ${currentBudget.color}`}>
                  {currentBudget.icon} {currentBudget.label}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsEditing('budget')}
              className="text-gray-400 hover:text-gray-600"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
          
          {isEditing === 'budget' && (
            <div className="mt-3 space-y-2">
              {Object.entries(budgetDisplay).map(([key, display]) => (
                <button
                  key={key}
                  onClick={() => handleEdit('budget_type', key)}
                  className={`w-full p-2 rounded-lg border text-left ${
                    preferences.budget_type === key
                      ? 'border-primary-400 bg-primary-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {display.icon} {display.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Accommodation Style */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <Home className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-700">Accommodation</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {(preferences.accommodation_style || []).map((pref) => {
                    const styleStr = typeof pref === 'string' ? pref : pref.style;
                    return (
                      <span 
                        key={styleStr}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                      >
                        {styleStr.charAt(0).toUpperCase() + styleStr.slice(1)}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setIsEditing('accommodation');
                const currentStyles = (preferences.accommodation_style || []).map(pref => 
                  typeof pref === 'string' ? pref : pref.style
                );
                setEditedAccommodation(currentStyles);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
          
          {isEditing === 'accommodation' && (
            <div className="mt-3 space-y-2">
              {['Hotel', 'Airbnb', 'Hostel', 'Resort'].map((style) => {
                const styleLower = style.toLowerCase();
                const isSelected = editedAccommodation.includes(styleLower);
                return (
                  <button
                    key={style}
                    onClick={() => {
                      if (isSelected) {
                        setEditedAccommodation(editedAccommodation.filter(s => s !== styleLower));
                      } else {
                        setEditedAccommodation([...editedAccommodation, styleLower]);
                      }
                    }}
                    className={`w-full p-2 rounded-lg border text-left ${
                      isSelected
                        ? 'border-primary-400 bg-primary-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {style}
                  </button>
                );
              })}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => {
                    const newStyles = editedAccommodation.map(style => ({
                      style,
                      confidence: 0.8,
                      last_seen: new Date().toISOString(),
                      count: 1
                    }));
                    handleEdit('accommodation_style', newStyles);
                  }}
                  className="px-3 py-1 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(null)}
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Top Destinations */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <MapPin className="w-5 h-5 text-red-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-700">Favorite Destinations</p>
                {preferences.frequent_destinations && preferences.frequent_destinations.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {preferences.frequent_destinations.slice(0, 3).map((dest) => {
                      const cityStr = typeof dest === 'string' ? dest : dest.city;
                      return (
                        <span 
                          key={cityStr}
                          className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium"
                        >
                          📍 {cityStr}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">Not set yet</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsEditing('destinations')}
              className="text-gray-400 hover:text-gray-600"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
          
          {isEditing === 'destinations' && (
            <div className="mt-3 p-3 bg-white rounded-lg">
              <input
                type="text"
                placeholder="Enter cities separated by commas (e.g., Paris, Tokyo, New York)"
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                defaultValue={preferences.frequent_destinations?.map(d => 
                  typeof d === 'string' ? d : d.city
                ).join(', ') || ''}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const cities = (e.target as HTMLInputElement).value
                      .split(',')
                      .map(s => s.trim())
                      .filter(Boolean)
                      .map(city => ({
                        city,
                        count: 1,
                        last_visit: new Date().toISOString()
                      }));
                    handleEdit('frequent_destinations', cities);
                  }
                }}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={(e) => {
                    const input = (e.target as HTMLElement).parentElement?.previousElementSibling as HTMLInputElement;
                    const cities = input.value
                      .split(',')
                      .map(s => s.trim())
                      .filter(Boolean)
                      .map(city => ({
                        city,
                        count: 1,
                        last_visit: new Date().toISOString()
                      }));
                    handleEdit('frequent_destinations', cities);
                  }}
                  className="px-3 py-1 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(null)}
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Cuisine Preferences */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <Utensils className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-700">Favorite Cuisines</p>
                {preferences.preferred_cuisines && preferences.preferred_cuisines.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {preferences.preferred_cuisines
                      .sort((a, b) => b.confidence - a.confidence)
                      .slice(0, 3)
                      .map((cuisine) => (
                        <span 
                          key={cuisine.cuisine}
                          className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                        >
                          {cuisine.cuisine}
                        </span>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">Not set yet</p>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                setIsEditing('cuisines');
                setEditedCuisines(preferences.preferred_cuisines?.map(c => c.cuisine).join(', ') || '');
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
          
          {isEditing === 'cuisines' && (
            <div className="mt-3 p-3 bg-white rounded-lg">
              <input
                type="text"
                placeholder="Enter cuisines separated by commas (e.g., Italian, Japanese, Mexican)"
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                value={editedCuisines}
                onChange={(e) => setEditedCuisines(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const cuisines = editedCuisines
                      .split(',')
                      .map(s => s.trim())
                      .filter(Boolean)
                      .map(cuisine => ({
                        cuisine,
                        confidence: 0.8,
                        sample_size: 1
                      }));
                    handleEdit('preferred_cuisines', cuisines);
                  }
                }}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => {
                    const cuisines = editedCuisines
                      .split(',')
                      .map(s => s.trim())
                      .filter(Boolean)
                      .map(cuisine => ({
                        cuisine,
                        confidence: 0.8,
                        sample_size: 1
                      }));
                    handleEdit('preferred_cuisines', cuisines);
                  }}
                  className="px-3 py-1 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(null)}
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Travel Pace */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <Activity className="w-5 h-5 text-orange-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-700">Travel Pace</p>
                <p className="text-lg font-semibold text-gray-900">
                  {preferences.pace_preference === 'relaxed' && '🐢 Slow & Relaxed'}
                  {preferences.pace_preference === 'moderate' && '🚶 Moderate'}
                  {preferences.pace_preference === 'packed' && '🏃 Fast-paced'}
                  {!preferences.pace_preference && <span className="text-sm text-gray-500 font-normal">Not set yet</span>}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsEditing('pace');
                setEditedPace(preferences.pace_preference || 'moderate');
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
          
          {isEditing === 'pace' && (
            <div className="mt-3 space-y-2">
              {[
                { value: 'relaxed', label: '🐢 Slow & Relaxed', desc: 'Plenty of time to explore at leisure' },
                { value: 'moderate', label: '🚶 Moderate', desc: 'Balance of activities and downtime' },
                { value: 'packed', label: '🏃 Fast-paced', desc: 'See as much as possible' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setEditedPace(option.value)}
                  className={`w-full p-3 rounded-lg border text-left ${
                    editedPace === option.value
                      ? 'border-primary-400 bg-primary-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-gray-600 mt-1">{option.desc}</div>
                </button>
              ))}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleEdit('pace_preference', editedPace)}
                  className="px-3 py-1 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(null)}
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Dietary Restrictions */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <Utensils className="w-5 h-5 text-amber-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-700">Dietary Restrictions</p>
                {preferences.dietary_restrictions && preferences.dietary_restrictions.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {preferences.dietary_restrictions.map((restriction) => (
                      <span 
                        key={restriction}
                        className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium"
                      >
                        {restriction}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">None</p>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                setIsEditing('dietary');
                setEditedDietary((preferences.dietary_restrictions || []).join(', '));
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
          
          {isEditing === 'dietary' && (
            <div className="mt-3 p-3 bg-white rounded-lg">
              <input
                type="text"
                placeholder="Enter dietary restrictions separated by commas (e.g., Vegetarian, Gluten-free)"
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                value={editedDietary}
                onChange={(e) => setEditedDietary(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const restrictions = editedDietary
                      .split(',')
                      .map(s => s.trim())
                      .filter(Boolean);
                    handleEdit('dietary_restrictions', restrictions);
                  }
                }}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => {
                    const restrictions = editedDietary
                      .split(',')
                      .map(s => s.trim())
                      .filter(Boolean);
                    handleEdit('dietary_restrictions', restrictions);
                  }}
                  className="px-3 py-1 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(null)}
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Completion Note */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start">
          <Check className="w-5 h-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-green-900 mb-1">
              Profile Ready!
            </p>
            <p className="text-green-700">
              Your preferences will automatically personalize all your future trips. 
              You can always update these in Settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}