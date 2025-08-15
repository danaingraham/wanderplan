import React from 'react'
import {
  useSortable,
  SortableContext,
} from '@dnd-kit/sortable'
import {
  CSS,
} from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import type { Place } from '../../types'

interface DraggablePlaceProps {
  place: Place
  children: React.ReactNode
  isOverlay?: boolean
  className?: string
  hideDefaultHandle?: boolean
  renderDragHandle?: (listeners: any, attributes: any) => React.ReactNode
}

export const DraggablePlace = React.memo(({ 
  place, 
  children, 
  isOverlay = false,
  className = "",
  hideDefaultHandle = false,
  renderDragHandle
}: DraggablePlaceProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: place.id,
    data: {
      type: 'place',
      place,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Overlay for dragging
  if (isOverlay) {
    return (
      <div className={`${className} opacity-95 rotate-3 shadow-2xl`}>
        {children}
      </div>
    )
  }

  // Custom drag handle implementation
  if (renderDragHandle) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`
          ${className}
          ${isDragging ? 'opacity-50 z-50' : ''}
          ${isOver ? 'ring-2 ring-primary-400 ring-opacity-50' : ''}
          transition-all duration-200
        `}
        data-sortable-id={place.id}
      >
        <div className="flex">
          {/* Drag handle area */}
          <div 
            className="flex-shrink-0"
          >
            {renderDragHandle(listeners, attributes)}
          </div>
          {/* Content area */}
          <div className="flex-1">
            {children}
          </div>
        </div>
      </div>
    )
  }

  // Default drag handle implementation
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        ${className}
        ${isDragging ? 'opacity-50 z-50' : ''}
        ${isOver ? 'ring-2 ring-primary-400 ring-opacity-50' : ''}
        transition-all duration-200
      `}
      data-sortable-id={place.id}
    >
      <div className="relative group">
        {/* Simple Drag Handle */}
        {!hideDefaultHandle && (
          <div
            className="absolute left-1 top-1/2 transform -translate-y-1/2 z-20"
            {...listeners}
            {...attributes}
            style={{ 
              touchAction: 'none',
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
          >
            <div className="opacity-80 group-hover:opacity-100 transition-opacity duration-200 bg-white rounded p-2 shadow-lg border border-gray-300 hover:border-primary-400">
              <GripVertical className="w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
        )}
        
        {/* Drop Indicator */}
        {isOver && (
          <div className="absolute inset-0 border-2 border-dashed border-primary-400 rounded-xl pointer-events-none" />
        )}
        
        {/* Content area */}
        <div className="pl-10">
          {children}
        </div>
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  return (
    prevProps.place.id === nextProps.place.id &&
    prevProps.place.order === nextProps.place.order &&
    prevProps.place.day === nextProps.place.day &&
    prevProps.place.start_time === nextProps.place.start_time &&
    prevProps.place.end_time === nextProps.place.end_time &&
    prevProps.isOverlay === nextProps.isOverlay &&
    prevProps.className === nextProps.className
  )
})

DraggablePlace.displayName = 'DraggablePlace'

interface DroppableAreaProps {
  children: React.ReactNode
  day: number
  places: Place[]
}

export const DroppableArea = React.memo(({ children, day, places }: DroppableAreaProps) => {
  const dayPlaces = places.filter(p => p.day === day).sort((a, b) => a.order - b.order)
  const placeIds = dayPlaces.map(p => p.id)

  return (
    <SortableContext items={placeIds}>
      <div className="space-y-3 min-h-[50px]">
        {children}
      </div>
    </SortableContext>
  )
}, (prevProps, nextProps) => {
  const prevDayPlaces = prevProps.places.filter(p => p.day === prevProps.day)
  const nextDayPlaces = nextProps.places.filter(p => p.day === nextProps.day)
  
  return (
    prevProps.day === nextProps.day &&
    prevDayPlaces.length === nextDayPlaces.length &&
    prevDayPlaces.every((place, index) => {
      const nextPlace = nextDayPlaces[index]
      return place.id === nextPlace.id && place.order === nextPlace.order
    })
  )
})

DroppableArea.displayName = 'DroppableArea'