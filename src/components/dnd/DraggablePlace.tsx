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
}

// Create environment-aware logging
const log = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args)
  }
}

export const DraggablePlace = React.memo(({ 
  place, 
  children, 
  isOverlay = false,
  className = "" 
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

  log(`🎯 DraggablePlace ${place.name}:`, { 
    id: place.id, 
    isDragging, 
    isOver,
    hasListeners: !!listeners,
    listenersKeys: listeners ? Object.keys(listeners) : [],
    day: place.day,
    order: place.order
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  if (isOverlay) {
    return (
      <div className={`${className} opacity-95 rotate-3 shadow-2xl`}>
        {children}
      </div>
    )
  }

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
      {...attributes}
    >
      <div className="relative group">
        {/* Drag Handle */}
        <button
          {...listeners}
          className="absolute left-1 top-1/2 transform -translate-y-1/2 z-20 cursor-grab active:cursor-grabbing opacity-80 group-hover:opacity-100 transition-opacity duration-200 bg-white rounded p-2 shadow-lg border border-gray-300 hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
          aria-label="Drag to reorder"
          style={{ touchAction: 'none' }}
          type="button"
        >
          <GripVertical className="w-4 h-4 text-gray-500" />
        </button>
        
        {/* Drop Indicator */}
        {isOver && (
          <div className="absolute inset-0 border-2 border-dashed border-primary-400 rounded-xl pointer-events-none" />
        )}
        
        {children}
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if these specific props change
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

  log(`📋 DroppableArea Day ${day}:`, { 
    placeCount: dayPlaces.length, 
    placeIds,
    placeNames: dayPlaces.map(p => p.name)
  })

  return (
    <SortableContext items={placeIds}>
      <div className="space-y-3 min-h-[50px]">
        {children}
      </div>
    </SortableContext>
  )
}, (prevProps, nextProps) => {
  // Only re-render if the places for this day have changed
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