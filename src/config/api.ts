// API Configuration
export const API_CONFIG = {
  googleMaps: {
    apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    placesLibrary: import.meta.env.VITE_GOOGLE_PLACES_LIBRARY || 'places',
    placesTypes: (import.meta.env.VITE_GOOGLE_PLACES_TYPES || 'establishment,geocode').split(','),
  },
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini',
    maxTokens: parseInt(import.meta.env.VITE_OPENAI_MAX_TOKENS || '2000'),
  },
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '',
  },
  email: {
    service: import.meta.env.VITE_EMAIL_SERVICE || 'gmail',
    user: import.meta.env.VITE_EMAIL_USER || '',
    pass: import.meta.env.VITE_EMAIL_PASS || '',
    fromName: import.meta.env.VITE_EMAIL_FROM_NAME || 'Wanderplan',
  },
} as const

// Validation
export const validateApiKeys = () => {
  const missing = []
  
  if (!API_CONFIG.googleMaps.apiKey) {
    missing.push('VITE_GOOGLE_MAPS_API_KEY')
  }
  
  if (!API_CONFIG.openai.apiKey) {
    missing.push('VITE_OPENAI_API_KEY')
  }
  
  if (missing.length > 0) {
    console.warn('Missing API keys:', missing.join(', '))
    console.warn('Please add these to your .env file')
  }
  
  return missing.length === 0
}

// Check if APIs are configured
export const isGoogleMapsConfigured = () => !!API_CONFIG.googleMaps.apiKey
export const isOpenAIConfigured = () => !!API_CONFIG.openai.apiKey
export const isGoogleOAuthConfigured = () => !!API_CONFIG.google.clientId
export const isEmailConfigured = () => !!API_CONFIG.email.user && !!API_CONFIG.email.pass