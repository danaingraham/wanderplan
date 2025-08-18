import { useState, useEffect, useRef } from 'react'
import { MapPinned, BookOpenText, Users2, Plus, X, ChevronRight } from 'lucide-react'

type MobileNavProps = {
  activePath: string
  onNavigate: (path: string) => void
  onSignOut?: () => void
  user?: { name: string; avatarUrl?: string }
}

// Tab configuration
const tabs = [
  { id: 'guides', label: 'Guides', icon: BookOpenText, path: '/guides' },
  { id: 'trips', label: 'Trips', icon: MapPinned, path: '/dashboard' },
  { id: 'community', label: 'Community', icon: Users2, path: '/community' },
]

export default function MobileNav({ activePath, onNavigate, onSignOut, user }: MobileNavProps) {
  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [hasScrolled, setHasScrolled] = useState(false)
  const createSheetRef = useRef<HTMLDivElement>(null)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  // Determine active tab from path
  const getActiveTab = () => {
    if (activePath.startsWith('/dashboard') || activePath.startsWith('/trip')) return 'trips'
    if (activePath.startsWith('/guides')) return 'guides'
    if (activePath.startsWith('/community')) return 'community'
    return 'guides'
  }

  const activeTab = getActiveTab()

  // Handle scroll for top bar shadow
  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 0)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Handle clicks outside sheets
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (createSheetRef.current && !createSheetRef.current.contains(event.target as Node)) {
        setShowCreateSheet(false)
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false)
      }
    }

    if (showCreateSheet || showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCreateSheet, showProfileMenu])

  // Handle navigation
  const handleNavigation = (path: string) => {
    onNavigate(path)
    setShowCreateSheet(false)
    setShowProfileMenu(false)
  }

  return (
    <>
      {/* Top App Bar */}
      <header 
        className={`sticky top-0 z-50 h-12 bg-[#FDFDFD] border-b border-black/5 px-3 flex items-center justify-between transition-shadow ${
          hasScrolled ? 'shadow-md' : ''
        }`}
      >
        {/* Logo */}
        <button
          onClick={() => handleNavigation('/guides')}
          className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#4ECDC4] rounded"
          aria-label="Go to guides"
        >
          <svg className="h-6 w-6 text-[#FF6F61]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          <span className="font-semibold text-[#333333]">Wanderplan</span>
        </button>

        {/* Avatar */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="h-8 w-8 rounded-full overflow-hidden ring-1 ring-black/5 focus:outline-none focus:ring-2 focus:ring-[#4ECDC4]"
            aria-label="Profile menu"
            aria-haspopup="true"
            aria-expanded={showProfileMenu}
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-[#FF6F61] to-[#FFC300] flex items-center justify-center text-white text-sm font-medium">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
          </button>

          {/* Profile Menu Dropdown */}
          {showProfileMenu && (
            <div
              ref={profileMenuRef}
              className="absolute right-0 top-10 w-48 bg-white rounded-lg shadow-lg border border-black/5 py-2 z-50"
              role="menu"
            >
              <button
                onClick={() => handleNavigation('/profile')}
                className="w-full px-4 py-2 text-left text-[#333333] hover:bg-[#FFC300]/10 flex items-center justify-between focus:outline-none focus:bg-[#FFC300]/10"
                role="menuitem"
              >
                <span>Profile</span>
                <ChevronRight className="h-4 w-4 text-[#333333]/50" />
              </button>
              <button
                onClick={() => handleNavigation('/settings')}
                className="w-full px-4 py-2 text-left text-[#333333] hover:bg-[#FFC300]/10 flex items-center justify-between focus:outline-none focus:bg-[#FFC300]/10"
                role="menuitem"
              >
                <span>Settings</span>
                <ChevronRight className="h-4 w-4 text-[#333333]/50" />
              </button>
              <hr className="my-2 border-black/5" />
              <button
                onClick={() => {
                  setShowProfileMenu(false)
                  onSignOut?.()
                }}
                className="w-full px-4 py-2 text-left text-[#FF6F61] hover:bg-[#FF6F61]/10 focus:outline-none focus:bg-[#FF6F61]/10"
                role="menuitem"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Bottom Tab Bar */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#FDFDFD] border-t border-black/5 backdrop-blur-sm"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Primary navigation"
      >
        <ul className="grid grid-cols-4" role="tablist">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <li key={tab.id}>
                <button
                  onClick={() => handleNavigation(tab.path)}
                  className={`relative w-full flex flex-col items-center justify-center gap-1 py-2 text-[11px] focus:outline-none focus:ring-2 focus:ring-[#4ECDC4] ${
                    isActive 
                      ? 'font-semibold text-[#333333] border-t-[3px] border-[#FFC300]' 
                      : 'text-[#333333]/70'
                  }`}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={tab.label}
                  style={{ minHeight: '44px' }}
                >
                  <Icon 
                    className={`h-5 w-5 ${isActive ? 'text-[#333333]' : 'text-[#333333]/70'}`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span>{tab.label}</span>
                </button>
              </li>
            )
          })}
        </ul>

        {/* Center FAB */}
        <button
          onClick={() => setShowCreateSheet(true)}
          className="absolute -top-4 left-1/2 -translate-x-1/2 h-12 w-12 rounded-full bg-[#FF6F61] text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-[#FF6F61] focus:ring-offset-2 active:scale-95 transition-transform"
          aria-label="Create new item"
          aria-haspopup="dialog"
        >
          <Plus className="h-6 w-6 mx-auto" />
        </button>
      </nav>

      {/* Create Bottom Sheet */}
      {showCreateSheet && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/30 z-[60]"
            onClick={() => setShowCreateSheet(false)}
            aria-hidden="true"
          />
          
          {/* Sheet */}
          <div
            ref={createSheetRef}
            className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-2xl shadow-xl animate-slide-up"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            role="dialog"
            aria-label="Create options"
            aria-modal="true"
          >
            <div className="p-4">
              {/* Sheet handle */}
              <div className="w-12 h-1 bg-black/10 rounded-full mx-auto mb-4" />
              
              {/* Title */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#333333]">Create</h2>
                <button
                  onClick={() => setShowCreateSheet(false)}
                  className="p-1 rounded-full hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-[#4ECDC4]"
                  aria-label="Close"
                >
                  <X className="h-5 w-5 text-[#333333]/70" />
                </button>
              </div>

              {/* Create options */}
              <div className="space-y-2">
                <button
                  onClick={() => handleNavigation('/create/trip')}
                  className="w-full p-4 bg-[#FFC300]/10 hover:bg-[#FFC300]/20 rounded-lg flex items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-[#FFC300] transition-colors"
                  autoFocus
                >
                  <div className="h-10 w-10 bg-[#FFC300] rounded-full flex items-center justify-center">
                    <MapPinned className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-[#333333]">Create Trip</div>
                    <div className="text-sm text-[#333333]/60">Plan your next adventure</div>
                  </div>
                </button>

                <button
                  onClick={() => handleNavigation('/create/guide')}
                  className="w-full p-4 bg-[#4ECDC4]/10 hover:bg-[#4ECDC4]/20 rounded-lg flex items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-[#4ECDC4] transition-colors"
                >
                  <div className="h-10 w-10 bg-[#4ECDC4] rounded-full flex items-center justify-center">
                    <BookOpenText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-[#333333]">Create Guide</div>
                    <div className="text-sm text-[#333333]/60">Share your travel expertise</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Animation styles */}
      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-slide-up {
            animation: none;
          }
        }
      `}</style>
    </>
  )
}