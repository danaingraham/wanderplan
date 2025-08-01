import { Header } from './Header'
import { MobileNav } from './MobileNav'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pb-16 md:pb-0">
        {children}
      </main>
      <MobileNav />
    </div>
  )
}