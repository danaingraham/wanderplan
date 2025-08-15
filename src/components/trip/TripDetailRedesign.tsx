import { MapPin, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import type { Place } from '../../types'
import { PlacePhoto } from '../places/PlacePhoto'

// SIMPLIFIED PlaceCard - No edit or expand functionality
interface PlaceCardProps {
  place: Place
}

export function PlaceCard({ place }: PlaceCardProps) {
  // Format time display
  const timeDisplay = place.start_time && place.end_time 
    ? `${place.start_time} - ${place.end_time}`
    : place.start_time || ''
  
  return (
    <div className="group relative bg-white rounded-xl p-4 hover:shadow-md transition-all duration-200 border border-gray-100 overflow-hidden">
      <div className="flex gap-4">
        {/* Photo */}
        <div className="flex-shrink-0">
          <PlacePhoto
            placeId={place.place_id}
            photoUrl={place.photo_url || undefined}
            placeName={place.name}
            className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg"
          />
        </div>
        
        {/* Content - All visible, no expand/collapse */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {/* Title */}
          <h3 className="font-medium text-gray-900 text-base mb-2 break-words">
            {place.name}
          </h3>
          
          {/* Details */}
          <div className="space-y-1 text-sm text-gray-500">
            {timeDisplay && (
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="break-words">{timeDisplay}</span>
              </div>
            )}
            
            {place.address && (
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span className="break-words">{place.address}</span>
              </div>
            )}
          </div>
          
          {/* Full description - always visible */}
          {place.notes && (
            <div className="mt-2">
              <p className="text-sm text-gray-600 break-words whitespace-pre-wrap">
                {place.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// SIMPLIFIED DayCard - No edit functionality
interface DayCardProps {
  dayNumber: number
  date: string
  places: Place[]
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export function DayCard({ 
  dayNumber, 
  date, 
  places, 
  isCollapsed, 
  onToggleCollapse
}: DayCardProps) {
  return (
    <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
      {/* Day Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onToggleCollapse}
          className="flex items-center gap-3 text-left flex-1"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
              {dayNumber}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Day {dayNumber}</h2>
              <p className="text-sm text-gray-500">{date}</p>
            </div>
          </div>
          
          <div className="ml-auto">
            {isCollapsed ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </button>
        
        {/* Quick stats when collapsed */}
        {isCollapsed && places.length > 0 && (
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{places.length} places</span>
          </div>
        )}
      </div>
      
      {/* Places List */}
      {!isCollapsed && (
        <div className="space-y-3">
          {places.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface ToolbarProps {
  onExpandAll: () => void
  onCollapseAll: () => void
  selectedDay: number | undefined
  onDaySelect: (day: number | undefined) => void
  days: number[]
  viewMode: 'itinerary' | 'logistics'
  onViewModeChange: (mode: 'itinerary' | 'logistics') => void
}

export function CompactToolbar({ 
  onExpandAll, 
  onCollapseAll, 
  selectedDay, 
  onDaySelect, 
  days,
  viewMode,
  onViewModeChange
}: ToolbarProps) {
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Day Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onDaySelect(undefined)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedDay === undefined
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All Days
          </button>
          {days.map(day => (
            <button
              key={day}
              onClick={() => onDaySelect(day)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedDay === day
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Day {day}
            </button>
          ))}
          
          <div className="h-6 w-px bg-gray-300 mx-2" />
          
          {/* Expand/Collapse */}
          <button
            onClick={onExpandAll}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Expand All
          </button>
          <button
            onClick={onCollapseAll}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Collapse All
          </button>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onViewModeChange('itinerary')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'itinerary'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Itinerary
          </button>
          <button
            onClick={() => onViewModeChange('logistics')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'logistics'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Logistics
          </button>
        </div>
      </div>
    </div>
  )
}