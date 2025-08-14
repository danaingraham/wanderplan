import { supabase } from '../lib/supabase'
import { storage } from './storage'
import { supabaseAuth } from '../services/supabaseAuth'
import { supabaseTrips } from '../services/supabaseTrips'

export interface MigrationResult {
  success: boolean
  message: string
  details?: {
    usersFound?: number
    usersMigrated?: number
    tripsFound?: number
    tripsMigrated?: number
    errors?: string[]
  }
}

export const migrationHelper = {
  // Check if user has local data that needs migration
  hasLocalData(): boolean {
    const users = storage.get('wanderplan_users') || []
    const trips = storage.get('wanderplan_trips') || []
    return users.length > 0 || trips.length > 0
  },

  // Get local user by email
  getLocalUser(email: string): any {
    const users = storage.get('wanderplan_users') || []
    return users.find((u: any) => u.email.toLowerCase() === email.toLowerCase())
  },

  // Get local trips for a user
  getLocalTrips(userId: string): any[] {
    const trips = storage.get('wanderplan_trips') || []
    return trips.filter((t: any) => t.userId === userId)
  },

  // Migrate a single user's data to Supabase
  async migrateUser(email: string, password: string): Promise<MigrationResult> {
    try {
      const errors: string[] = []
      
      // Find local user
      const localUser = this.getLocalUser(email)
      if (!localUser) {
        return {
          success: false,
          message: 'No local user found with this email',
        }
      }

      // Try to sign in first (user might already exist in Supabase)
      let { data: signInData, error: signInError } = await supabaseAuth.signIn(email, password)
      
      // If sign in fails, try to create account
      if (signInError) {
        const { data: signUpData, error: signUpError } = await supabaseAuth.signUp(
          email, 
          password,
          localUser.name || localUser.username
        )
        
        if (signUpError) {
          return {
            success: false,
            message: `Failed to create Supabase account: ${signUpError.message}`,
          }
        }

        // Sign in after creating account
        const { error: newSignInError } = await supabaseAuth.signIn(email, password)
        if (newSignInError) {
          errors.push(`Account created but couldn't sign in: ${newSignInError.message}`)
        }
      }

      // Get local trips
      const localTrips = this.getLocalTrips(localUser.id)
      let tripsMigrated = 0

      // Migrate each trip
      for (const localTrip of localTrips) {
        try {
          // Convert local trip format to Supabase format
          const tripData = {
            title: localTrip.title || `Trip to ${localTrip.destination}`,
            destination: localTrip.destination,
            start_date: localTrip.startDate,
            end_date: localTrip.endDate,
            itinerary: localTrip.itinerary || [],
            preferences: localTrip.preferences || {}
          }

          const { data: newTrip, error: tripError } = await supabaseTrips.createTrip(tripData)
          
          if (tripError) {
            errors.push(`Failed to migrate trip "${tripData.title}": ${tripError.message}`)
          } else if (newTrip && localTrip.itinerary) {
            // Migrate places/itinerary items
            for (const day of localTrip.itinerary) {
              if (day.places) {
                for (let i = 0; i < day.places.length; i++) {
                  const place = day.places[i]
                  await supabaseTrips.addPlace({
                    trip_id: newTrip.id,
                    name: place.name,
                    address: place.address,
                    location: place.location,
                    day: day.day || 1,
                    order: i,
                    time: place.time,
                    duration: place.duration,
                    notes: place.notes,
                    photos: place.photos,
                    rating: place.rating,
                    price_level: place.priceLevel
                  })
                }
              }
            }
            tripsMigrated++
          }
        } catch (error: any) {
          errors.push(`Trip migration error: ${error.message}`)
        }
      }

      return {
        success: true,
        message: 'Migration completed',
        details: {
          usersFound: 1,
          usersMigrated: 1,
          tripsFound: localTrips.length,
          tripsMigrated,
          errors: errors.length > 0 ? errors : undefined
        }
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Migration failed: ${error.message}`,
      }
    }
  },

  // Clear local storage after successful migration
  clearLocalData(): void {
    const keys = Object.keys(localStorage).filter(k => k.includes('wanderplan'))
    keys.forEach(k => localStorage.removeItem(k))
  },

  // Check if currently using Supabase
  async isUsingSupabase(): Promise<boolean> {
    const { data } = await supabaseAuth.getSession()
    return !!data
  }
}