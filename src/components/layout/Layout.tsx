import { useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Header } from './Header'
import { MobileTabBar } from './MobileTabBar'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
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
  const isSettings = /^\/(settings|api-status)/.test(location.pathname)
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop: Show Header on all pages except Trip Detail */}
      {!isMobile && !isTripDetail && (
        <Header 
          context={{ isSettings: isSettings }}
        />
      )}
      
      {/* Mobile: Show simplified Header AND enhanced TabBar on all pages except Trip Detail */}
      {isMobile && !isTripDetail && (
        <>
          <Header 
            context={{ isSettings: isSettings }}
          />
          <MobileTabBar />
        </>
      )}
      
      {/* Main content with appropriate padding */}
      <main className={
        isTripDetail 
          ? "" 
          : isMobile 
            ? "pb-20" // Padding for mobile tab bar
            : "" // Desktop header is static, no padding needed
      }>
        {children}
      </main>
    </div>
  )
}