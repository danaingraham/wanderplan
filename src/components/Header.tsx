import { useState, useEffect, useRef } from 'react'
import { ChevronDown, MapPin, User, Settings, LogOut, Plus } from 'lucide-react'

type HeaderProps = {
  activePath: string
  onNavigate: (path: string) => void
  onSignOut?: () => void
  user?: { name: string; avatarUrl?: string }
}

// Individual Tab Component
function NavTab({ 
  label, 
  isActive, 
  onClick 
}: { 
  label: string
  isActive: boolean
  onClick: () => void 
}) {
  return (
    <li role="presentation">
      <button
        role="tab"
        aria-selected={isActive}
        onClick={onClick}
        className={`
          px-3 py-2 rounded-lg text-sm font-medium transition-all
          focus:outline-none focus:ring-2 focus:ring-[#4ECDC4]
          ${isActive 
            ? 'text-[#333333] font-bold border-b-[3px] border-[#FFC300]' 
            : 'text-[#333333]/70 hover:text-[#4ECDC4] hover:bg-black/5'
          }
        `}
      >
        {label}
      </button>
    </li>
  )
}

// Create Menu Dropdown
function CreateMenu({ 
  isOpen, 
  onToggle, 
  onNavigate 
}: { 
  isOpen: boolean
  onToggle: () => void
  onNavigate: (path: string) => void 
}) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onToggle()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onToggle])

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        onToggle()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onToggle])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={onToggle}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold bg-[#FF6F61] text-white shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#FF6F61] transition-opacity"
      >
        <Plus className="w-4 h-4" />
        <span>Create</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <button
            onClick={() => {
              onNavigate('/create/trip')
              onToggle()
            }}
            className="w-full text-left px-4 py-2 text-sm text-[#333333] hover:bg-gray-50 transition-colors"
          >
            Create Trip
          </button>
          <button
            onClick={() => {
              onNavigate('/create/guide')
              onToggle()
            }}
            className="w-full text-left px-4 py-2 text-sm text-[#333333] hover:bg-gray-50 transition-colors"
          >
            Create Guide
          </button>
        </div>
      )}
    </div>
  )
}

// Profile Menu Dropdown
function ProfileMenu({ 
  isOpen, 
  onToggle, 
  onNavigate, 
  onSignOut,
  user
}: { 
  isOpen: boolean
  onToggle: () => void
  onNavigate: (path: string) => void
  onSignOut?: () => void
  user?: { name: string; avatarUrl?: string }
}) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onToggle()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onToggle])

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        onToggle()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onToggle])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={onToggle}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4ECDC4] transition-colors"
      >
        {user?.avatarUrl ? (
          <img 
            src={user.avatarUrl} 
            alt={user.name} 
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <User className="w-5 h-5 text-[#333333]" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {user?.name && (
            <>
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-[#333333]">{user.name}</p>
              </div>
            </>
          )}
          
          <button
            onClick={() => {
              onNavigate('/profile')
              onToggle()
            }}
            className="w-full text-left px-4 py-2 text-sm text-[#333333] hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            Profile
          </button>
          
          <button
            onClick={() => {
              onNavigate('/settings')
              onToggle()
            }}
            className="w-full text-left px-4 py-2 text-sm text-[#333333] hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
          
          <div className="border-t border-gray-100 my-1" />
          
          <button
            onClick={() => {
              onSignOut?.()
              onToggle()
            }}
            className="w-full text-left px-4 py-2 text-sm text-[#333333] hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

export default function Header({ activePath, onNavigate, onSignOut, user }: HeaderProps) {
  const [hasShadow, setHasShadow] = useState(false)
  const [createMenuOpen, setCreateMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const tabsRef = useRef<HTMLUListElement>(null)

  // Determine active tab based on path
  const getActiveTab = () => {
    if (activePath === '/dashboard' || activePath.startsWith('/trips')) return 'trips'
    if (activePath === '/' || activePath.startsWith('/guides')) return 'guides'
    if (activePath.startsWith('/community')) return 'community'
    return null
  }

  const activeTab = getActiveTab()

  // Handle scroll shadow
  useEffect(() => {
    function handleScroll() {
      setHasShadow(window.scrollY > 0)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Handle keyboard navigation for tabs
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!tabsRef.current) return

      const tabs = tabsRef.current.querySelectorAll('[role="tab"]')
      const currentIndex = Array.from(tabs).findIndex(tab => tab === document.activeElement)

      if (currentIndex === -1) return

      let nextIndex = currentIndex

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        nextIndex = (currentIndex + 1) % tabs.length
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        nextIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1
      }

      if (nextIndex !== currentIndex) {
        (tabs[nextIndex] as HTMLElement).focus()
      }
    }

    const tabsList = tabsRef.current
    if (tabsList) {
      tabsList.addEventListener('keydown', handleKeyDown)
      return () => tabsList.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <header 
      className={`sticky top-0 z-50 bg-[#FDFDFD] transition-shadow ${
        hasShadow ? 'shadow-md' : ''
      }`}
    >
      <div className="mx-auto max-w-7xl px-6">
        <nav aria-label="Primary" className="h-16 flex items-center gap-6">
          {/* Logo */}
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2 text-[#333333] font-bold text-xl hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#4ECDC4] rounded-lg px-2 py-1"
          >
            <MapPin className="w-6 h-6 text-[#FF6F61]" />
            <span>Wanderplan</span>
          </button>

          {/* Navigation Tabs */}
          <ul 
            ref={tabsRef}
            role="tablist" 
            className="flex items-center gap-2"
          >
            <NavTab
              label="Guides"
              isActive={activeTab === 'guides'}
              onClick={() => onNavigate('/guides')}
            />
            <NavTab
              label="Trips"
              isActive={activeTab === 'trips'}
              onClick={() => onNavigate('/dashboard')}
            />
            <NavTab
              label="Community"
              isActive={activeTab === 'community'}
              onClick={() => onNavigate('/community')}
            />
          </ul>

          {/* Spacer */}
          <div className="flex-grow" />

          {/* Actions */}
          <div className="flex items-center gap-3">
            <CreateMenu
              isOpen={createMenuOpen}
              onToggle={() => setCreateMenuOpen(!createMenuOpen)}
              onNavigate={onNavigate}
            />
            
            <ProfileMenu
              isOpen={profileMenuOpen}
              onToggle={() => setProfileMenuOpen(!profileMenuOpen)}
              onNavigate={onNavigate}
              onSignOut={onSignOut}
              user={user}
            />
          </div>
        </nav>
      </div>
    </header>
  )
}