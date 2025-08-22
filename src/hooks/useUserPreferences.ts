import { useState, useEffect } from 'react';
import { supabaseDb } from '../lib/supabaseDb';
import { useUser } from '../contexts/UserContext';

export function useUserPreferences() {
  const { user } = useUser();
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  // Fetch preferences with timeout and localStorage fallback
  const fetchPreferences = async () => {
    if (!user?.id) {
      console.log('useUserPreferences: No user ID available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('useUserPreferences: Fetching preferences for user', user.id);
      
      // Use the working database client
      const { data, error: fetchError } = await supabaseDb
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No preferences found - this is ok
          console.log('useUserPreferences: No preferences found');
          setPreferences(null);
        } else {
          console.error('useUserPreferences: Error fetching preferences:', fetchError);
          setError(fetchError);
        }
      } else {
        console.log('useUserPreferences: Successfully fetched preferences:', data);
        setPreferences(data);
      }
    } catch (err) {
      console.error('useUserPreferences: Unexpected error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Save preferences with localStorage fallback
  const savePreferences = async (newPreferences: any) => {
    if (!user?.id) {
      console.error('useUserPreferences: No user ID for save');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('useUserPreferences: Saving preferences:', newPreferences);
      
      const dataToSave = {
        user_id: user.id,
        ...newPreferences,
        updated_at: new Date().toISOString()
      };

      // Save to database using working client
      const { data, error: saveError } = await supabaseDb
        .from('user_preferences')
        .upsert(dataToSave)
        .select()
        .single();

      if (saveError) {
        console.error('useUserPreferences: Error saving preferences:', saveError);
        setError(saveError);
      } else {
        console.log('useUserPreferences: Successfully saved preferences to database');
        setPreferences(data);
      }
    } catch (err) {
      console.error('useUserPreferences: Unexpected error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Load preferences when user changes
  useEffect(() => {
    if (user?.id) {
      fetchPreferences();
    } else {
      setPreferences(null);
    }
  }, [user?.id]);

  return {
    preferences,
    loading,
    error,
    savePreferences,
    refetch: fetchPreferences
  };
}