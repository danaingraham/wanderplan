import { Link, useLocation } from 'react-router-dom'
import { Home, Compass, Plus } from 'lucide-react'
import { cn } from '../../utils/cn'

export function MobileNav() {
  const location = useLocation()

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/create', icon: Plus, label: 'Create', isCreate: true },
    { to: '/explore', icon: Compass, label: 'Explore' }
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center py-2">
        {navItems.map(({ to, icon: Icon, label, isCreate }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-colors relative",
              location.pathname === to
                ? "text-primary-600"
                : "text-gray-500 hover:text-gray-700",
              isCreate && "bg-primary-500 text-white hover:bg-primary-600 -mt-6 shadow-lg rounded-full p-4"
            )}
          >
            <Icon className={cn("h-6 w-6", isCreate ? "h-8 w-8" : "")} />
            <span className={cn("text-xs mt-1 font-medium", isCreate ? "hidden" : "")}>
              {label}
            </span>
            {location.pathname === to && !isCreate && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-500 rounded-full" />
            )}
          </Link>
        ))}
      </div>
    </nav>
  )
}