import { Link } from 'react-router-dom'
import { MapPin, Calendar, Hash } from 'lucide-react'
import { cn } from '../../utils/cn'
import { formatDate } from '../../utils/date'
import { getDestinationImage, getDestinationGradient } from '../../services/destinationImageService'
import { useState, useEffect } from 'react'

interface TripCardProps {
  id: string
  title: string
  destination: string
  startDate?: string
  endDate?: string
  placeCount: number
  duration: number
  status?: 'upcoming' | 'past' | 'today' | 'draft'
  tripType?: string
  size?: 'medium' | 'large'
  className?: string
}

export function TripCard({
  id,
  title,
  destination,
  startDate,
  endDate,
  placeCount,
  duration,
  status,
  tripType,
  size = 'medium',
  className
}: TripCardProps) {
  const [image, setImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const gradient = getDestinationGradient(destination)
  
  // Load destination image
  useEffect(() => {
    const loadImage = async () => {
      try {
        const fetchedImage = await getDestinationImage(destination, 'small')
        if (fetchedImage) {
          setImage(fetchedImage)
        }
      } catch (error) {
        console.log(`Using gradient fallback for ${destination}`)
      }
      setIsLoading(false)
    }
    loadImage()
  }, [destination])

  // Get status badge styles
  const getStatusStyles = () => {
    switch (status) {
      case 'today':
        return 'bg-blue-500 text-white'
      case 'upcoming':
        return 'bg-green-500 text-white'
      case 'past':
        return 'bg-gray-400 text-white'
      case 'draft':
        return 'bg-yellow-500 text-white'
      default:
        return ''
    }
  }

  const sizeClasses = size === 'large' ? 'h-64' : 'h-48'

  return (
    <Link
      to={`/trip/${id}`}
      className={cn(
        "block bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1",
        className
      )}
    >
      {/* Image Section with Overlay Info */}
      <div className={cn("relative", sizeClasses)}>
        {isLoading ? (
          <div className="w-full h-full animate-pulse bg-gray-200" />
        ) : image ? (
          <img
            src={image}
            alt={destination}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className={cn("w-full h-full bg-gradient-to-br", gradient)} />
        )}
        
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        
        {/* Status Badge */}
        {status && (
          <div className="absolute top-3 left-3">
            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold",
              getStatusStyles()
            )}>
              {status === 'today' ? 'Today' : status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
        )}
        
        {/* Title and Destination Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">
            {title}
          </h3>
          <div className="flex items-center text-white/90 text-sm">
            <MapPin className="w-4 h-4 mr-1" />
            <span>{destination}</span>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-4 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4 text-gray-600">
            {startDate && (
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1.5 text-gray-400" />
                <span className="font-medium">{formatDate(startDate, 'MMM d')}</span>
                {endDate && startDate !== endDate && (
                  <span className="text-gray-500"> - {formatDate(endDate, 'MMM d')}</span>
                )}
              </div>
            )}
            
            <div className="flex items-center">
              <Hash className="w-4 h-4 mr-1.5 text-gray-400" />
              <span className="font-medium">{placeCount} places</span>
            </div>

            {duration > 0 && (
              <div className="flex items-center text-gray-500">
                <span>{duration} {duration === 1 ? 'day' : 'days'}</span>
              </div>
            )}
          </div>

          {tripType && (
            <span className="text-xs text-gray-500 capitalize">
              {tripType} trip
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}