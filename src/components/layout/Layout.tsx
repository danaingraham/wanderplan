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
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Conditionally render header - hide on Trip Detail */}
      {!isTripDetail && <Header />}
      
      <main className={isTripDetail ? "" : "pb-16 md:pb-0"}>
        {children}
      </main>
      
      {/* Conditionally render mobile nav - hide on Trip Detail */}
      {!isTripDetail && <MobileNav />}
    </div>
  )
}