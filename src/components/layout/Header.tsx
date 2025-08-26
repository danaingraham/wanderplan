import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapPin, Plus, User, ChevronLeft } from 'lucide-react'
import { useUser } from '../../contexts/UserContext'
import { cn } from '../../utils/cn'

interface HeaderProps {
  context?: { isSettings?: boolean }
  showCreateTrip?: boolean
}

export function Header({ context, showCreateTrip = true }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const { user, logout, avatarUrl, updateAvatar } = useUser()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isSettings = context?.isSettings || false
  
  // Handle back navigation for settings
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  return (
    <header className="bg-white border-b border-gray-200 sticky md:static top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

            {/* Avatar menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={cn(
                  "flex items-center p-2 -mr-2 min-w-[44px] min-h-[44px]",
                  "hover:bg-gray-100 rounded-lg transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                )}
                aria-label="Open account menu"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary-500 flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-10">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-primary-600 font-medium hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Profile
                  </Link>
                  <div className="border-t border-gray-200 my-1"></div>
                  <button
                    onClick={async () => {
                      if (isLoggingOut) return
                      console.log('Sign out button clicked')
                      setIsLoggingOut(true)
                      setShowUserMenu(false)
                      await logout()
                      // Logout function handles redirect
                    }}
                    disabled={isLoggingOut}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Regular Mobile Header (non-settings) */}
        {!isSettings && (
          <div className="md:hidden flex justify-between items-center h-16">
            <Link 
              to="/" 
              className="flex items-center space-x-2 text-primary-600 font-bold text-xl"
            >
              <MapPin className="h-6 w-6" />
              <span>Wanderplan</span>
            </Link>
            
            <div className="flex items-center space-x-2">
              {/* Avatar - clickable for photo upload */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="h-8 w-8 rounded-full overflow-hidden bg-gray-100 border border-gray-200 hover:ring-2 hover:ring-primary-400 transition-all"
                aria-label="Change profile photo"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary-500 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                )}
              </button>
              
              {/* Menu button */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-10">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-primary-600 font-medium hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      to="/api-status"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      API Status
                    </Link>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={async () => {
                        if (isLoggingOut) return
                        console.log('Sign out button clicked')
                        setIsLoggingOut(true)
                        setShowUserMenu(false)
                        await logout()
                        // Logout function handles redirect
                      }}
                      disabled={isLoggingOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                      {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
                    </button>
                  </div>
                )}
              </div>
            </div>
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


          <div className="flex items-center space-x-4">
            {showCreateTrip && (
              <Link
                to="/create"
                className={cn(
                  isSettings 
                    ? "flex items-center space-x-2 text-gray-500 hover:text-gray-700 transition-colors"
                    : "btn-primary flex items-center space-x-2"
                )}
              >
                <Plus className="h-4 w-4" />
                <span>Create Trip</span>
              </Link>
            )}

            <div className="flex items-center space-x-3">
              {/* Avatar - clickable for photo upload */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="h-8 w-8 rounded-full overflow-hidden bg-gray-100 border border-gray-200 hover:ring-2 hover:ring-primary-400 transition-all"
                aria-label="Change profile photo"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary-500 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                )}
              </button>
              
              {/* User menu */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <span className="hidden md:block text-sm font-medium text-gray-700">
                    {user?.full_name || 'User'}
                  </span>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-10">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-primary-600 font-medium hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Profile
                    </Link>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={async () => {
                        if (isLoggingOut) return
                        console.log('Sign out button clicked')
                        setIsLoggingOut(true)
                        setShowUserMenu(false)
                        await logout()
                        // Logout function handles redirect
                      }}
                      disabled={isLoggingOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                      {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hidden file input for avatar upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
              updateAvatar(reader.result as string)
            }
            reader.readAsDataURL(file)
          }
        }}
      />
    </header>
  )
}