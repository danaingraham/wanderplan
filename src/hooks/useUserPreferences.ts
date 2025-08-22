import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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
      
      // First check localStorage
      const localKey = `wanderplan_preferences_${user.id}`;
      const localData = localStorage.getItem(localKey);
      
      // Create timeout promise (3 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout')), 3000);
      });

      // Create query promise
      const queryPromise = supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Race them
      const { data, error: fetchError } = await Promise.race([
        queryPromise,
        timeoutPromise
      ]).catch(err => ({ data: null, error: err })) as any;

      if (fetchError) {
        if (fetchError.message === 'Query timeout') {
          console.log('useUserPreferences: Query timed out, using localStorage');
          if (localData) {
            try {
              const parsed = JSON.parse(localData);
              setPreferences(parsed);
              console.log('useUserPreferences: Loaded from localStorage');
            } catch (e) {
              console.error('Failed to parse localStorage data');
              setPreferences(null);
            }
          }
        } else if (fetchError.code === 'PGRST116') {
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
        // Save to localStorage as backup
        localStorage.setItem(localKey, JSON.stringify(data));
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

      // Save to localStorage first as backup
      const localKey = `wanderplan_preferences_${user.id}`;
      localStorage.setItem(localKey, JSON.stringify(dataToSave));
      console.log('useUserPreferences: Saved to localStorage');

      // Try to save to database with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Save timeout')), 3000);
      });

      const savePromise = supabase
        .from('user_preferences')
        .upsert(dataToSave)
        .select()
        .single();

      const { data, error: saveError } = await Promise.race([
        savePromise,
        timeoutPromise
      ]).catch(err => ({ data: null, error: err })) as any;

      if (saveError) {
        if (saveError.message === 'Save timeout') {
          console.log('useUserPreferences: Save timed out, but data is in localStorage');
          // Still update local state since we saved to localStorage
          setPreferences(dataToSave);
        } else {
          console.error('useUserPreferences: Error saving preferences:', saveError);
          setError(saveError);
        }
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