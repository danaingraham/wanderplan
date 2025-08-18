import { useState, useEffect } from 'react'
import { useTrips } from '../contexts/TripContext'
import { useUser } from '../contexts/UserContext'
import type { Guide } from '../components/GuideCard'

export function useMyGuides(): { data?: Guide[]; isLoading: boolean; error?: Error; refetch?: () => void } {
  const { trips, loading } = useTrips()
  const { user } = useUser()
  const [data, setData] = useState<Guide[]>()
  const [error, setError] = useState<Error>()

  useEffect(() => {
    if (loading) return
    
    try {
      // Filter for guides created by the current user
      const myGuides = trips
        .filter(trip => trip.is_guide && trip.created_by === user?.id)
        .map(trip => ({
          id: trip.id,
          title: trip.title || 'Untitled Guide',
          coverImageUrl: trip.cover_image,
          destination: trip.destination,
          updatedAt: trip.updated_date || new Date().toISOString(),
          author: {
            id: user?.id || 'unknown',
            name: user?.full_name || 'Unknown Author',
            avatarUrl: user?.profile_picture_url || user?.profile_picture
          },
          isMine: true,
          isSaved: false
        }))
      
      setData(myGuides)
    } catch (err) {
      setError(err as Error)
    }
  }, [trips, loading, user])

  return { 
    data, 
    isLoading: loading, 
    error,
    refetch: () => {
      // TODO: Implement actual refetch logic
      window.location.reload()
    }
  }
}

export function useSavedGuides(): { data?: Guide[]; isLoading: boolean; error?: Error; refetch?: () => void } {
  const { trips, loading } = useTrips()
  const { user } = useUser()
  const [data, setData] = useState<Guide[]>()
  const [error, setError] = useState<Error>()

  useEffect(() => {
    if (loading) return
    
    try {
      // Get saved guide IDs from localStorage (temporary solution)
      const savedGuideIds = JSON.parse(localStorage.getItem('savedGuides') || '[]')
      
      // Filter for public guides not created by the current user but saved
      const savedGuides = trips
        .filter(trip => 
          trip.is_guide && 
          trip.is_public && 
          trip.created_by !== user?.id &&
          savedGuideIds.includes(trip.id)
        )
        .map(trip => ({
          id: trip.id,
          title: trip.title || 'Untitled Guide',
          coverImageUrl: trip.cover_image,
          destination: trip.destination,
          updatedAt: trip.updated_date || new Date().toISOString(),
          author: {
            id: trip.created_by || 'unknown',
            name: 'Travel Expert', // TODO: Get actual author name
            avatarUrl: undefined
          },
          isMine: false,
          isSaved: true
        }))
      
      setData(savedGuides)
    } catch (err) {
      setError(err as Error)
    }
  }, [trips, loading, user])

  return { 
    data, 
    isLoading: loading, 
    error,
    refetch: () => {
      // TODO: Implement actual refetch logic
      window.location.reload()
    }
  }
}

// Helper functions for managing saved guides
export function toggleSaveGuide(guideId: string, save: boolean) {
  const savedGuides = JSON.parse(localStorage.getItem('savedGuides') || '[]')
  
  if (save) {
    if (!savedGuides.includes(guideId)) {
      savedGuides.push(guideId)
    }
  } else {
    const index = savedGuides.indexOf(guideId)
    if (index > -1) {
      savedGuides.splice(index, 1)
    }
  }
  
  localStorage.setItem('savedGuides', JSON.stringify(savedGuides))
  
  // Track event
  if (typeof window !== 'undefined' && (window as any).track) {
    (window as any).track('guides_toggle_save', { id: guideId, next: save })
  }
}

export function shareGuide(guideId: string) {
  // TODO: Implement share functionality
  console.log('Share guide:', guideId)
  
  // For now, copy link to clipboard
  const url = `${window.location.origin}/trip/${guideId}`
  navigator.clipboard.writeText(url)
  alert('Guide link copied to clipboard!')
  
  // Track event
  if (typeof window !== 'undefined' && (window as any).track) {
    (window as any).track('guides_share', { id: guideId })
  }
}

export function deleteGuide(guideId: string) {
  // TODO: Implement delete functionality
  if (confirm('Are you sure you want to delete this guide?')) {
    console.log('Delete guide:', guideId)
    // This would need to be implemented in TripContext
    window.location.reload()
  }
  
  // Track event
  if (typeof window !== 'undefined' && (window as any).track) {
    (window as any).track('guides_delete', { id: guideId })
  }
}