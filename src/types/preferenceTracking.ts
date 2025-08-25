// Types for tracking preference sources and applications

export type PreferenceSource = 'profile' | 'override' | 'default';

export interface TrackedPreference<T = any> {
  value: T;
  source: PreferenceSource;
  appliedAt?: string; // ISO timestamp
}

export interface PreferenceTracking {
  budget?: TrackedPreference<number>;
  budgetType?: TrackedPreference<string>;
  dietaryRestrictions?: TrackedPreference<string[]>;
  accommodationStyle?: TrackedPreference<string[]>;
  accessibilityNeeds?: TrackedPreference<string>;
  travelPace?: TrackedPreference<string>;
  cuisinePreferences?: TrackedPreference<string[]>;
}

export interface TripPreferenceMetadata {
  totalPreferencesApplied: number;
  profilePreferences: number;
  overriddenPreferences: number;
  defaultPreferences: number;
  tracking: PreferenceTracking;
}

// Helper to create a tracked preference
export function trackPreference<T>(
  value: T, 
  source: PreferenceSource
): TrackedPreference<T> {
  return {
    value,
    source,
    appliedAt: new Date().toISOString()
  };
}

// Helper to get preference summary
export function getPreferenceSummary(metadata: TripPreferenceMetadata): string {
  const parts: string[] = [];
  
  if (metadata.profilePreferences > 0) {
    parts.push(`${metadata.profilePreferences} from profile`);
  }
  
  if (metadata.overriddenPreferences > 0) {
    parts.push(`${metadata.overriddenPreferences} customized`);
  }
  
  if (metadata.defaultPreferences > 0) {
    parts.push(`${metadata.defaultPreferences} defaults`);
  }
  
  return parts.join(', ');
}