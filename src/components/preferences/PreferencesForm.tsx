import { useState } from 'react';

interface PreferencesFormProps {
  preferences: any;
  onSave: (preferences: any) => void;
  loading?: boolean;
}

export function PreferencesForm({ preferences, onSave, loading = false }: PreferencesFormProps) {
  const [formData, setFormData] = useState({
    travel_pace: preferences?.travel_pace || 'moderate',
    budget_min: preferences?.budget_range?.min || 50,
    budget_max: preferences?.budget_range?.max || 200,
    accommodation_type: preferences?.accommodation_type || [],
    dietary_restrictions: preferences?.dietary_restrictions || [],
    trip_style: preferences?.trip_style || [],
    weather_preference: preferences?.weather_preference || 'moderate'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const preferencesToSave = {
      travel_pace: formData.travel_pace,
      budget_range: {
        min: formData.budget_min,
        max: formData.budget_max
      },
      accommodation_type: formData.accommodation_type,
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

        {/* Budget Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Daily Budget Range (USD)
          </label>
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="number"
                value={formData.budget_min}
                onChange={(e) => setFormData({ ...formData, budget_min: Number(e.target.value) })}
                placeholder="Min"
                min="0"
                max="3000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-xs text-gray-500 mt-1">Min: $0</span>
            </div>
            <div className="flex-1">
              <input
                type="number"
                value={formData.budget_max}
                onChange={(e) => setFormData({ ...formData, budget_max: Number(e.target.value) })}
                placeholder="Max"
                min="0"
                max="3000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-xs text-gray-500 mt-1">Max: $3,000</span>
            </div>
          </div>
          <div className="mt-2">
            <input
              type="range"
              min="0"
              max="3000"
              value={formData.budget_max}
              onChange={(e) => setFormData({ ...formData, budget_max: Number(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>$0</span>
              <span>$750</span>
              <span>$1,500</span>
              <span>$2,250</span>
              <span>$3,000</span>
            </div>
          </div>
        </div>

        {/* Accommodation Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Accommodation Preferences
          </label>
          <div className="space-y-2">
            {['hotel', 'airbnb', 'hostel', 'resort'].map(type => (
              <label key={type} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.accommodation_type.includes(type)}
                  onChange={() => toggleArrayValue('accommodation_type', type)}
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