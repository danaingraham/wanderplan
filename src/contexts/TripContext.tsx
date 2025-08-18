import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { Trip, Place, DraftTrip } from '../types'
import { storage, STORAGE_KEYS } from '../utils/storage'
import { useUser } from './UserContext'
import { supabaseTrips } from '../services/supabaseTrips'

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  return !!(url && key && url !== '' && key !== '')
}

// Create environment-aware logging
const log = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args)
  }
}

interface TripContextType {
  trips: Trip[]
  places: Place[]
  draftTrips: DraftTrip[]
  loading: boolean
  
  createTrip: (trip: Omit<Trip, 'id' | 'created_by' | 'created_date' | 'updated_date'>) => string
  updateTrip: (id: string, updates: Partial<Trip>) => void
  deleteTrip: (id: string) => void
  getTrip: (id: string) => Trip | undefined
  
  createPlace: (place: Omit<Place, 'id' | 'created_date' | 'updated_date'>) => string
  updatePlace: (id: string, updates: Partial<Place>) => void
  bulkUpdatePlaces: (updates: Array<{ id: string, updates: Partial<Place> }>) => void
  deletePlace: (id: string) => void
  getPlacesByTrip: (tripId: string) => Place[]
  getPlacesByDay: (tripId: string, day: number) => Place[]
  
  saveDraftTrip: (draft: Omit<DraftTrip, 'id' | 'last_updated' | 'created_by'>) => string
  updateDraftTrip: (id: string, updates: Partial<DraftTrip>) => void
  deleteDraftTrip: (id: string) => void
  getDraftTrip: (id: string) => DraftTrip | undefined
  
  // Public trip functions
  getPublicTrips: () => Trip[]
  getPublicTripsByUser: (userId: string) => Trip[]
  
  refreshData: () => void
}

const TripContext = createContext<TripContextType | undefined>(undefined)

