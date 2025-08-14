import { supabase } from '../lib/supabase'
import type { Trip, Place } from '../lib/supabase'

export const supabaseTrips = {
  // Get all trips for current user
  async getUserTrips(): Promise<{ data?: Trip[]; error?: any }> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        return { error: { message: 'User not authenticated' } }
      }

      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        return { error }
      }

      return { data }
    } catch (error) {
      return { error }
    }
  },

  // Get single trip by ID
  async getTrip(tripId: string): Promise<{ data?: Trip; error?: any }> {
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single()

      if (error) {
        return { error }
      }

      return { data }
    } catch (error) {
      return { error }
    }
  },

  // Create new trip
  async createTrip(trip: Omit<Trip, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<{ data?: Trip; error?: any }> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        return { error: { message: 'User not authenticated' } }
      }

      const { data, error } = await supabase
        .from('trips')
        .insert({
          ...trip,
          user_id: user.id
        })
        .select()
        .single()

      if (error) {
        return { error }
      }

      return { data }
    } catch (error) {
      return { error }
    }
  },

  // Update trip
  async updateTrip(tripId: string, updates: Partial<Omit<Trip, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<{ data?: Trip; error?: any }> {
    try {
      const { data, error } = await supabase
        .from('trips')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', tripId)
        .select()
        .single()

      if (error) {
        return { error }
      }

      return { data }
    } catch (error) {
      return { error }
    }
  },

  // Delete trip
  async deleteTrip(tripId: string): Promise<{ error?: any }> {
    try {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', tripId)

      if (error) {
        return { error }
      }

      return {}
    } catch (error) {
      return { error }
    }
  },

  // Get places for a trip
  async getTripPlaces(tripId: string): Promise<{ data?: Place[]; error?: any }> {
    try {
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .eq('trip_id', tripId)
        .order('day', { ascending: true })
        .order('order', { ascending: true })

      if (error) {
        return { error }
      }

      return { data }
    } catch (error) {
      return { error }
    }
  },

  // Add place to trip
  async addPlace(place: Omit<Place, 'id' | 'created_at' | 'updated_at'>): Promise<{ data?: Place; error?: any }> {
    try {
      const { data, error } = await supabase
        .from('places')
        .insert(place)
        .select()
        .single()

      if (error) {
        return { error }
      }

      return { data }
    } catch (error) {
      return { error }
    }
  },

  // Update place
  async updatePlace(placeId: string, updates: Partial<Omit<Place, 'id' | 'trip_id' | 'created_at' | 'updated_at'>>): Promise<{ data?: Place; error?: any }> {
    try {
      const { data, error } = await supabase
        .from('places')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', placeId)
        .select()
        .single()

      if (error) {
        return { error }
      }

      return { data }
    } catch (error) {
      return { error }
    }
  },

  // Delete place
  async deletePlace(placeId: string): Promise<{ error?: any }> {
    try {
      const { error } = await supabase
        .from('places')
        .delete()
        .eq('id', placeId)

      if (error) {
        return { error }
      }

      return {}
    } catch (error) {
      return { error }
    }
  },

  // Reorder places within a day
  async reorderPlaces(tripId: string, day: number, placeIds: string[]): Promise<{ error?: any }> {
    try {
      const updates = placeIds.map((id, index) => ({
        id,
        order: index
      }))

      // Update each place's order
      for (const update of updates) {
        const { error } = await supabase
          .from('places')
          .update({ order: update.order })
          .eq('id', update.id)
          .eq('trip_id', tripId)
          .eq('day', day)

        if (error) {
          return { error }
        }
      }

      return {}
    } catch (error) {
      return { error }
    }
  },

  // Move place to different day
  async movePlace(placeId: string, newDay: number, newOrder: number): Promise<{ error?: any }> {
    try {
      const { error } = await supabase
        .from('places')
        .update({ 
          day: newDay, 
          order: newOrder,
          updated_at: new Date().toISOString()
        })
        .eq('id', placeId)

      if (error) {
        return { error }
      }

      return {}
    } catch (error) {
      return { error }
    }
  }
}