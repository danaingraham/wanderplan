import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MapPin, Plus, User } from 'lucide-react'
import { useUser } from '../../contexts/UserContext'
import { cn } from '../../utils/cn'

export function Header() {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { user, logout } = useUser()
  const location = useLocation()

  const isExplore = location.pathname === '/explore'
  const isMyTrips = location.pathname === '/' || location.pathname === '/create' || location.pathname.startsWith('/trip/')

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link 
            to="/" 
            className="flex items-center space-x-2 text-primary-600 font-bold text-xl"
          >
            <MapPin className="h-6 w-6" />
            <span>Wanderplan</span>
          </Link>

          <div className="hidden md:flex items-center space-x-1 bg-gray-100 rounded-xl p-1">
            <Link
              to="/explore"
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                isExplore
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              Explore
            </Link>
            <Link
              to="/"
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                isMyTrips
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              My Trips
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/create"
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create Trip</span>
            </Link>

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