import type { UserPreferences, DNAScores, TravelArchetype } from '../types/preferences';

// Archetype definitions with characteristics
export const ARCHETYPE_DEFINITIONS: Record<TravelArchetype, {
  label: string;
  icon: string;
  description: string;
  primaryTraits: string[];
  color: string;
}> = {
  urban_explorer: {
    label: 'Urban Explorer',
    icon: '🏙️',
    description: 'Thrives in bustling cities, discovering hidden gems and local culture',
    primaryTraits: ['culture', 'social', 'culinary'],
    color: 'from-purple-500 to-blue-500'
  },
  beach_lounger: {
    label: 'Beach Lounger',
    icon: '🏖️',
    description: 'Seeks sun, sand, and serenity by the ocean',
    primaryTraits: ['relaxation', 'luxury'],
    color: 'from-cyan-400 to-blue-400'
  },
  culture_seeker: {
    label: 'Culture Seeker',
    icon: '🎭',
    description: 'Immerses in local traditions, history, and arts',
    primaryTraits: ['culture', 'culinary'],
    color: 'from-amber-500 to-orange-500'
  },
  adventure_junkie: {
    label: 'Adventure Junkie',
    icon: '🏔️',
    description: 'Craves adrenaline and outdoor challenges',
    primaryTraits: ['adventure', 'social'],
    color: 'from-green-500 to-emerald-500'
  },
  luxury_traveler: {
    label: 'Luxury Traveler',
    icon: '💎',
    description: 'Enjoys the finest experiences and accommodations',
    primaryTraits: ['luxury', 'relaxation', 'culinary'],
    color: 'from-purple-600 to-pink-600'
  },
  foodie_wanderer: {
    label: 'Foodie Wanderer',
    icon: '🍜',
    description: 'Travels for taste, seeking culinary adventures',
    primaryTraits: ['culinary', 'culture'],
    color: 'from-red-500 to-orange-500'
  },
  social_butterfly: {
    label: 'Social Butterfly',
    icon: '🦋',
    description: 'Connects with people and thrives in group settings',
    primaryTraits: ['social', 'culture'],
    color: 'from-pink-500 to-purple-500'
  },
  nature_lover: {
    label: 'Nature Lover',
    icon: '🌲',
    description: 'Finds peace in natural landscapes and wildlife',
    primaryTraits: ['adventure', 'relaxation'],
    color: 'from-green-600 to-teal-600'
  },
  budget_backpacker: {
    label: 'Budget Backpacker',
    icon: '🎒',
    description: 'Masters the art of exploring on a shoestring budget',
    primaryTraits: ['adventure', 'social'],
    color: 'from-yellow-500 to-green-500'
  },
  digital_nomad: {
    label: 'Digital Nomad',
    icon: '💻',
    description: 'Blends work and travel seamlessly',
    primaryTraits: ['culture', 'social'],
    color: 'from-indigo-500 to-purple-500'
  }
};

// Calculate DNA scores from user preferences
export function calculateDNAScores(preferences: Partial<UserPreferences>): DNAScores {
  const scores: DNAScores = {
    adventure: 0,
    culture: 0,
    luxury: 0,
    social: 0,
    relaxation: 0,
    culinary: 0
  };

  // Adventure score based on activities and pace
  if (preferences.activity_types?.length) {
    const adventureActivities = preferences.activity_types.filter(a => 
      ['hiking', 'sports', 'outdoor', 'extreme'].some(keyword => 
        a.type.toLowerCase().includes(keyword)
      )
    );
    scores.adventure = Math.min(100, adventureActivities.length * 25);
  }
  if (preferences.pace_preference === 'packed') scores.adventure += 30;
  if (preferences.pace_preference === 'moderate') scores.adventure += 15;
  scores.adventure = Math.min(100, scores.adventure);

  // Culture score based on destinations and activities
  if (preferences.activity_types?.length) {
    const culturalActivities = preferences.activity_types.filter(a => 
      ['museum', 'art', 'history', 'tour', 'local'].some(keyword => 
        a.type.toLowerCase().includes(keyword)
      )
    );
    scores.culture = Math.min(100, culturalActivities.length * 20);
  }
  if (preferences.travel_style?.includes('cultural')) scores.culture += 40;
  if (preferences.frequent_destinations?.length) {
    scores.culture += Math.min(30, preferences.frequent_destinations.length * 5);
  }
  scores.culture = Math.min(100, scores.culture);

  // Luxury score based on budget and accommodation
  if (preferences.budget_type === 'luxury') scores.luxury = 70;
  else if (preferences.budget_type === 'ultra_luxury') scores.luxury = 90;
  else if (preferences.budget_type === 'mid_range') scores.luxury = 40;
  else if (preferences.budget_type === 'shoestring') scores.luxury = 10;
  
  if (preferences.accommodation_style?.length) {
    const luxuryAccom = preferences.accommodation_style.find(a => 
      a.style === 'resort' || a.style === 'hotel'
    );
    if (luxuryAccom) scores.luxury += 20;
  }
  scores.luxury = Math.min(100, scores.luxury);

  // Social score based on travel style and group preferences
  if (preferences.travel_style?.includes('group')) scores.social = 60;
  if (preferences.travel_style?.includes('social')) scores.social += 40;
  if (preferences.accommodation_style?.find(a => a.style === 'hostel')) {
    scores.social += 30;
  }
  scores.social = Math.min(100, scores.social || 30); // Default to moderate social

  // Relaxation score based on pace and accommodation
  if (preferences.pace_preference === 'relaxed') scores.relaxation = 80;
  else if (preferences.pace_preference === 'moderate') scores.relaxation = 50;
  else if (preferences.pace_preference === 'packed') scores.relaxation = 20;
  
  if (preferences.accommodation_style?.find(a => a.style === 'resort')) {
    scores.relaxation += 20;
  }
  scores.relaxation = Math.min(100, scores.relaxation || 40);

  // Culinary score based on cuisine preferences and dietary info
  if (preferences.preferred_cuisines?.length) {
    scores.culinary = Math.min(100, 30 + (preferences.preferred_cuisines.length * 15));
  }
  if (preferences.dietary_restrictions?.length) {
    scores.culinary += 20; // Shows food consciousness
  }
  scores.culinary = Math.min(100, scores.culinary || 30);

  return scores;
}

