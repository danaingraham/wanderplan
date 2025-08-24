import { useState } from 'react';

interface PreferencesFormProps {
  preferences: any;
  onSave: (preferences: any) => void;
  loading?: boolean;
}

export function PreferencesForm({ preferences, onSave, loading = false }: PreferencesFormProps) {
  // Get accommodation styles (should be simple strings)
  const getAccommodationStyles = () => {
    if (!preferences?.accommodation_style) return [];
    
    // Ensure it's an array
    const styles = Array.isArray(preferences.accommodation_style) 
      ? preferences.accommodation_style 
      : [preferences.accommodation_style];
    
    // Filter to only valid strings
    return styles.filter((item: any) => typeof item === 'string');
  };

  const [formData, setFormData] = useState({
    travel_pace: preferences?.travel_pace || 'moderate',
    budget: preferences?.budget_range?.max || preferences?.budget || 200,
    budget_type: preferences?.budget_type || 'mid_range',
    accommodation_style: getAccommodationStyles(),
    dietary_restrictions: preferences?.dietary_restrictions || [],
    trip_style: preferences?.trip_style || [],
    weather_preference: preferences?.weather_preference || 'moderate'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const preferencesToSave = {
      travel_pace: formData.travel_pace,
      budget_range: {
        min: 0,  // Keep for backward compatibility
        max: formData.budget
      },
      budget: formData.budget,
      budget_type: formData.budget_type,
      // Keep accommodation_style as simple strings since DB column is TEXT[]
      accommodation_style: formData.accommodation_style,
      dietary_restrictions: formData.dietary_restrictions,
      trip_style: formData.trip_style,
      weather_preference: formData.weather_preference
    };

    console.log('PreferencesForm: Submitting preferences:', preferencesToSave);
    onSave(preferencesToSave);
  };

  const toggleArrayValue = (field: string, value: string) => {
    setFormData(prev => {
      const currentArray = prev[field as keyof typeof prev] as string[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(v => v !== value)
        : [...currentArray, value];
      
      return {
        ...prev,
        [field]: newArray
      };
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Edit Travel Preferences</h2>
      
      <div className="space-y-6">
        {/* Travel Pace */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Travel Pace
          </label>
          <select
            value={formData.travel_pace}
            onChange={(e) => setFormData({ ...formData, travel_pace: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="slow">Slow - Plenty of relaxation</option>
            <option value="moderate">Moderate - Balanced activities</option>
            <option value="fast">Fast - Pack in lots of experiences</option>
          </select>
        </div>

        {/* Budget Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Budget Type
          </label>
          <select
            value={formData.budget_type}
            onChange={(e) => setFormData({ ...formData, budget_type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="shoestring">Shoestring (Backpacker)</option>
            <option value="mid_range">Mid-range / Comfort</option>
            <option value="luxury">Luxury</option>
            <option value="ultra_luxury">Ultra-luxury</option>
          </select>
        </div>

        {/* Daily Budget */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Daily Budget (USD per person)
          </label>
          <div className="flex items-center gap-4">
            <input
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
              placeholder="Budget"
              min="0"
              max="5000"
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <span className="text-lg font-semibold text-gray-700">${formData.budget}/day</span>
          </div>
          <div className="mt-3">
            <input
              type="range"
              min="0"
              max="5000"
              step="50"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>$0</span>
              <span>$500</span>
              <span>$1,000</span>
              <span>$2,500</span>
              <span>$5,000</span>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {formData.budget_type === 'shoestring' && '💡 Hostels, street food, public transport, free attractions'}
            {formData.budget_type === 'mid_range' && '💡 3-star hotels, casual dining, mix of paid and free activities'}
            {formData.budget_type === 'luxury' && '💡 4-5 star hotels, fine dining, premium experiences'}
            {formData.budget_type === 'ultra_luxury' && '💡 5-star resorts, Michelin dining, exclusive private tours'}
          </div>
        </div>

        {/* Accommodation Style */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Accommodation Preferences
          </label>
          <div className="space-y-2">
            {['hotel', 'airbnb', 'hostel', 'resort'].map(type => (
              <label key={type} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.accommodation_style.includes(type)}
                  onChange={() => toggleArrayValue('accommodation_style', type)}
                  className="mr-2"
                />
                <span className="capitalize">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Dietary Restrictions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dietary Restrictions
          </label>
          <div className="space-y-2">
            {['vegetarian', 'vegan', 'gluten_free', 'halal', 'kosher'].map(diet => (
              <label key={diet} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.dietary_restrictions.includes(diet)}
                  onChange={() => toggleArrayValue('dietary_restrictions', diet)}
                  className="mr-2"
                />
                <span className="capitalize">{diet.replace('_', ' ')}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Trip Style */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Trip Style
          </label>
          <div className="space-y-2">
            {['solo', 'couple', 'family', 'group'].map(style => (
              <label key={style} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.trip_style.includes(style)}
                  onChange={() => toggleArrayValue('trip_style', style)}
                  className="mr-2"
                />
                <span className="capitalize">{style}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Weather Preference */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Weather Preference
          </label>
          <select
            value={formData.weather_preference}
            onChange={(e) => setFormData({ ...formData, weather_preference: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="cold">Cold</option>
            <option value="moderate">Moderate</option>
            <option value="warm">Warm</option>
            <option value="hot">Hot</option>
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </form>
  );
}