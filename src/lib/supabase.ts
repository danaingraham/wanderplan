import { createClient } from '@supabase/supabase-js'

// These will be replaced with your actual Supabase project credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file')
}

// Log what we're initializing with
if (typeof window !== 'undefined') {
  console.log('🔧 Supabase client initialization:', {
    url: supabaseUrl ? 'configured' : 'missing',
    key: supabaseAnonKey ? 'configured' : 'missing',
    keyLength: supabaseAnonKey ? supabaseAnonKey.length : 0,
    keyPrefix: supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'none',
    keySuffix: supabaseAnonKey ? '...' + supabaseAnonKey.substring(supabaseAnonKey.length - 10) : 'none',
    storageKey: 'sb-wanderplan-auth-token'
  })
  
  // Check if the key looks valid
  if (supabaseAnonKey && supabaseAnonKey.length !== 208) {
    console.error('🔴 WARNING: API key length is', supabaseAnonKey.length, 'but should be 208!')
  }
}

// Stable configuration - only enable what doesn't cause hanging
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true, // Keep session persistence
      autoRefreshToken: false, // DISABLE - might be causing hanging
      detectSessionInUrl: false, // Keep disabled - was causing hanging
      storageKey: 'sb-wanderplan-auth-token', // Use different key to avoid conflicts
      storage: typeof window !== 'undefined' ? window.localStorage : undefined
    }
  }
)

// Test the client immediately with a timeout
if (typeof window !== 'undefined' && supabaseUrl && supabaseAnonKey) {
  const testTimeout = setTimeout(() => {
    console.error('🔧 Supabase client test timeout - getSession not responding')
  }, 3000)
  
  supabase.auth.getSession().then(({ data, error }) => {
    clearTimeout(testTimeout)
    if (error) {
      console.error('🔧 Supabase client test failed:', error)
    } else {
      console.log('🔧 Supabase client test successful, session:', !!data.session)
    }
  }).catch(err => {
    clearTimeout(testTimeout)
    console.error('🔧 Supabase client test error:', err)
  })
}

// Database types (will be generated from your Supabase schema)
export interface Profile {
  id: string
  email: string
  username?: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Trip {
  id: string
  user_id: string
  title: string
  destination: string
  start_date: string
  end_date: string
  itinerary: any // JSON data
  preferences?: any
  created_at: string
  updated_at: string
}

export interface Place {
  id: string
  trip_id: string
  name: string
  address?: string
  location?: { lat: number; lng: number }
  day: number
  order: number
  time?: string
  duration?: number
  notes?: string
  photos?: string[]
  rating?: number
  price_level?: number
  created_at: string
  updated_at: string
}