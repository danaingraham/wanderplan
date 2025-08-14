import { useLocation } from 'react-router-dom'
import { Header } from './Header'
import { MobileNav } from './MobileNav'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  
  // Check if we're on the Trip Detail page
  const isTripDetail = location.pathname.startsWith('/trip/')
  
  // Check if we're on a settings page
  const isSettings = /^\/(profile|settings|api-status)/.test(location.pathname)
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Conditionally render header - hide on Trip Detail, show on Settings with context */}
      {!isTripDetail && (
        <Header 
          context={{ isSettings }}
          showCreateTrip={!isSettings}
        />
      )}
      
      <main className={isTripDetail ? "" : "pb-16 md:pb-0"}>
        {children}
      </main>
      
      {/* Conditionally render mobile nav - hide on Trip Detail and Settings */}
      {!isTripDetail && !isSettings && <MobileNav />}
    </div>
  )
}