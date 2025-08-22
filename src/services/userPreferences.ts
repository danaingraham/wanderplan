import { supabase } from '../lib/supabase';
import type { 
  UserPreferences, 
  PreferenceUpdate
} from '../types/preferences';
import { DEFAULT_USER_PREFERENCES } from '../types/preferences';

// Simple in-memory cache for preferences
class PreferenceCache {
  private cache: Map<string, { data: UserPreferences; timestamp: number }> = new Map();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  get(userId: string): UserPreferences | null {
    const cached = this.cache.get(userId);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(userId);
      return null;
    }
    
    return cached.data;
  }

  set(userId: string, data: UserPreferences): void {
    this.cache.set(userId, {
      data,
      timestamp: Date.now()
    });
  }

  invalidate(userId: string): void {
    this.cache.delete(userId);
  }

  clear(): void {
    this.cache.clear();
  }
}

class UserPreferencesService {
  private cache = new PreferenceCache();

  /**
   * Get user preferences with caching
   */
  async getPreferences(userId: string): Promise<UserPreferences | null> {
    // Check cache first
    const cached = this.cache.get(userId);
    if (cached) {
      console.log('🎯 UserPreferences: Cache hit for user', userId);
      return cached;
    }

    try {
      console.log('🔍 UserPreferences: Fetching preferences for user', userId);
      
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No preferences found, return defaults
          console.log('📝 UserPreferences: No preferences found, returning defaults');
          return this.createDefaultPreferences(userId);
        }
        console.error('❌ UserPreferences: Error fetching preferences:', error);
        return null;
      }

      // Transform database JSON to typed preferences
      const preferences = this.transformDatabasePreferences(data);
      
      // Cache the result
      this.cache.set(userId, preferences);
      
      return preferences;
    } catch (error) {
      console.error('❌ UserPreferences: Unexpected error:', error);
      return null;
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(
    userId: string, 
    updates: PreferenceUpdate
  ): Promise<UserPreferences | null> {
    try {
      console.log('✏️ UserPreferences: Updating preferences for user', userId);
      
      // First check if preferences exist
      const existing = await this.getPreferences(userId);
      
      if (!existing) {
        // Create new preferences
        return this.createPreferences(userId, updates);
      }

      // Update existing preferences
      const { data, error } = await supabase
        .from('user_preferences')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ UserPreferences: Error updating preferences:', error);
        return null;
      }

      const preferences = this.transformDatabasePreferences(data);
      
      // Invalidate cache
      this.cache.invalidate(userId);
      
      return preferences;
    } catch (error) {
      console.error('❌ UserPreferences: Unexpected error:', error);
      return null;
    }
  }

  /**
   * Create new preferences for a user
   */
  async createPreferences(
    userId: string, 
    initialData?: PreferenceUpdate
  ): Promise<UserPreferences | null> {
    try {
      console.log('🆕 UserPreferences: Creating preferences for user', userId);
      
      const { data, error } = await supabase
        .from('user_preferences')
        .insert({
          user_id: userId,
          ...DEFAULT_USER_PREFERENCES,
          ...initialData
        })
        .select()
        .single();

      if (error) {
        console.error('❌ UserPreferences: Error creating preferences:', error);
        return null;
      }

      const preferences = this.transformDatabasePreferences(data);
      
      // Cache the new preferences
      this.cache.set(userId, preferences);
      
      return preferences;
    } catch (error) {
      console.error('❌ UserPreferences: Unexpected error:', error);
      return null;
    }
  }

  /**
   * Delete user preferences (for GDPR compliance)
   */
  async deletePreferences(userId: string): Promise<boolean> {
    try {
      console.log('🗑️ UserPreferences: Deleting preferences for user', userId);
      
      const { error } = await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('❌ UserPreferences: Error deleting preferences:', error);
        return false;
      }

      // Clear from cache
      this.cache.invalidate(userId);
      
      return true;
    } catch (error) {
      console.error('❌ UserPreferences: Unexpected error:', error);
      return false;
    }
  }

  /**
   * Initialize preferences for a new user
   */
  async initializePreferences(userId: string): Promise<UserPreferences | null> {
    // Check if preferences already exist
    const existing = await this.getPreferences(userId);
    if (existing) {
      return existing;
    }

    // Create new preferences with defaults
    return this.createPreferences(userId);
  }

  /**
   * Clear all cached preferences
   */
  clearCache(): void {
    console.log('🧹 UserPreferences: Clearing cache');
    this.cache.clear();
  }

  /**
   * Transform database row to typed preferences
   */
  private transformDatabasePreferences(data: any): UserPreferences {
    return {
      id: data.id,
      user_id: data.user_id,
      budget_range: data.budget_range || DEFAULT_USER_PREFERENCES.budget_range,
      preferred_cuisines: data.preferred_cuisines || [],
      activity_types: data.activity_types || [],
      accommodation_style: data.accommodation_style || [],
      travel_style: data.travel_style || [],
      pace_preference: data.pace_preference,
      avg_trip_duration: data.avg_trip_duration,
      frequent_destinations: data.frequent_destinations || [],
      seasonal_patterns: data.seasonal_patterns || {},
      dietary_restrictions: data.dietary_restrictions || [],
      accessibility_needs: data.accessibility_needs,
      preferred_chains: data.preferred_chains || {},
      avoided_chains: data.avoided_chains || {},
      learning_enabled: data.learning_enabled ?? true,
      data_retention_days: data.data_retention_days ?? 730,
      last_calculated_at: data.last_calculated_at,
      calculation_version: data.calculation_version || 'v1.0',
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  /**
   * Create default preferences object
   */
  private createDefaultPreferences(userId: string): UserPreferences {
    return {
      id: '',
      user_id: userId,
      ...DEFAULT_USER_PREFERENCES,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as UserPreferences;
  }

  /**
   * Merge user preferences with trip request
   */
  mergePreferencesIntoRequest(
    request: any, 
    preferences: UserPreferences | null
  ): any {
    if (!preferences) return request;

    const merged = { ...request };

    // Add dietary restrictions if not already specified
    if (preferences.dietary_restrictions?.length > 0 && !merged.dietary_restrictions) {
      merged.dietary_restrictions = preferences.dietary_restrictions;
    }

    // Add accessibility needs
    if (preferences.accessibility_needs && !merged.accessibility_needs) {
      merged.accessibility_needs = preferences.accessibility_needs;
    }

    // Use preferred pace if not specified
    if (preferences.pace_preference && !merged.pace) {
      merged.pace = preferences.pace_preference;
    }

    // Merge travel style preferences
    if (preferences.travel_style?.length > 0) {
      merged.preferences = [
        ...(merged.preferences || []),
        ...preferences.travel_style.filter(
          (style: string) => !merged.preferences?.includes(style)
        )
      ];
    }

    // Add budget range for context (OpenAI will use this)
    if (preferences.budget_range?.min || preferences.budget_range?.max) {
      merged.budget_context = preferences.budget_range;
    }

    // Add cuisine preferences for food recommendations
    if (preferences.preferred_cuisines?.length > 0) {
      merged.cuisine_preferences = preferences.preferred_cuisines
        .filter(c => c.confidence > 0.5)
        .map(c => c.cuisine);
    }

    console.log('🔀 UserPreferences: Merged preferences into request');
    
    return merged;
  }
}

// Export singleton instance
export const userPreferencesService = new UserPreferencesService();

// Export default preferences for use in components
export { DEFAULT_USER_PREFERENCES } from '../types/preferences';