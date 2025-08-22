import { useState } from 'react'
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
  const { user, logout } = useUser()
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
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
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
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={cn(
                  "flex items-center p-2 -mr-2 min-w-[44px] min-h-[44px]",
                  "hover:bg-gray-100 rounded-lg transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                )}
                aria-label="Open account menu"
              >
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-10">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Profile Settings
                  </Link>
                  <Link
                    to="/api-status"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    API Status
                  </Link>
                  <Link
                    to="/test-database"
                    className="block px-4 py-2 text-sm text-yellow-600 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Test DB (Temp)
                  </Link>
                  <button
                    onClick={() => {
                      logout()
                      setShowUserMenu(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign Out
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
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="h-8 w-8 bg-primary-500 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-10">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Profile Settings
                    </Link>
                    <Link
                      to="/api-status"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      API Status
                    </Link>
                    <button
                      onClick={() => {
                        logout()
                        setShowUserMenu(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign Out
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

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="h-8 w-8 bg-primary-500 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700">
                  {user?.full_name || 'User'}
                </span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-10">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Profile Settings
                  </Link>
                  <Link
                    to="/api-status"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    API Status
                  </Link>
                  <Link
                    to="/test-database"
                    className="block px-4 py-2 text-sm text-yellow-600 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Test DB (Temp)
                  </Link>
                  <button
                    onClick={() => {
                      logout()
                      setShowUserMenu(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}