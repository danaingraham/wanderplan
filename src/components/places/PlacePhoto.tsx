import { useState, useEffect } from 'react'
import { googlePlacesService } from '../../services/googlePlaces'

interface PlacePhotoProps {
  placeId?: string
  photoUrl?: string
  placeName: string
  className?: string
}

export function PlacePhoto({ placeId, photoUrl, placeName, className = '' }: PlacePhotoProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    const loadPhoto = async () => {
      // If we have a direct photo URL that starts with http, use it
      if (photoUrl && (photoUrl.startsWith('http://') || photoUrl.startsWith('https://'))) {
        setImageUrl(photoUrl)
        return
      }

      // If we have a place ID, fetch fresh photo from Google
      if (placeId) {
        setLoading(true)
        setError(false)
        try {
          const details = await googlePlacesService.getPlaceDetails(placeId)
          if (details.photos && details.photos.length > 0) {
            // Get the first photo URL
            const freshPhotoUrl = details.photos[0].photo_reference
            setImageUrl(freshPhotoUrl)
          } else {
            setError(true)
          }
        } catch (err) {
          console.error('Failed to load photo for place:', placeName, err)
          setError(true)
        } finally {
          setLoading(false)
        }
      } else {
        // No photo available
        setError(true)
      }
    }

    loadPhoto()
  }, [placeId, photoUrl, placeName])

  if (loading) {
    return (
      <div className={`bg-gray-200 animate-pulse ${className}`}>
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
    )
  }

  if (error || !imageUrl) {
    return (
      <div className={`bg-gray-100 ${className}`}>
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
    )
  }

  return (
    <img
      src={imageUrl}
      alt={placeName}
      className={className}
      loading="lazy"
      onError={() => {
        console.error('Image failed to load:', imageUrl)
        setError(true)
      }}
    />
  )
}