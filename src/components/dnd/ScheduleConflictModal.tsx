import { AlertTriangle, Clock, X, CheckCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import { useDragDrop } from './DragDropProvider'

interface ScheduleConflictModalProps {
  isOpen: boolean
  onClose: () => void
  onResolve: (resolution: 'auto_adjust' | 'manual_review' | 'accept_as_is') => void
}

export function ScheduleConflictModal({ isOpen, onClose, onResolve }: ScheduleConflictModalProps) {
  const { scheduleConflicts, activeOperation } = useDragDrop()

  if (!isOpen || scheduleConflicts.length === 0) {
    return null
  }

  const hasAutoResolution = scheduleConflicts.some(c => c.suggestedResolution === 'auto_adjust')
  const hasManualResolution = scheduleConflicts.some(c => c.suggestedResolution === 'manual_review')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Schedule Conflicts Detected</h3>
              <p className="text-sm text-gray-600">{scheduleConflicts.length} issue{scheduleConflicts.length > 1 ? 's' : ''} found</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[400px] overflow-y-auto">
          <div className="space-y-4">
            {scheduleConflicts.map((conflict, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                    conflict.type === 'overlap' ? 'bg-red-100' :
                    conflict.type === 'too_long_day' ? 'bg-amber-100' :
                    'bg-gray-100'
                  }`}>
                    <Clock className={`w-3 h-3 ${
                      conflict.type === 'overlap' ? 'text-red-600' :
                      conflict.type === 'too_long_day' ? 'text-amber-600' :
                      'text-gray-600'
                    }`} />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      {conflict.type === 'overlap' ? 'Time Overlap' :
                       conflict.type === 'too_long_day' ? 'Long Day' :
                       'Timing Issue'}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">{conflict.description}</p>
                    
                    {conflict.affectedPlaces.length > 0 && (
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Affected places:</span>
                        {conflict.affectedPlaces.map(place => place.name).join(', ')}
                      </div>
                    )}
                    
                    {conflict.suggestedResolution && (
                      <div className="mt-2 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                        Suggested: {
                          conflict.suggestedResolution === 'auto_adjust' ? 'Auto-adjust times' :
                          conflict.suggestedResolution === 'manual_review' ? 'Manual review needed' :
                          'Split into multiple days'
                        }
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Operation Summary */}
          {activeOperation && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Operation Summary</h4>
              <p className="text-sm text-gray-600">
                {activeOperation.type === 'reorder' ? 'Reordered' :
                 activeOperation.type === 'move_to_day' ? 'Moved' : 'Swapped'} 
                <span className="font-medium"> {activeOperation.draggedPlace.name}</span>
                {activeOperation.type === 'move_to_day' && 
                  ` from Day ${activeOperation.sourceDay} to Day ${activeOperation.targetDay}`}
              </p>
              {activeOperation.timeAdjustments.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {activeOperation.timeAdjustments.length} time adjustment{activeOperation.timeAdjustments.length > 1 ? 's' : ''} will be made
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col gap-3">
            {hasAutoResolution && (
              <Button
                onClick={() => onResolve('auto_adjust')}
                className="flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Auto-Adjust Times
              </Button>
            )}
            
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => onResolve('accept_as_is')}
                className="flex-1"
              >
                Keep As Is
              </Button>
              
              {hasManualResolution && (
                <Button
                  variant="ghost"
                  onClick={() => onResolve('manual_review')}
                  className="flex-1"
                >
                  Manual Review
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}