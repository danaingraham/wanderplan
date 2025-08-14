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
import type { DragOperation, ScheduleConflict } from './types'
import { recalculateTimesAfterReorder } from '../../utils/timeCalculator'


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
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )




  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const place = places.find(p => p.id === active.id)
    if (place) {
      setDraggedPlace(place)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    setDraggedPlace(null)
    
    if (!over || active.id === over.id) {
      return
    }

    const draggedPlace = places.find(p => p.id === active.id)
    const targetPlace = places.find(p => p.id === over.id)
    
    if (!draggedPlace || !targetPlace) {
      return
    }

    // Handle same day reordering
    if (draggedPlace.day === targetPlace.day) {
      const dayPlaces = places
        .filter(p => p.day === draggedPlace.day)
        .sort((a, b) => a.order - b.order)
      
      const oldIndex = dayPlaces.findIndex(p => p.id === draggedPlace.id)
      const newIndex = dayPlaces.findIndex(p => p.id === targetPlace.id)
      
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
        
        
        if (onBulkUpdatePlaces) {
          onBulkUpdatePlaces(batchedUpdates)
        } else {
          batchedUpdates.forEach(({ id, updates }) => onUpdatePlace(id, updates))
        }
      }
    } else {
      // Handle cross-day movement
      
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