import { useState, useEffect } from 'react';
import { supabaseDb } from '../lib/supabaseDb';
import { useUser } from '../contexts/UserContext';
import { storage, STORAGE_KEYS } from '../utils/storage';

export function useUserPreferences() {
  const { user } = useUser();
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  // Fetch preferences with localStorage first, then database
  const fetchPreferences = async () => {
    if (!user?.id) {
      console.log('useUserPreferences: No user ID available');
      return;
    }

    setLoading(true);
    setError(null);

    // Try to load from localStorage first
    const localKey = `${STORAGE_KEYS.PREFERENCES}_${user.id}`;
    const localPrefs = storage.get<any>(localKey);
    
    if (localPrefs) {
      // Transform to ensure we have accommodation_style
      const transformedPrefs = { ...localPrefs };
      if (localPrefs.accommodation_type && !localPrefs.accommodation_style) {
        transformedPrefs.accommodation_style = localPrefs.accommodation_type;
      }
      console.log('useUserPreferences: Loaded preferences from localStorage:', transformedPrefs);
      setPreferences(transformedPrefs);
      setLoading(false);
      
      // Still fetch from database in background to ensure we have latest
      // but don't show loading state since we have local data
      fetchFromDatabase(false);
    } else {
      // No local data, fetch from database with loading state
      fetchFromDatabase(true);
    }
  };

  const fetchFromDatabase = async (showLoading: boolean) => {
    if (!user?.id) return;

    if (showLoading) {
      setLoading(true);
    }

    try {
      console.log('useUserPreferences: Fetching preferences from database for user', user.id);
      
      // Use the working database client
      const { data, error: fetchError } = await supabaseDb
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No preferences found - this is ok
          console.log('useUserPreferences: No preferences found in database');
          setPreferences(null);
        } else {
          console.error('useUserPreferences: Error fetching preferences:', fetchError);
          setError(fetchError);
        }
      } else {
        console.log('useUserPreferences: Successfully fetched preferences from database:', data);
        // Transform the database response to use accommodation_style
        const transformedData = { ...data };
        if (data.accommodation_type && !data.accommodation_style) {
          transformedData.accommodation_style = data.accommodation_type;
        }
        setPreferences(transformedData);
        
        // Save to localStorage for next time
        const localKey = `${STORAGE_KEYS.PREFERENCES}_${user.id}`;
        storage.set(localKey, transformedData);
        console.log('useUserPreferences: Saved preferences to localStorage');
      }
    } catch (err) {
      console.error('useUserPreferences: Unexpected error:', err);
      setError(err);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Save preferences to both localStorage and database
  const savePreferences = async (newPreferences: any) => {
    if (!user?.id) {
      console.error('useUserPreferences: No user ID for save');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('useUserPreferences: Saving preferences:', newPreferences);
      
      // Transform accommodation_style to accommodation_type for database compatibility
      // This is temporary until we can apply the migration
      const transformedPreferences = { ...newPreferences };
      if (transformedPreferences.accommodation_style) {
        // Ensure it's always an array of strings (not objects)
        let styles = transformedPreferences.accommodation_style;
        if (!Array.isArray(styles)) {
          styles = [styles];
        }
        // Extract just the style strings if we have objects
        styles = styles.map((item: any) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object' && item.style) return item.style;
          return null;
        }).filter(Boolean);
        
        transformedPreferences.accommodation_type = styles;
        delete transformedPreferences.accommodation_style;
      }
      
      const dataToSave = {
        ...(preferences?.id && { id: preferences.id }), // Include ID if updating existing record
        user_id: user.id,
        ...transformedPreferences,
        updated_at: new Date().toISOString()
      };

      // Save to localStorage immediately for instant feedback
      const localKey = `${STORAGE_KEYS.PREFERENCES}_${user.id}`;
      // For localStorage, we want to keep accommodation_style as it's what our UI expects
      const localDataToSave = preferences ? { ...preferences, ...newPreferences } : { ...dataToSave, ...newPreferences };
      // Ensure we have accommodation_style in local storage
      if (newPreferences.accommodation_style) {
        localDataToSave.accommodation_style = newPreferences.accommodation_style;
      }
      storage.set(localKey, localDataToSave);
      console.log('useUserPreferences: Saved preferences to localStorage');
      
      // Update state immediately
      setPreferences(localDataToSave);

      // Save to database using working client
      const { data, error: saveError } = await supabaseDb
        .from('user_preferences')
        .upsert(dataToSave)
        .select()
        .single();

      if (saveError) {
        console.error('useUserPreferences: Error saving to database:', saveError);
        console.log('useUserPreferences: Preferences still saved in localStorage as fallback');
        setError(saveError);
      } else {
        console.log('useUserPreferences: Successfully saved preferences to database');
        // Transform the database response to use accommodation_style
        const transformedData = { ...data };
        if (data.accommodation_type && !data.accommodation_style) {
          transformedData.accommodation_style = data.accommodation_type;
        }
        // Update with the database response (includes id and other fields)
        setPreferences(transformedData);
        // Update localStorage with complete data from database
        storage.set(localKey, transformedData);
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
      // User logged out, clear preferences from state
      setPreferences(null);
      // Note: localStorage cleanup happens in UserContext on logout
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