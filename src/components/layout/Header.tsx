import { Link, useNavigate } from 'react-router-dom'
import { MapPin, Plus, ChevronLeft } from 'lucide-react'
import { DesktopNav } from './DesktopNav'
import { cn } from '../../utils/cn'

interface HeaderProps {
  context?: { isSettings?: boolean }
}

export function Header({ context }: HeaderProps) {
  const navigate = useNavigate()

  const isSettings = context?.isSettings || false
  
  // Handle back navigation for settings
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky md:static top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Mobile Settings Header */}
        {isSettings && (
          <div className="md:hidden flex justify-between items-center h-14">
            {/* Back button */}
            <button
              onClick={handleBack}
              className={cn(
                "flex items-center gap-2 px-3 py-2 -ml-3 min-w-[44px] min-h-[44px]",
                "text-gray-600 hover:text-gray-900",
                "hover:bg-gray-100 rounded-lg transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              )}
              aria-label="Back"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>

            {/* Center title */}
            <h1 className="absolute left-1/2 transform -translate-x-1/2 text-base font-semibold text-gray-900">
              Settings
            </h1>

            {/* Empty space for balance */}
            <div className="w-[44px]" />
          </div>
        )}
        
        {/* Regular Mobile Header (non-settings) */}
        {!isSettings && (
          <div className="md:hidden flex justify-between items-center h-14">
            <Link 
              to="/" 
              className="flex items-center space-x-2 text-primary-600 font-bold text-lg"
            >
              <MapPin className="h-5 w-5" />
              <span>Wanderplan</span>
            </Link>
            
            {/* Create button on mobile */}
            <Link
              to="/create"
              className="flex items-center justify-center w-10 h-10 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors"
              aria-label="Create new trip"
            >
              <Plus className="h-5 w-5" />
            </Link>
          </div>
        )}

        {/* Desktop Header (all pages) */}
        <div className="hidden md:flex justify-between items-center h-16">
          <Link 
            to="/" 
            className="flex items-center space-x-2 text-primary-600 font-bold text-xl"
          >
            <MapPin className="h-6 w-6" />
            <span>Wanderplan</span>
          </Link>
          
          {/* Desktop Navigation */}
          <DesktopNav />
        </div>
      </div>
    </header>
  )
}