// User Preference Types for Personalization

export interface BudgetRange {
  min: number | null;
  max: number | null;
  typical?: number;
  currency: string;
  confidence: number; // 0-1 confidence score
}

export interface CuisinePreference {
  cuisine: string;
  confidence: number;
  sample_size: number;
  last_seen?: string; // ISO date string
}

export interface ActivityPreference {
  type: string;
  confidence: number;
  recency_weight: number;
  count: number;
}

export interface AccommodationPreference {
  style: string;
  confidence: number;
  last_seen: string;
  count: number;
}

export interface FrequentDestination {
  city: string;
  country?: string;
  count: number;
  last_visit: string;
}

export interface SeasonalPattern {
  season: 'spring' | 'summer' | 'fall' | 'winter';
  preferences: string[];
  destinations: string[];
}

export interface UserPreferences {
  id: string;
  user_id: string;
  
  // Budget preferences
  budget_range: BudgetRange;  // Keep for backward compatibility
  budget?: number;  // Single daily budget value
  budget_type?: 'shoestring' | 'mid_range' | 'luxury' | 'ultra_luxury';
  
  // Inferred preferences
  preferred_cuisines: CuisinePreference[];
  activity_types: ActivityPreference[];
  accommodation_style: AccommodationPreference[];
  travel_style: string[];
  pace_preference: 'relaxed' | 'moderate' | 'packed' | null;
  
  // Statistics
  avg_trip_duration: number | null;
  frequent_destinations: FrequentDestination[];
  seasonal_patterns: Record<string, SeasonalPattern>;
  
  // Explicit preferences (user-set)
  dietary_restrictions: string[];
  accessibility_needs: string | null;
  preferred_chains: Record<string, string[]>;
  avoided_chains: Record<string, string[]>;
  
  // Privacy settings
  learning_enabled: boolean;
  data_retention_days: number;
  
  // Metadata
  last_calculated_at: string | null;
  calculation_version: string;
  created_at: string;
  updated_at: string;
}

export interface PreferenceUpdate {
  budget_range?: Partial<BudgetRange>;
  budget?: number;
  budget_type?: 'shoestring' | 'mid_range' | 'luxury' | 'ultra_luxury';
  dietary_restrictions?: string[];
  accessibility_needs?: string | null;
  travel_style?: string[];
  pace_preference?: 'relaxed' | 'moderate' | 'packed' | null;
  preferred_chains?: Record<string, string[]>;
  avoided_chains?: Record<string, string[]>;
  learning_enabled?: boolean;
  data_retention_days?: number;
  accommodation_style?: any;  // Can be array of strings or AccommodationPreference[]
  accommodation_type?: any;  // For backward compatibility
}

export interface PreferenceConfidence {
  overall: number;
  budget: number;
  cuisines: number;
  activities: number;
  accommodation: number;
}

// Default preferences for new users
export const DEFAULT_USER_PREFERENCES: Partial<UserPreferences> = {
  budget_range: {
    min: null,
    max: null,
    currency: 'USD',
    confidence: 0
  },
  budget: 200,
  budget_type: 'mid_range',
  preferred_cuisines: [],
  activity_types: [],
  accommodation_style: [],
  travel_style: [],
  pace_preference: null,
  avg_trip_duration: null,
  frequent_destinations: [],
  seasonal_patterns: {},
  dietary_restrictions: [],
  accessibility_needs: null,
  preferred_chains: {},
  avoided_chains: {},
  learning_enabled: true,
  data_retention_days: 730,
  calculation_version: 'v1.0'
};