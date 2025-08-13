import React, { createContext, useContext, useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import type { Place } from '../../types'
import type { DragOperation, ScheduleConflict, TimeAdjustment } from './types'
import { recalculateTimesAfterReorder } from '../../utils/timeCalculator'

// Create environment-aware logging
const log = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args)
  }
}

interface DragDropContextType {
  draggedPlace: Place | null
  activeOperation: DragOperation | null
  scheduleConflicts: ScheduleConflict[]
  onPlaceReorder: (operation: DragOperation) => void
  clearConflicts: () => void
}

const DragDropContext = createContext<DragDropContextType | null>(null)

export function useDragDrop() {
  const context = useContext(DragDropContext)
  if (!context) {
    throw new Error('useDragDrop must be used within DragDropProvider')
  }
  return context
}

interface DragDropProviderProps {
  children: React.ReactNode
  places: Place[]
  onUpdatePlace: (id: string, updates: Partial<Place>) => void
  onBulkUpdatePlaces?: (updates: Array<{ id: string; updates: Partial<Place> }>) => void
}

export function DragDropProvider({ 
  children, 
  places, 
  onUpdatePlace,
  onBulkUpdatePlaces 
}: DragDropProviderProps) {
  const [draggedPlace, setDraggedPlace] = useState<Place | null>(null)
  const [activeOperation, setActiveOperation] = useState<DragOperation | null>(null)
  const [scheduleConflicts, setScheduleConflicts] = useState<ScheduleConflict[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Helper function to calculate travel time buffer between places
  const calculateTravelBuffer = (fromPlace: Place, _toPlace: Place): number => {
    // Default buffer times based on place categories
    const categoryBuffers: Record<Place['category'], number> = {
      restaurant: 15, // Getting out of restaurant
      hotel: 30,      // Check-in/out process
      attraction: 10, // Quick transitions
      activity: 20,   // Activity cleanup time
      transport: 5,   // Already in transit
      shop: 15,       // Shopping time
      tip: 5,         // Quick tip
      cafe: 10,       // Coffee break
      bar: 15,        // Bar time
      flight: 60,     // Airport buffer
      accommodation: 30, // Check-in time
    }

    const fromBuffer = categoryBuffers[fromPlace.category] || 15
    
    // For now, return default buffer - later can integrate with Google Maps
    return Math.max(fromBuffer, 10)
  }

  // Helper function to convert time string to minutes since midnight
  const timeToMinutes = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number)
    return hours * 60 + minutes
  }

  // Helper function to convert minutes since midnight to time string
  const minutesToTime = (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60) % 24
    const minutes = totalMinutes % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  // Calculate optimal start time for a place based on its position
  const calculateOptimalStartTime = (
    place: Place,
    previousPlace: Place | null,
    nextPlace: Place | null
  ): string => {
    // If no previous place, use the original time or default
    if (!previousPlace) {
      return place.start_time || '09:00'
    }

    // Calculate when previous place ends
    const prevEndTime = previousPlace.end_time || 
      minutesToTime(timeToMinutes(previousPlace.start_time || '09:00') + (previousPlace.duration || 90))
    
    // Add travel buffer
    const travelBuffer = calculateTravelBuffer(previousPlace, place)
    const earliestStart = timeToMinutes(prevEndTime) + travelBuffer
    
    // If there's a next place, make sure we don't conflict
    if (nextPlace) {
      const nextStartTime = timeToMinutes(nextPlace.start_time || '12:00')
      const neededDuration = place.duration || 90
      const latestStart = nextStartTime - neededDuration - calculateTravelBuffer(place, nextPlace)
      
      // Choose the later of earliest possible or fit before next
      const optimalStart = Math.max(earliestStart, Math.min(earliestStart, latestStart))
      return minutesToTime(optimalStart)
    }

    return minutesToTime(earliestStart)
  }

  // Detect schedule conflicts after a move
  const detectConflicts = (updatedPlaces: Place[], targetDay: number): ScheduleConflict[] => {
    const conflicts: ScheduleConflict[] = []
    const dayPlaces = updatedPlaces
      .filter(p => p.day === targetDay)
      .sort((a, b) => a.order - b.order)

    for (let i = 0; i < dayPlaces.length - 1; i++) {
      const current = dayPlaces[i]
      const next = dayPlaces[i + 1]
      
      const currentEnd = current.end_time || 
        minutesToTime(timeToMinutes(current.start_time || '09:00') + (current.duration || 90))
      const nextStart = next.start_time || '12:00'
      
      if (timeToMinutes(currentEnd) > timeToMinutes(nextStart)) {
        conflicts.push({
          type: 'overlap',
          affectedPlaces: [current, next],
          description: `${current.name} overlaps with ${next.name}`,
          suggestedResolution: 'auto_adjust'
        })
      }
    }

    // Check for unreasonably long days
    if (dayPlaces.length > 0) {
      const firstStart = timeToMinutes(dayPlaces[0].start_time || '09:00')
      const lastPlace = dayPlaces[dayPlaces.length - 1]
      const lastEnd = timeToMinutes(lastPlace.end_time || 
        minutesToTime(timeToMinutes(lastPlace.start_time || '09:00') + (lastPlace.duration || 90)))
      
      const dayLength = lastEnd - firstStart
      if (dayLength > 14 * 60) { // More than 14 hours
        conflicts.push({
          type: 'too_long_day',
          affectedPlaces: dayPlaces,
          description: `Day ${targetDay} is ${Math.floor(dayLength / 60)} hours long - consider splitting`,
          suggestedResolution: 'split_day'
        })
      }
    }

    return conflicts
  }

  // Generate time adjustments for affected places
  const generateTimeAdjustments = (
    places: Place[],
    targetDay: number,
    _insertedPlace: Place,
    insertIndex: number
  ): TimeAdjustment[] => {
    const adjustments: TimeAdjustment[] = []
    const dayPlaces = places
      .filter(p => p.day === targetDay)
      .sort((a, b) => a.order - b.order)

    // Recalculate times for all places after the insertion point
    for (let i = insertIndex; i < dayPlaces.length; i++) {
      const place = dayPlaces[i]
      const previousPlace = i === 0 ? null : dayPlaces[i - 1]
      const nextPlace = i === dayPlaces.length - 1 ? null : dayPlaces[i + 1]
      
      const newStartTime = calculateOptimalStartTime(place, previousPlace, nextPlace)
      const newEndTime = minutesToTime(timeToMinutes(newStartTime) + (place.duration || 90))
      
      if (newStartTime !== place.start_time) {
        adjustments.push({
          placeId: place.id,
          newStartTime,
          newEndTime,
          reason: i === insertIndex ? 'schedule_optimization' : 'conflict_resolution'
        })
      }
    }

    return adjustments
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    log('🚀 Drag started:', { 
      activeId: active.id, 
      activeData: active.data.current,
      allPlaceIds: places.map(p => p.id)
    })
    const place = places.find(p => p.id === active.id)
    if (place) {
      log('✅ Found dragged place:', place.name)
      setDraggedPlace(place)
    } else {
      log('❌ Could not find place with id:', active.id)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    log('🎯 Drag ended:', { activeId: active.id, overId: over?.id })
    
    setDraggedPlace(null)
    
    if (!over || active.id === over.id) {
      log('🚫 No valid drop target or same element')
      return
    }

    const draggedPlace = places.find(p => p.id === active.id)
    const targetPlace = places.find(p => p.id === over.id)
    
    log('🔍 Found places:', { 
      draggedPlace: draggedPlace?.name, 
      targetPlace: targetPlace?.name 
    })
    
    if (!draggedPlace || !targetPlace) {
      log('❌ Could not find dragged or target place')
      return
    }

    // Handle same day reordering
    if (draggedPlace.day === targetPlace.day) {
      log('🔄 Reordering within same day')
      
      const dayPlaces = places
        .filter(p => p.day === draggedPlace.day)
        .sort((a, b) => a.order - b.order)
      
      const oldIndex = dayPlaces.findIndex(p => p.id === draggedPlace.id)
      const newIndex = dayPlaces.findIndex(p => p.id === targetPlace.id)
      
      log('📍 Indices:', { oldIndex, newIndex })
      
      if (oldIndex !== newIndex) {
        // Reorder the array
        const reorderedPlaces = arrayMove(dayPlaces, oldIndex, newIndex)
        
        // Create updates for new order
        const orderUpdates = reorderedPlaces.map((place, index) => ({
          id: place.id,
          updates: { order: index }
        }))
        
        // Recalculate times for the affected day
        const timeUpdates = recalculateTimesAfterReorder(
          places.map(p => {
            const orderUpdate = orderUpdates.find(u => u.id === p.id)
            return orderUpdate ? { ...p, ...orderUpdate.updates } : p
          }),
          draggedPlace.day
        )
        
        // Combine order and time updates into single batch
        const finalUpdates = new Map<string, Partial<Place>>()
        
        // Add order updates
        orderUpdates.forEach(update => {
          finalUpdates.set(update.id, update.updates)
        })
        
        // Merge time updates
        timeUpdates.forEach(update => {
          const existing = finalUpdates.get(update.id) || {}
          finalUpdates.set(update.id, { ...existing, ...update.updates })
        })
        
        // Convert to array format and apply once
        const batchedUpdates = Array.from(finalUpdates.entries()).map(([id, updates]) => ({
          id,
          updates
        }))
        
        log('💾 Applying batched updates:', batchedUpdates.length, 'places')
        
        if (onBulkUpdatePlaces) {
          onBulkUpdatePlaces(batchedUpdates)
        } else {
          batchedUpdates.forEach(({ id, updates }) => onUpdatePlace(id, updates))
        }
      }
    } else {
      // Handle cross-day movement
      log('🔄 Moving between days:', draggedPlace.day, '->', targetPlace.day)
      
      const sourceDayPlaces = places
        .filter(p => p.day === draggedPlace.day && p.id !== draggedPlace.id)
        .sort((a, b) => a.order - b.order)
      
      const targetDayPlaces = places
        .filter(p => p.day === targetPlace.day)
        .sort((a, b) => a.order - b.order)
      
      const targetIndex = targetDayPlaces.findIndex(p => p.id === targetPlace.id)
      
      // Update source day orders
      const sourceUpdates = sourceDayPlaces.map((place, index) => ({
        id: place.id,
        updates: { order: index }
      }))
      
      // Insert into target day and update orders
      const newTargetPlaces = [...targetDayPlaces]
      newTargetPlaces.splice(targetIndex, 0, draggedPlace)
      
      const targetUpdates = newTargetPlaces.map((place, index) => ({
        id: place.id,
        updates: place.id === draggedPlace.id 
          ? { day: targetPlace.day, order: index }
          : { order: index }
      }))
      
      const orderUpdates = [...sourceUpdates, ...targetUpdates]
      
      // Recalculate times for both affected days
      const updatedPlaces = places.map(p => {
        const update = orderUpdates.find(u => u.id === p.id)
        return update ? { ...p, ...update.updates } : p
      })
      
      // Recalculate source day
      const sourceTimeUpdates = recalculateTimesAfterReorder(updatedPlaces, draggedPlace.day)
      
      // Recalculate target day  
      const targetTimeUpdates = recalculateTimesAfterReorder(updatedPlaces, targetPlace.day)
      
      const allTimeUpdates = [...sourceTimeUpdates, ...targetTimeUpdates]
      
      // Combine order and time updates into single batch
      const finalUpdates = new Map<string, Partial<Place>>()
      
      // Add order updates
      orderUpdates.forEach(update => {
        finalUpdates.set(update.id, update.updates)
      })
      
      // Merge time updates
      allTimeUpdates.forEach(update => {
        const existing = finalUpdates.get(update.id) || {}
        finalUpdates.set(update.id, { ...existing, ...update.updates })
      })
      
      // Convert to array format and apply once
      const batchedUpdates = Array.from(finalUpdates.entries()).map(([id, updates]) => ({
        id,
        updates
      }))
      
      log('💾 Applying cross-day batched updates:', batchedUpdates.length, 'places')
      
      if (onBulkUpdatePlaces) {
        onBulkUpdatePlaces(batchedUpdates)
      } else {
        batchedUpdates.forEach(({ id, updates }) => onUpdatePlace(id, updates))
      }
    }
  }

  const contextValue: DragDropContextType = {
    draggedPlace,
    activeOperation,
    scheduleConflicts,
    onPlaceReorder: (operation) => {
      // This will be called by components that want to trigger reordering programmatically
      setActiveOperation(operation)
    },
    clearConflicts: () => setScheduleConflicts([])
  }

  return (
    <DragDropContext.Provider value={contextValue}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        {children}
      </DndContext>
    </DragDropContext.Provider>
  )
}