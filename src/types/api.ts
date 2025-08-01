import type { MockPlaceData, Trip, Place } from './index'

export interface ApiResponse<T> {
  data: T
  message?: string
  error?: string
  success: boolean
}

export interface SearchPlaceRequest {
  query: string
  location?: string
  radius?: number
  type?: string
}

export interface SearchPlaceResponse {
  places: MockPlaceData[]
  total: number
}

export interface GenerateItineraryRequest {
  destination: string
  start_date: string
  end_date: string
  trip_type: string
  group_size: number
  has_kids: boolean
  pace: string
  preferences: string[]
  original_input?: string
}

export interface GenerateItineraryResponse {
  trip: Omit<Trip, 'id' | 'created_by' | 'created_date' | 'updated_date'>
  places: Omit<Place, 'id' | 'trip_id' | 'created_date' | 'updated_date'>[]
  message: string
}

export interface ChatRequest {
  message: string
  trip_id?: string
  context?: string
}

export interface ChatResponse {
  message: string
  suggestions?: string[]
}