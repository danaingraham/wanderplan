import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { Trip, Place, DraftTrip } from '../types'
import { storage, STORAGE_KEYS } from '../utils/storage'
import { useUser } from './UserContext'

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
  deletePlace: (id: string) => void
  getPlacesByTrip: (tripId: string) => Place[]
  getPlacesByDay: (tripId: string, day: number) => Place[]
  
  saveDraftTrip: (draft: Omit<DraftTrip, 'id' | 'last_updated' | 'created_by'>) => string
  updateDraftTrip: (id: string, updates: Partial<DraftTrip>) => void
  deleteDraftTrip: (id: string) => void
  getDraftTrip: (id: string) => DraftTrip | undefined
  
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
    setLoading(true)
    try {
      const savedTrips = storage.get<Trip[]>(STORAGE_KEYS.TRIPS) || []
      const savedPlaces = storage.get<Place[]>(STORAGE_KEYS.PLACES) || []
      const savedDraftTrips = storage.get<DraftTrip[]>(STORAGE_KEYS.DRAFT_TRIPS) || []
      
      setTrips(savedTrips)
      setPlaces(savedPlaces)
      setDraftTrips(savedDraftTrips)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const createTrip = (tripData: Omit<Trip, 'id' | 'created_by' | 'created_date' | 'updated_date'>): string => {
    if (!user) throw new Error('User must be logged in to create trips')
    
    const trip: Trip = {
      ...tripData,
      id: generateId(),
      created_by: user.id,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    }
    
    const updatedTrips = [...trips, trip]
    setTrips(updatedTrips)
    storage.set(STORAGE_KEYS.TRIPS, updatedTrips)
    
    return trip.id
  }

  const updateTrip = (id: string, updates: Partial<Trip>) => {
    const updatedTrips = trips.map(trip =>
      trip.id === id
        ? { ...trip, ...updates, updated_date: new Date().toISOString() }
        : trip
    )
    setTrips(updatedTrips)
    storage.set(STORAGE_KEYS.TRIPS, updatedTrips)
  }

  const deleteTrip = (id: string) => {
    const updatedTrips = trips.filter(trip => trip.id !== id)
    const updatedPlaces = places.filter(place => place.trip_id !== id)
    
    setTrips(updatedTrips)
    setPlaces(updatedPlaces)
    storage.set(STORAGE_KEYS.TRIPS, updatedTrips)
    storage.set(STORAGE_KEYS.PLACES, updatedPlaces)
  }

  const getTrip = (id: string): Trip | undefined => {
    return trips.find(trip => trip.id === id)
  }

  const createPlace = (placeData: Omit<Place, 'id' | 'created_date' | 'updated_date'>): string => {
    const place: Place = {
      ...placeData,
      id: generateId(),
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    }
    
    const updatedPlaces = [...places, place]
    setPlaces(updatedPlaces)
    storage.set(STORAGE_KEYS.PLACES, updatedPlaces)
    
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

  const deletePlace = (id: string) => {
    const updatedPlaces = places.filter(place => place.id !== id)
    setPlaces(updatedPlaces)
    storage.set(STORAGE_KEYS.PLACES, updatedPlaces)
  }

  const getPlacesByTrip = (tripId: string): Place[] => {
    return places
      .filter(place => place.trip_id === tripId)
      .sort((a, b) => {
        if (a.day !== b.day) return a.day - b.day
        return a.order - b.order
      })
  }

  const getPlacesByDay = (tripId: string, day: number): Place[] => {
    return places
      .filter(place => place.trip_id === tripId && place.day === day)
      .sort((a, b) => a.order - b.order)
  }

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
    deletePlace,
    getPlacesByTrip,
    getPlacesByDay,
    saveDraftTrip,
    updateDraftTrip,
    deleteDraftTrip,
    getDraftTrip,
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