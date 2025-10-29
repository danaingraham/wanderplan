import { Link, useLocation } from 'react-router-dom'
import { Home, MapPin, Plus, User, Sparkles } from 'lucide-react'
import { cn } from '../../utils/cn'

interface NavItem {
  to: string
  label: string
  icon: React.ElementType
}

export function DesktopNav() {
  const location = useLocation()
  
  const navItems: NavItem[] = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/trips', label: 'My Trips', icon: MapPin },
    { to: '/profile', label: 'Profile', icon: User }
  ]
  
  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/dashboard') return true
    if (path === '/' && location.pathname === '/') return true
    if (path === '/trips' && location.pathname.startsWith('/trip/')) return true
    return location.pathname === path
  }
  
  return (
    <nav className="hidden md:flex items-center justify-between flex-1 ml-12">
      {/* Main nav items */}
      <div className="flex items-center space-x-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              "relative flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200",
              isActive(to) ? (
                "text-primary-600 bg-primary-50"
              ) : (
                "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="font-medium text-sm">{label}</span>
            
            {/* Active indicator */}
            {isActive(to) && (
              <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary-500 rounded-full" />
            )}
          </Link>
        ))}
      </div>

      {/* Create Trip button on far right */}
      <Link
        to="/create"
        className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded-lg shadow-sm transition-all duration-200 ml-auto"
      >
        <Plus className="h-4 w-4" />
        <span className="font-medium text-sm">Create Trip</span>
        <Sparkles className="h-3 w-3 ml-1 text-gray-400" />
      </Link>
    </nav>
  )
}