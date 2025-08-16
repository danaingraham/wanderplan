import { useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import NewHeader from '../Header'
import MobileNav from '../MobileNav'
import { useUser } from '../../contexts/UserContext'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useUser()
  const [isMobile, setIsMobile] = useState(false)
  
  // Check viewport size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
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
      {/* Desktop: Show NewHeader on all pages except Trip Detail */}
      {!isMobile && !isTripDetail && (
        <NewHeader 
          activePath={location.pathname}
          onNavigate={(path) => navigate(path)}
          onSignOut={logout}
          user={headerUser}
        />
      )}
      
      {/* Mobile: Show MobileNav on all pages except Trip Detail and Settings */}
      {isMobile && !isTripDetail && !isSettings && (
        <MobileNav
          activePath={location.pathname}
          onNavigate={(path) => navigate(path)}
          onSignOut={logout}
          user={headerUser}
        />
      )}
      
      {/* Main content with appropriate padding */}
      <main className={
        isTripDetail 
          ? "" 
          : isMobile 
            ? "pt-12 pb-24" // Top padding for mobile header, bottom for tab bar + FAB
            : ""
      }>
        {children}
      </main>
    </div>
  )
}