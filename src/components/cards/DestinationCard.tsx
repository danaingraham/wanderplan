import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Calendar, Clock } from 'lucide-react'
import { getDestinationImage, getDestinationGradient } from '../../services/destinationImageService'
import { cn } from '../../utils/cn'

interface InfoCard {
  type: 'map' | 'places' | 'budget' | 'duration' | 'season' | 'travelers'
  value: string | number
  label?: string
}

interface DestinationCardProps {
  destination: string
  country?: string
  metadata?: string // e.g., "Adventure • 7 days"
  image?: string | null
  infoCards?: InfoCard[]
  matchPercentage?: number
  trending?: 'rising' | 'popular' | 'emerging'
  status?: 'upcoming' | 'past' | 'today' | 'draft'
  onClick?: () => void
  href?: string
  size?: 'small' | 'medium' | 'large'
  className?: string
  themeColor?: string // Custom theme color for the card
}

export function DestinationCard({
  destination,
  country,
  metadata,
  image: providedImage,
  infoCards = [],
  matchPercentage,
  trending,
  status,
  onClick,
  href,
  size = 'medium',
  className,
  themeColor
}: DestinationCardProps) {
  const [image, setImage] = useState<string | null>(providedImage || null)
  const gradient = getDestinationGradient(destination)
  
  // Define size classes
  const sizeClasses = {
    small: 'h-48',
    medium: 'h-56',
    large: 'h-64'
  }
  
  const textSizeClasses = {
    small: 'text-2xl',
    medium: 'text-3xl',
    large: 'text-4xl'
  }

  // Load image if not provided
  useEffect(() => {
    if (!providedImage && destination) {
      const loadImage = async () => {
        try {
          const fetchedImage = await getDestinationImage(
            country ? `${destination}, ${country}` : destination,
            size === 'large' ? 'large' : 'small'
          )
          if (fetchedImage) {
            setImage(fetchedImage)
          }
        } catch (error) {
          console.log(`Using gradient fallback for ${destination}`)
          // Image fetch failed, we'll use gradient fallback
        }
      }
      loadImage()
    }
  }, [destination, country, providedImage, size])

  // Get theme color based on various factors
  const getThemeColor = () => {
    if (themeColor) return themeColor
    
    // Default theme colors based on status or trending
    if (status === 'upcoming') return 'var(--color-forest)'
    if (status === 'today') return 'var(--color-primary)'
    if (status === 'past') return 'var(--color-muted)'
    if (trending === 'rising') return 'var(--color-terracotta)'
    if (trending === 'popular') return 'var(--color-dusty-blue)'
    if (trending === 'emerging') return 'var(--color-sage)'
    
    return 'var(--color-sage)' // Default
  }

  const cardTheme = getThemeColor()

  const cardContent = (
    <>
      {/* Hero Image Section */}
      <div className={cn("relative overflow-hidden", sizeClasses[size])}>
        {image ? (
          <>
            <img
              src={image}
              alt={destination}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </>
        ) : (
          <div className={cn("w-full h-full bg-gradient-to-br", gradient)}>
            <div className="absolute inset-0 bg-black/30" />
          </div>
        )}

        {/* Badges */}
        {matchPercentage && (
          <div className="absolute top-3 right-3">
            <div className="bg-white/90 backdrop-blur-sm text-green-700 px-2 py-1 rounded-full text-sm font-semibold">
              {matchPercentage}% match
            </div>
          </div>
        )}

        {status && (
          <div className="absolute top-3 left-3">
            <div className={cn(
              "px-2 py-1 rounded-full text-sm font-semibold",
              status === 'upcoming' && "bg-green-100 text-green-800",
              status === 'today' && "bg-blue-100 text-blue-800",
              status === 'past' && "bg-gray-100 text-gray-600",
              status === 'draft' && "bg-yellow-100 text-yellow-800"
            )}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </div>
          </div>
        )}

        {/* Destination Text Overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className={cn("font-bold text-white drop-shadow-lg", textSizeClasses[size])}>
            {destination.toUpperCase()}
          </h3>
          {country && (
            <p className="text-white/90 text-sm mt-1">{country}</p>
          )}
          {metadata && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-white/80 text-xs bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                {metadata}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Info Cards Section */}
      {infoCards.length > 0 && (
        <div className="p-4 bg-gray-50">
          <div className="grid grid-cols-3 gap-3">
            {infoCards.slice(0, 3).map((card, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-3 text-center border border-gray-200"
                style={{ borderColor: `${cardTheme}20` }}
              >
                {card.type === 'map' && (
                  <div className="flex flex-col items-center">
                    <MapPin className="w-4 h-4 mb-1 text-gray-600" />
                    <span className="text-xs text-gray-500">View Map</span>
                  </div>
                )}
                
                {card.type === 'places' && (
                  <div className="flex flex-col items-center">
                    <span className="text-xl font-bold" style={{ color: cardTheme }}>
                      {card.value}
                    </span>
                    <span className="text-xs text-gray-500">Places</span>
                  </div>
                )}
                
                {card.type === 'budget' && (
                  <div className="flex flex-col items-center">
                    <span className="text-xl font-bold" style={{ color: cardTheme }}>
                      {typeof card.value === 'number' 
                        ? card.value <= 1000 ? '$' 
                        : card.value <= 2000 ? '$$' 
                        : card.value <= 3500 ? '$$$' 
                        : '$$$$'
                        : card.value}
                    </span>
                    <span className="text-xs text-gray-500">Budget</span>
                  </div>
                )}
                
                {card.type === 'duration' && (
                  <div className="flex flex-col items-center">
                    <Clock className="w-4 h-4 mb-1 text-gray-600" />
                    <span className="text-sm font-semibold">{card.value}</span>
                    <span className="text-xs text-gray-500">Days</span>
                  </div>
                )}
                
                {card.type === 'season' && (
                  <div className="flex flex-col items-center">
                    <Calendar className="w-4 h-4 mb-1 text-gray-600" />
                    <span className="text-sm font-semibold">{card.value}</span>
                    <span className="text-xs text-gray-500">Best Time</span>
                  </div>
                )}
                
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )

  if (href) {
    return (
      <Link
        to={href}
        className={cn(
          "block bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1",
          className
        )}
        style={{ '--card-theme': cardTheme } as any}
      >
        {cardContent}
      </Link>
    )
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "block bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1",
        className
      )}
      style={{ '--card-theme': cardTheme } as any}
    >
      {cardContent}
    </div>
  )
}