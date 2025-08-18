import { Link } from 'react-router-dom'
import { MapPin, Calendar, Clock, DollarSign, User } from 'lucide-react'
import type { Trip } from '../types'

interface GuideCardProps {
  guide: Trip
}

export function GuideCard({ guide }: GuideCardProps) {
  // Generate gradient fallback if no image
  const gradients = [
    'from-yellow-400 to-orange-500',
    'from-blue-400 to-purple-500',
    'from-green-400 to-teal-500',
    'from-pink-400 to-red-500',
  ]
  const gradientClass = gradients[guide.id.charCodeAt(0) % gradients.length]
  
  // Format date
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'Any time'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }
  
  // Get price symbol
  const getPriceSymbol = (budget?: string) => {
    switch(budget) {
      case 'budget': return '$'
      case 'medium': return '$$'
      case 'luxury': return '$$$'
      default: return '$$'
    }
  }
  
  // Calculate duration
  const getDuration = () => {
    if (!guide.start_date || !guide.end_date) return null
    const start = new Date(guide.start_date)
    const end = new Date(guide.end_date)
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    return days > 0 ? `${days} days` : null
  }

  return (
    <Link 
      to={`/trip/${guide.id}`}
      className="card block overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500"
    >
      {/* Image Section */}
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        {guide.cover_image ? (
          <img 
            src={guide.cover_image} 
            alt={guide.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradientClass}`} />
        )}
        
        {/* Location Badge */}
        <div 
          className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-white shadow-lg bg-accent-500"
        >
          <MapPin className="w-3 h-3" />
          {guide.destination || 'Unknown'}
        </div>
      </div>
      
      {/* Content Section */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-lg font-semibold line-clamp-2 text-gray-900 group-hover:text-primary-600 transition-colors">
          {guide.title}
        </h3>
        
        {/* Author Row - using created_by for now */}
        <div className="flex items-center gap-2 mt-2">
          <div className="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center">
            <User className="w-3 h-3 text-zinc-600" />
          </div>
          <span className="text-sm text-zinc-600">Travel Guide</span>
        </div>
        
        {/* Meta Row */}
        <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-zinc-600">
          {formatDate(guide.start_date) && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(guide.start_date)}
            </div>
          )}
          
          {getDuration() && (
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {getDuration()}
            </div>
          )}
          
          {guide.budget && (
            <div className="flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" />
              {getPriceSymbol(guide.budget)}
            </div>
          )}
        </div>
        
        {/* Tags */}
        {guide.preferences && guide.preferences.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {guide.preferences.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="chip text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-500" />
                {tag}
              </span>
            ))}
            {guide.preferences.length > 3 && (
              <span className="text-xs text-zinc-500">
                +{guide.preferences.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}