import type { Place } from '../../types'

export interface DragData {
  place: Place
  sourceDay: number
  sourceIndex: number
}

export interface DropData {
  targetDay: number
  targetIndex: number
  insertPosition: 'before' | 'after' | 'replace'
}

export interface TimeAdjustment {
  placeId: string
  newStartTime: string
  newEndTime: string
  reason: 'travel_buffer' | 'conflict_resolution' | 'schedule_optimization'
}

export interface DragOperation {
  type: 'reorder' | 'move_to_day' | 'swap'
  draggedPlace: Place
  targetPlace?: Place
  sourceDay: number
  targetDay: number
  sourceIndex: number
  targetIndex: number
  timeAdjustments: TimeAdjustment[]
  conflictsDetected: boolean
}

export interface ScheduleConflict {
  type: 'overlap' | 'impossible_timing' | 'too_long_day'
  affectedPlaces: Place[]
  description: string
  suggestedResolution?: 'auto_adjust' | 'manual_review' | 'split_day'
}