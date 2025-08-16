import { useLocation, useNavigate } from 'react-router-dom'
import { Header as OldHeader } from './Header'
import NewHeader from '../Header'
import { MobileNav } from './MobileNav'
import { useUser } from '../../contexts/UserContext'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useUser()
  
  // Check if we're on the Trip Detail page
  const isTripDetail = location.pathname.startsWith('/trip/')
  
  // Check if we're on a settings page
  const isSettings = /^\/(profile|settings|api-status)/.test(location.pathname)
  
  // Convert user data to Header format
  const headerUser = user ? {
    name: user.full_name || user.email || 'User',
    avatarUrl: user.profile_picture_url
  } : undefined
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Use new Header on desktop, old header on mobile */}
      {!isTripDetail && (
        <>
          {/* Desktop: New Header */}
          <div className="hidden md:block">
            <NewHeader 
              activePath={location.pathname}
              onNavigate={(path) => navigate(path)}
              onSignOut={logout}
              user={headerUser}
            />
          </div>
          
          {/* Mobile: Keep existing header */}
          <div className="md:hidden">
            <OldHeader 
              context={{ isSettings }}
              showCreateTrip={!isSettings}
            />
          </div>
        </>
      )}
      
      <main className={isTripDetail ? "" : "pb-16 md:pb-0"}>
        {children}
      </main>
      
      {/* Conditionally render mobile nav - hide on Trip Detail and Settings */}
      {!isTripDetail && !isSettings && <MobileNav />}
    </div>
  )
}