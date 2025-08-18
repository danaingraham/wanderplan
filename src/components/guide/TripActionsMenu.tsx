import { useState, useRef, useEffect } from 'react'
import { MoreVertical, BookOpenText, Trash2, Share2, Download } from 'lucide-react'
import ConvertToGuideButton from './ConvertToGuideButton'
import { Button } from '../ui/Button'
import type { Trip } from '../../types'

interface TripActionsMenuProps {
  trip: Trip
  showDeleteConfirm: boolean
  setShowDeleteConfirm: (show: boolean) => void
  handleDeleteTrip: () => void
}

export function TripActionsMenu({ 
  trip, 
  showDeleteConfirm, 
  setShowDeleteConfirm,
  handleDeleteTrip 
}: TripActionsMenuProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showConvertModal, setShowConvertModal] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="More actions"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
        
        {showMenu && (
          <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 w-56">
            {/* Share as Guide Option */}
            <button
              onClick={() => {
                setShowMenu(false)
                setShowConvertModal(true)
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
            >
              <BookOpenText className="w-4 h-4" />
              Share as Travel Guide
            </button>
            
            {/* Export Option */}
            <button
              onClick={() => {
                setShowMenu(false)
                // TODO: Implement export functionality
                console.log('Export trip')
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
            >
              <Download className="w-4 h-4" />
              Export Itinerary
            </button>
            
            {/* Share Option */}
            <button
              onClick={() => {
                setShowMenu(false)
                // TODO: Implement share functionality
                console.log('Share trip')
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
            >
              <Share2 className="w-4 h-4" />
              Share Trip
            </button>
            
            {/* Divider */}
            <div className="border-t border-gray-100 my-2"></div>
            
            {/* Delete Option */}
            <button
              onClick={() => {
                setShowMenu(false)
                setShowDeleteConfirm(true)
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
            >
              <Trash2 className="w-4 h-4" />
              Delete Trip
            </button>
          </div>
        )}
      </div>

      {/* Convert to Guide Modal - rendered invisibly to trigger the modal */}
      {showConvertModal && (
        <div className="hidden">
          <ConvertToGuideButton 
            trip={trip} 
            className="hidden"
            autoOpen={true}
            onClose={() => setShowConvertModal(false)}
          />
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full z-[10000]">
            <h3 className="text-lg font-semibold mb-2">Delete Trip?</h3>
            <p className="text-gray-600 mb-4">This action cannot be undone. All trip data and places will be permanently deleted.</p>
            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={handleDeleteTrip}
                className="bg-red-600 hover:bg-red-700 flex-1"
              >
                Delete
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}