export function TripProvider({ children }: { children: ReactNode }) {
  const [trips, setTrips] = useState<Trip[]>([])
  const [places, setPlaces] = useState<Place[]>([])
  const [draftTrips, setDraftTrips] = useState<DraftTrip[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useUser()

  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  useEffect(() => {
    refreshData()
  }, [user])

  const refreshData = () => {
    log('🔄 TripContext: Refreshing data')
    log('🔄 TripContext: Current user:', user?.id)
    log('🔄 TripContext: Supabase configured:', isSupabaseConfigured())
    
    // Don't load data if user isn't ready yet - this prevents data loss
    if (!user) {
      log('🔄 TripContext: No user yet, skipping data load to prevent data loss')
      setTrips([])
      setPlaces([])
      setDraftTrips([])
      setLoading(false)
      return
    }
    
    setLoading(true)
    
    // Try to load from Supabase first if configured
    if (isSupabaseConfigured()) {
      log('🔄 TripContext: Attempting to load from Supabase...')
      
      supabaseTrips.getUserTrips().then(({ data: tripsData, error: tripsError }) => {
        if (tripsError) {
          console.error('Error loading trips from Supabase:', tripsError)
          // Fall back to localStorage
          loadFromLocalStorage()
        } else if (tripsData) {
          log('🔄 TripContext: Loaded trips from Supabase:', tripsData.length)
          
          // Convert Supabase format to our format
          const convertedTrips = tripsData.map(trip => ({
            id: trip.id,
            title: trip.title,
            destination: trip.destination,
            start_date: trip.start_date,
            end_date: trip.end_date,
            created_by: trip.user_id,
            created_date: trip.created_at,
            updated_date: trip.updated_at,
            // Extract from itinerary JSON
            trip_type: (trip.itinerary as any)?.trip_type || 'solo',
            group_size: (trip.itinerary as any)?.group_size || 1,
            has_kids: (trip.itinerary as any)?.has_kids || false,
            pace: (trip.itinerary as any)?.pace || 'moderate',
            preferences: (trip.itinerary as any)?.preferences || [],
            is_guide: (trip.itinerary as any)?.is_guide || false,
            is_public: (trip.itinerary as any)?.is_public || false,
            collaborators: (trip.itinerary as any)?.collaborators || [],
            latitude: (trip.itinerary as any)?.latitude,
            longitude: (trip.itinerary as any)?.longitude,
            budget: (trip.itinerary as any)?.budget,
            cover_image: (trip.itinerary as any)?.cover_image,
            currency: (trip.itinerary as any)?.currency,
            location: (trip.itinerary as any)?.location,
            original_input: (trip.itinerary as any)?.original_input
          } as Trip))
          
          setTrips(convertedTrips)
          
          // Also save to localStorage as cache
          const allTrips = storage.get<Trip[]>(STORAGE_KEYS.TRIPS) || []
          const otherUserTrips = allTrips.filter(t => t.created_by !== user.id)
          storage.set(STORAGE_KEYS.TRIPS, [...otherUserTrips, ...convertedTrips])
          
          // Load places (still from localStorage for now)
          const savedPlaces = storage.get<Place[]>(STORAGE_KEYS.PLACES) || []
          setPlaces(savedPlaces)
          
          // Draft trips are still in localStorage
          const savedDraftTrips = storage.get<DraftTrip[]>(STORAGE_KEYS.DRAFT_TRIPS) || []
          const userDrafts = savedDraftTrips.filter(draft => draft.created_by === user.id)
          setDraftTrips(userDrafts)
          
          setLoading(false)
        } else {
          loadFromLocalStorage()
        }
      }).catch(error => {
        console.error('Error loading from Supabase:', error)
        loadFromLocalStorage()
      })
    } else {
      loadFromLocalStorage()
    }
  }
  
  const loadFromLocalStorage = () => {
    log('🔄 TripContext: Loading from localStorage...')
    try {
      const savedTrips = storage.get<Trip[]>(STORAGE_KEYS.TRIPS) || []
      const savedPlaces = storage.get<Place[]>(STORAGE_KEYS.PLACES) || []
      const savedDraftTrips = storage.get<DraftTrip[]>(STORAGE_KEYS.DRAFT_TRIPS) || []
      
      log('🔄 TripContext: Loaded from storage:', {
        trips: savedTrips.length,
        places: savedPlaces.length,
        drafts: savedDraftTrips.length
      })
      
      // Filter trips by current user
      const userTrips = savedTrips.filter(trip => trip.created_by === user?.id)
      const userDrafts = savedDraftTrips.filter(draft => draft.created_by === user?.id)
      
      log('🔄 TripContext: Filtered for user:', {
        userTrips: userTrips.length,
        userDrafts: userDrafts.length
      })
      
      setTrips(userTrips)
      setPlaces(savedPlaces) // Places are filtered by trip_id when needed
      setDraftTrips(userDrafts)
    } catch (error) {
      log('Error loading data:', error)
      // Don't clear trips on error - keep existing state
    } finally {
      setLoading(false)
    }
  }

  const createTrip = (tripData: Omit<Trip, 'id' | 'created_by' | 'created_date' | 'updated_date'>): string => {
    if (!user) {
      log('❌ TripContext: No user found when creating trip')
      throw new Error('User must be logged in to create trips')
    }
    
    log('🎯 TripContext: Creating trip for user:', user.id)
    log('🎯 TripContext: Trip data:', tripData)
    
    const trip: Trip = {
      ...tripData,
      id: generateId(),
      created_by: user.id,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    }
    
    log('🎯 TripContext: Generated trip:', trip)
    
    // Get all trips from storage (not just user's current trips)
    const allTrips = storage.get<Trip[]>(STORAGE_KEYS.TRIPS) || []
    const updatedAllTrips = [...allTrips, trip]
    
    // Update state with user's trips only
    const updatedUserTrips = [...trips, trip]
    
    log('🎯 TripContext: Saving to storage - total trips:', updatedAllTrips.length)
    log('🎯 TripContext: Current user trips count:', updatedUserTrips.length)
    
    setTrips(updatedUserTrips)
    storage.set(STORAGE_KEYS.TRIPS, updatedAllTrips)
    
    // Async sync to Supabase if configured
    if (isSupabaseConfigured()) {
      log('🔄 TripContext: Syncing trip to Supabase...')
      
      // Prepare data for Supabase
      const supabaseTrip = {
        title: trip.title,
        destination: trip.destination,
        start_date: trip.start_date || '',
        end_date: trip.end_date || '',
        itinerary: {
          trip_type: trip.trip_type,
          group_size: trip.group_size,
          has_kids: trip.has_kids,
          pace: trip.pace,
          preferences: trip.preferences,
          is_guide: trip.is_guide,
          is_public: trip.is_public,
          collaborators: trip.collaborators,
          latitude: trip.latitude,
          longitude: trip.longitude,
          budget: trip.budget,
          cover_image: trip.cover_image,
          currency: trip.currency,
          location: trip.location,
          original_input: trip.original_input
        }
      }
      
      supabaseTrips.createTrip(supabaseTrip).then(({ data, error }) => {
        if (error) {
          console.error('Failed to sync trip to Supabase:', error)
        } else if (data) {
          log('✅ Trip synced to Supabase with ID:', data.id)
          // Update the trip ID to match Supabase ID
          const allTripsUpdated = storage.get<Trip[]>(STORAGE_KEYS.TRIPS) || []
          const updatedWithSupabaseId = allTripsUpdated.map(t => 
            t.id === trip.id ? { ...t, id: data.id } : t
          )
          storage.set(STORAGE_KEYS.TRIPS, updatedWithSupabaseId)
          
          // Update state
          setTrips(prev => prev.map(t => 
            t.id === trip.id ? { ...t, id: data.id } : t
          ))
        }
      }).catch(err => {
        console.error('Error syncing trip to Supabase:', err)
      })
    }
    
    return trip.id
  }

  const updateTrip = (id: string, updates: Partial<Trip>) => {
    // Update in global storage
    const allTrips = storage.get<Trip[]>(STORAGE_KEYS.TRIPS) || []
    const updatedAllTrips = allTrips.map(trip =>
      trip.id === id
        ? { ...trip, ...updates, updated_date: new Date().toISOString() }
        : trip
    )
    storage.set(STORAGE_KEYS.TRIPS, updatedAllTrips)
    
    // Update user trips in state
    const updatedUserTrips = trips.map(trip =>
      trip.id === id
        ? { ...trip, ...updates, updated_date: new Date().toISOString() }
        : trip
    )
    setTrips(updatedUserTrips)
  }

  const deleteTrip = (id: string) => {
    // Update global storage
    const allTrips = storage.get<Trip[]>(STORAGE_KEYS.TRIPS) || []
    const allPlaces = storage.get<Place[]>(STORAGE_KEYS.PLACES) || []
    
    const updatedAllTrips = allTrips.filter(trip => trip.id !== id)
    const updatedAllPlaces = allPlaces.filter(place => place.trip_id !== id)
    
    storage.set(STORAGE_KEYS.TRIPS, updatedAllTrips)
    storage.set(STORAGE_KEYS.PLACES, updatedAllPlaces)
    
    // Update state
    const updatedUserTrips = trips.filter(trip => trip.id !== id)
    const updatedPlaces = places.filter(place => place.trip_id !== id)
    
    setTrips(updatedUserTrips)
    setPlaces(updatedPlaces)
  }

  const getTrip = (id: string): Trip | undefined => {
    return trips.find(trip => trip.id === id)
  }

  const createPlace = (placeData: Omit<Place, 'id' | 'created_date' | 'updated_date'>): string => {
    log('🏪 TripContext: Creating place:', placeData.name, `(Day ${placeData.day}, Order ${placeData.order})`)
    log('🏪 TripContext: Current places array length BEFORE creation:', places.length)
    
    const place: Place = {
      ...placeData,
      id: generateId(),
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    }
    
    log('🏪 TripContext: Generated place ID:', place.id)
    
    // Use functional update to ensure we get the latest state
    setPlaces(currentPlaces => {
      log('🏪 TripContext: Current places in setter:', currentPlaces.length)
      const updatedPlaces = [...currentPlaces, place]
      log('🏪 TripContext: Updated places after adding:', updatedPlaces.length)
      
      // Save to storage with the updated array
      storage.set(STORAGE_KEYS.PLACES, updatedPlaces)
      
      log('🏪 TripContext: Places for trip', placeData.trip_id, ':', updatedPlaces.filter(p => p.trip_id === placeData.trip_id).length)
      
      return updatedPlaces
    })
    
    return place.id
  }

  const updatePlace = (id: string, updates: Partial<Place>) => {
    const updatedPlaces = places.map(place =>
      place.id === id
        ? { ...place, ...updates, updated_date: new Date().toISOString() }
        : place
    )
    setPlaces(updatedPlaces)
    storage.set(STORAGE_KEYS.PLACES, updatedPlaces)
  }

  const bulkUpdatePlaces = (updates: Array<{ id: string, updates: Partial<Place> }>) => {
    if (updates.length === 0) return
    
    log('🔄 TripContext: Bulk updating', updates.length, 'places')
    
    const updateMap = new Map(updates.map(u => [u.id, u.updates]))
    
    const updatedPlaces = places.map(place => {
      const placeUpdates = updateMap.get(place.id)
      return placeUpdates 
        ? { ...place, ...placeUpdates, updated_date: new Date().toISOString() }
        : place
    })
    
    setPlaces(updatedPlaces)
    storage.set(STORAGE_KEYS.PLACES, updatedPlaces)
    
    log('✅ TripContext: Bulk update completed')
  }

  const deletePlace = (id: string) => {
    const updatedPlaces = places.filter(place => place.id !== id)
    setPlaces(updatedPlaces)
    storage.set(STORAGE_KEYS.PLACES, updatedPlaces)
  }

  const getPlacesByTrip = useCallback((tripId: string): Place[] => {
    const tripPlaces = places
      .filter(place => place.trip_id === tripId)
      .sort((a, b) => {
        if (a.day !== b.day) return a.day - b.day
        return a.order - b.order
      })
    
    log('🔍 TripContext: Getting places for trip', tripId)
    log('🔍 TripContext: Total places in context:', places.length)
    log('🔍 TripContext: Places matching trip ID:', tripPlaces.length)
    log('🔍 TripContext: Matched places:', tripPlaces.map(p => `${p.name} (Day ${p.day}, Order ${p.order})`))
    
    return tripPlaces
  }, [places])

  const getPlacesByDay = useCallback((tripId: string, day: number): Place[] => {
    return places
      .filter(place => place.trip_id === tripId && place.day === day)
      .sort((a, b) => a.order - b.order)
  }, [places])

  const saveDraftTrip = useCallback((draftData: Omit<DraftTrip, 'id' | 'last_updated' | 'created_by'>): string => {
    if (!user) throw new Error('User must be logged in to save drafts')
    
    const draft: DraftTrip = {
      ...draftData,
      id: generateId(),
      created_by: user.id,
      last_updated: new Date().toISOString()
    }
    
    const updatedDrafts = [...draftTrips, draft]
    setDraftTrips(updatedDrafts)
    storage.set(STORAGE_KEYS.DRAFT_TRIPS, updatedDrafts)
    
    return draft.id
  }, [user, draftTrips])

  const updateDraftTrip = useCallback((id: string, updates: Partial<DraftTrip>) => {
    const updatedDrafts = draftTrips.map(draft =>
      draft.id === id
        ? { ...draft, ...updates, last_updated: new Date().toISOString() }
        : draft
    )
    setDraftTrips(updatedDrafts)
    storage.set(STORAGE_KEYS.DRAFT_TRIPS, updatedDrafts)
  }, [draftTrips])

  const deleteDraftTrip = (id: string) => {
    const updatedDrafts = draftTrips.filter(draft => draft.id !== id)
    setDraftTrips(updatedDrafts)
    storage.set(STORAGE_KEYS.DRAFT_TRIPS, updatedDrafts)
  }

  const getDraftTrip = (id: string): DraftTrip | undefined => {
    return draftTrips.find(draft => draft.id === id)
  }

  const getPublicTrips = (): Trip[] => {
    // Get all trips from all users that are marked as public
    const allTrips = storage.get<Trip[]>(STORAGE_KEYS.TRIPS) || []
    return allTrips.filter(trip => trip.is_public)
  }

  const getPublicTripsByUser = (userId: string): Trip[] => {
    const allTrips = storage.get<Trip[]>(STORAGE_KEYS.TRIPS) || []
    return allTrips.filter(trip => trip.is_public && trip.created_by === userId)
  }

  const value: TripContextType = {
    trips,
    places,
    draftTrips,
    loading,
    createTrip,
    updateTrip,
    deleteTrip,
    getTrip,
    createPlace,
    updatePlace,
    bulkUpdatePlaces,
    deletePlace,
    getPlacesByTrip,
    getPlacesByDay,
    saveDraftTrip,
    updateDraftTrip,
    deleteDraftTrip,
    getDraftTrip,
    getPublicTrips,
    getPublicTripsByUser,
    refreshData
  }

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>
}

export function useTrips() {
  const context = useContext(TripContext)
  if (context === undefined) {
    throw new Error('useTrips must be used within a TripProvider')
  }
  return context
}