// Determine travel archetype from DNA scores
export function determineArchetype(scores: DNAScores): TravelArchetype {
  const scoreEntries = Object.entries(scores) as [keyof DNAScores, number][];
  const topScores = scoreEntries.sort((a, b) => b[1] - a[1]).slice(0, 2);
  
  // Map score combinations to archetypes
  const [primary, secondary] = topScores.map(s => s[0]);
  
  // Specific combinations
  if (primary === 'adventure' && secondary === 'culture') return 'adventure_junkie';
  if (primary === 'culture' && secondary === 'culinary') return 'culture_seeker';
  if (primary === 'luxury' && secondary === 'relaxation') return 'luxury_traveler';
  if (primary === 'relaxation' && scores.luxury < 40) return 'beach_lounger';
  if (primary === 'culinary') return 'foodie_wanderer';
  if (primary === 'social') return 'social_butterfly';
  if (primary === 'adventure' && scores.luxury < 30) return 'budget_backpacker';
  if (primary === 'culture' && secondary === 'social') return 'urban_explorer';
  if (primary === 'adventure' && secondary === 'relaxation') return 'nature_lover';
  
  // Default based on highest score
  if (scores.luxury > 70) return 'luxury_traveler';
  if (scores.culture > 60) return 'culture_seeker';
  if (scores.adventure > 60) return 'adventure_junkie';
  
  return 'urban_explorer'; // Default
}

// Calculate DNA completeness percentage
export function calculateCompleteness(preferences: Partial<UserPreferences>): number {
  const fields = [
    { value: preferences.budget_type, weight: 15 },
    { value: preferences.accommodation_style?.length, weight: 15 },
    { value: preferences.pace_preference, weight: 10 },
    { value: preferences.preferred_cuisines?.length, weight: 10 },
    { value: preferences.frequent_destinations?.length, weight: 10 },
    { value: preferences.dietary_restrictions?.length, weight: 5 },
    { value: preferences.travel_style?.length, weight: 10 },
    { value: preferences.activity_types?.length, weight: 10 },
    { value: preferences.quiz_completed, weight: 15 }
  ];
  
  const totalWeight = fields.reduce((sum, field) => sum + field.weight, 0);
  const completedWeight = fields.reduce((sum, field) => {
    if (field.value) {
      if (typeof field.value === 'number' && field.value > 0) return sum + field.weight;
      if (typeof field.value === 'boolean' && field.value) return sum + field.weight;
      if (field.value) return sum + field.weight;
    }
    return sum;
  }, 0);
  
  return Math.round((completedWeight / totalWeight) * 100);
}

// Get travel stats from preferences
export function getTravelStats(preferences: Partial<UserPreferences>) {
  const stats = {
    tripsAnalyzed: preferences.total_trips_analyzed || 0,
    destinationsVisited: preferences.frequent_destinations?.length || 0,
    cuisinesTried: preferences.preferred_cuisines?.length || 0,
    preferredBudget: preferences.budget_type ? 
      ARCHETYPE_DEFINITIONS.luxury_traveler.label : 'Not set',
    travelPace: preferences.pace_preference || 'Not set'
  };
  
  return stats;
}

// Generate DNA color gradient based on scores
export function getDNAGradient(scores: DNAScores): string {
  // Find top 2 dimensions
  const sortedScores = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);
  
  const colorMap: Record<string, string> = {
    adventure: 'green',
    culture: 'purple',
    luxury: 'pink',
    social: 'blue',
    relaxation: 'cyan',
    culinary: 'orange'
  };
  
  const color1 = colorMap[sortedScores[0][0]] || 'gray';
  const color2 = colorMap[sortedScores[1][0]] || 'gray';
  
  return `from-${color1}-500 to-${color2}-500`;
}

// Update DNA with new preferences
export function updateDNA(preferences: Partial<UserPreferences>): Partial<UserPreferences> {
  const dna_scores = calculateDNAScores(preferences);
  const travel_archetype = determineArchetype(dna_scores);
  const dna_completeness = calculateCompleteness(preferences);
  
  return {
    ...preferences,
    dna_scores,
    travel_archetype,
    dna_completeness,
    dna_updated_at: new Date().toISOString(),
    dna_created_at: preferences.dna_created_at || new Date().toISOString()
  };
}