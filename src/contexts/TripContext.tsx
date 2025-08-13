import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { Trip, Place, DraftTrip } from '../types'
import { storage, STORAGE_KEYS } from '../utils/storage'
import { useUser } from './UserContext'

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
    log('🔄 TripContext: Refreshing data from storage')
    log('🔄 TripContext: Current user:', user?.id)
    
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
      const userTrips = savedTrips.filter(trip => trip.created_by === user.id)
      const userDrafts = savedDraftTrips.filter(draft => draft.created_by === user.id)
      
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