import { DragOverlay as DndKitDragOverlay } from '@dnd-kit/core'
import { Clock, MapPin, GripVertical } from 'lucide-react'
import type { Place } from '../../types'
import { useDragDrop } from './DragDropProvider'

// Helper function to calculate end time
function calculateEndTime(startTime: string, duration: number): string {
  const [hours, minutes] = startTime.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes + duration
  const endHours = Math.floor(totalMinutes / 60) % 24
  const endMinutes = totalMinutes % 60
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
}

interface DragPreviewProps {
  place: Place
}

function DragPreview({ place }: DragPreviewProps) {
  const endTime = place.end_time || calculateEndTime(place.start_time || '09:00', place.duration || 90)

  return (
    <div className="bg-white rounded-xl p-4 shadow-2xl border-2 border-primary-300 max-w-sm transform rotate-3">
      <div className="flex gap-3">
        {/* Drag Handle */}
        <div className="flex items-center text-primary-500">
          <GripVertical className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-medium text-gray-900 text-sm pr-2">{place.name}</h4>
          </div>

          <div className="flex items-center text-xs text-gray-600 mb-2 gap-3">
            <div className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {place.start_time || '09:00'} - {endTime}
            </div>
            <span className="text-gray-400">
              ({place.duration || 90} min)
            </span>
          </div>

          {place.address && (
            <p className="text-xs text-gray-600 mb-2 flex items-start">
              <MapPin className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
              <span className="break-words line-clamp-1">{place.address}</span>
            </p>
          )}

          <div className="flex items-center justify-between">
            <span className={`text-xs px-2 py-1 rounded-full capitalize ${
              place.category === 'restaurant' ? 'bg-orange-100 text-orange-800' :
              place.category === 'attraction' ? 'bg-blue-100 text-blue-800' :
              place.category === 'hotel' ? 'bg-purple-100 text-purple-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {place.category}
            </span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              Day {place.day}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function DragOverlay() {
  const { draggedPlace } = useDragDrop()

  return (
    <DndKitDragOverlay>
      {draggedPlace && <DragPreview place={draggedPlace} />}
    </DndKitDragOverlay>
  )
}