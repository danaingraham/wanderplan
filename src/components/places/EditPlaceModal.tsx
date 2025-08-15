import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { Place } from '../../types'

interface EditPlaceModalProps {
  place: Place | null
  isOpen: boolean
  onClose: () => void
  onSave: (placeId: string, updates: Partial<Place>) => void
}

export function EditPlaceModal({ place, isOpen, onClose, onSave }: EditPlaceModalProps) {
  const [formData, setFormData] = useState<Partial<Place>>({})

  useEffect(() => {
    if (place) {
      setFormData({
        name: place.name,
        address: place.address || '',
        notes: place.notes || '',
        start_time: place.start_time || '09:00',
        duration: place.duration || 90,
        category: place.category
      })
    }
  }, [place])

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen || !place) return null

  const handleSave = () => {
    // Calculate end time from start time and duration
    const [hours, minutes] = (formData.start_time || '09:00').split(':').map(Number)
    const totalMinutes = hours * 60 + minutes + (formData.duration || 90)
    const endHours = Math.floor(totalMinutes / 60) % 24
    const endMinutes = totalMinutes % 60
    const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`

    onSave(place.id, {
      ...formData,
      end_time: endTime
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
      />
      
      {/* Modal/Sheet - responsive positioning */}
      <div className="relative bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-md max-h-[80vh] sm:max-h-[90vh] overflow-hidden animate-slide-up sm:animate-none pb-safe">
        {/* Drag handle for mobile */}
        <div className="sm:hidden w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-2" />
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Edit Place</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form - scrollable on mobile */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(75vh-8rem)] sm:max-h-none">
          {/* Name */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Place Name
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              autoFocus
            />
          </div>

          {/* Time and Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={formData.start_time || '09:00'}
                onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Duration (min)
              </label>
              <input
                type="number"
                value={formData.duration || 90}
                onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value) || 90})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                min="15"
                step="15"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Address
            </label>
            <input
              type="text"
              value={formData.address || ''}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Enter address (optional)"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Category
            </label>
            <select
              value={formData.category || 'attraction'}
              onChange={(e) => setFormData({...formData, category: e.target.value as Place['category']})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="attraction">Attraction</option>
              <option value="restaurant">Restaurant</option>
              <option value="hotel">Hotel</option>
              <option value="activity">Activity</option>
              <option value="shop">Shop</option>
              <option value="transport">Transport</option>
              <option value="cafe">Cafe</option>
              <option value="bar">Bar</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
              rows={3}
              placeholder="Add notes (optional)"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t bg-gray-50 pb-safe-offset-4">
          <button
            onClick={handleSave}
            disabled={!formData.name?.trim()}
            className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Save Changes
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}