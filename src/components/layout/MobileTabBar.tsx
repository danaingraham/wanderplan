import { Link, useLocation } from 'react-router-dom'
import { Home, MapPin, User } from 'lucide-react'
import { cn } from '../../utils/cn'

interface TabItem {
  to: string
  icon: React.ElementType
  label: string
}

export function MobileTabBar() {
  const location = useLocation()
  
  const tabItems: TabItem[] = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/trips', icon: MapPin, label: 'Trips' },
    { to: '/profile', icon: User, label: 'Profile' }
  ]
  
  const isActive = (path: string) => {
    if (path === '/' && (location.pathname === '/' || location.pathname === '/dashboard')) return true
    if (path === '/trips' && location.pathname.startsWith('/trip')) return true
    return location.pathname === path
  }
  
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-pb">
      <div className="relative">
        {/* Background blur effect */}
        <div className="absolute inset-0 backdrop-blur-xl bg-white/95" />
        
        {/* Tab items */}
        <div className="relative flex justify-around items-center px-4 py-3">
          {tabItems.map(({ to, icon: Icon, label }) => {
            const active = isActive(to)
            
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "relative flex flex-col items-center justify-center",
                  "py-1 px-3 min-w-[80px]",
                  "transition-all duration-200",
                  "group",
                  active && "scale-105"
                )}
              >
                {/* Icon container with animation */}
                <div className={cn(
                  "relative flex items-center justify-center",
                  "w-10 h-10 rounded-lg",
                  "transition-all duration-200",
                  active ? "bg-primary-100" : "group-hover:bg-gray-50"
                )}>
                  <Icon className={cn(
                    "h-5 w-5 transition-all duration-200",
                    active ? "text-primary-600" : "text-gray-500 group-hover:text-gray-700"
                  )} />
                  
                  {/* Active dot indicator */}
                  {active && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                  )}
                </div>
                
                {/* Label */}
                <span className={cn(
                  "text-xs mt-0.5 font-medium transition-colors duration-200",
                  active ? "text-primary-600" : "text-gray-500"
                )}>
                  {label}
                </span>
                
                {/* Active bar at bottom */}
                {active && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-primary-500 rounded-full" />
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}