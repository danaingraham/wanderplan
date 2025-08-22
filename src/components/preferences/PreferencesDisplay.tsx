import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../contexts/UserContext';

export function PreferencesDisplay() {
  const { user } = useUser();
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user?.id) {
        console.log('PreferencesDisplay: No user ID available');
        setLoading(false);
        return;
      }

      console.log('PreferencesDisplay: Fetching preferences for user', user.id);
      
      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Query timeout')), 3000);
        });

        const queryPromise = supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single();

        const { data, error: fetchError } = await Promise.race([
          queryPromise,
          timeoutPromise
        ]).catch(err => ({ data: null, error: err })) as any;

        if (fetchError) {
          if (fetchError.message === 'Query timeout') {
            console.log('PreferencesDisplay: Query timed out, checking localStorage');
            // Try localStorage as fallback
            const localKey = `wanderplan_preferences_${user.id}`;
            const localData = localStorage.getItem(localKey);
            if (localData) {
              try {
                setPreferences(JSON.parse(localData));
                console.log('PreferencesDisplay: Loaded from localStorage');
              } catch (e) {
                console.error('Failed to parse localStorage data');
                setPreferences(null);
              }
            } else {
              setPreferences(null);
            }
          } else if (fetchError.code === 'PGRST116') {
            // No preferences found - this is ok
            console.log('PreferencesDisplay: No preferences found for user');
            setPreferences(null);
          } else {
            console.error('PreferencesDisplay: Error fetching preferences:', fetchError);
            setError(fetchError.message);
          }
        } else {
          console.log('PreferencesDisplay: Successfully fetched preferences:', data);
          setPreferences(data);
        }
      } catch (err: any) {
        console.error('PreferencesDisplay: Unexpected error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [user?.id]);

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