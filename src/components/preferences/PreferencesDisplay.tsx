interface PreferencesDisplayProps {
  preferences?: any;
  loading?: boolean;
  error?: string | null;
}

export function PreferencesDisplay({ preferences, loading = false, error = null }: PreferencesDisplayProps) {

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Travel Preferences</h2>
        <p className="text-gray-500">Loading preferences...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Travel Preferences</h2>
        <p className="text-red-500">Error loading preferences: {error}</p>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Travel Preferences</h2>
        <p className="text-gray-500">No preferences set yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Travel Preferences</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-gray-700">Travel Pace</h3>
          <p className="text-gray-600">{preferences.travel_pace || 'Not set'}</p>
        </div>

        <div>
          <h3 className="font-medium text-gray-700">Budget Range</h3>
          <p className="text-gray-600">
            {preferences.budget_range ? 
              `$${preferences.budget_range.min || 0} - $${preferences.budget_range.max || 0} per day` : 
              'Not set'}
          </p>
        </div>

        <div>
          <h3 className="font-medium text-gray-700">Accommodation Type</h3>
          <p className="text-gray-600">
            {preferences.accommodation_type?.join(', ') || 'Not set'}
          </p>
        </div>

        <div>
          <h3 className="font-medium text-gray-700">Dietary Restrictions</h3>
          <p className="text-gray-600">
            {preferences.dietary_restrictions?.join(', ') || 'None'}
          </p>
        </div>

        <div>
          <h3 className="font-medium text-gray-700">Trip Style</h3>
          <p className="text-gray-600">
            {preferences.trip_style?.join(', ') || 'Not set'}
          </p>
        </div>

        <div>
          <h3 className="font-medium text-gray-700">Last Updated</h3>
          <p className="text-gray-600">
            {preferences.updated_at ? 
              new Date(preferences.updated_at).toLocaleDateString() : 
              'Never'}
          </p>
        </div>
      </div>
    </div>
  );
}