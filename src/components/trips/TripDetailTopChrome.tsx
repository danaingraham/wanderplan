import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, User } from 'lucide-react'
import { cn } from '../../utils/cn'

interface TripDetailTopChromeProps {
  title: string
  onBack: () => void
  onAvatarClick: () => void
  userName?: string
}

export function TripDetailTopChrome({ 
  title, 
  onBack, 
  onAvatarClick,
  userName 
}: TripDetailTopChromeProps) {
  const [isCompactVisible, setIsCompactVisible] = useState(false)
  
  // Scroll threshold for showing compact bar
  const SCROLL_THRESHOLD = 80

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY
    setIsCompactVisible(currentScrollY > SCROLL_THRESHOLD)
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Check initial scroll position
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  // Handle keyboard events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      // Could be used to close any open menus
    }
  }, [])

  return (
    <>
      {/* Top bar with back button and avatar - Always visible */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div 
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          style={{
            paddingTop: 'env(safe-area-inset-top, 0)',
          }}
        >
          <div className="flex justify-between items-center h-14">
            {/* Back button with text */}
            <button
              onClick={onBack}
              onKeyDown={handleKeyDown}
              className={cn(
                "flex items-center gap-2 px-3 py-2 -ml-3",
                "text-gray-600 hover:text-gray-900",
                "hover:bg-gray-100 rounded-lg transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              )}
              aria-label="Back to My Trips"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="font-medium">My Trips</span>
            </button>

            {/* Title (only visible after scroll) */}
            <h1 className={cn(
              "absolute left-1/2 transform -translate-x-1/2",
              "text-base font-semibold text-gray-900 truncate max-w-[40%]",
              "transition-opacity duration-300",
              isCompactVisible ? "opacity-100" : "opacity-0"
            )}>
              {title}
            </h1>

            {/* Avatar button */}
            <button
              onClick={onAvatarClick}
              onKeyDown={handleKeyDown}
              className={cn(
                "flex items-center gap-2 p-1.5 -mr-1.5",
                "hover:bg-gray-100 rounded-lg transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              )}
              aria-label="Open profile menu"
            >
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              {userName && (
                <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                  {userName}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}