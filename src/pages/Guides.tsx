import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Search } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useTrips } from '../contexts/TripContext'
import { GuideCard } from '../components/GuideCard'
import { GuideFilters, type FilterState } from '../components/GuideFilters'
import { EmptyState } from '../components/EmptyState'

const STORAGE_KEY = 'guides:filters:v1'

export function Guides() {
  const navigate = useNavigate()
  const { trips } = useTrips()
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterState>({})
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // Load saved filters from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setFilters(parsed.filters || {})
        setSearchQuery(parsed.search || '')
      } catch (e) {
        console.error('Failed to load saved filters', e)
      }
    }
  }, [])
  
  // Save filters to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
      filters, 
      search: searchQuery 
    }))
  }, [filters, searchQuery])
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 250)
    return () => clearTimeout(timer)
  }, [searchQuery])
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search on '/'
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        document.getElementById('guide-search')?.focus()
      }
      // Clear search on Escape
      if (e.key === 'Escape') {
        const searchInput = document.getElementById('guide-search') as HTMLInputElement
        if (searchInput === document.activeElement) {
          searchInput.blur()
          setSearchQuery('')
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  // Filter guides
  const filteredGuides = useMemo(() => {
    return trips.filter(trip => {
      // Only show guides
      if (!trip.is_guide) return false
      
      // Search filter
      if (debouncedSearch) {
        const search = debouncedSearch.toLowerCase()
        const matchesSearch = 
          trip.title?.toLowerCase().includes(search) ||
          trip.destination?.toLowerCase().includes(search) ||
          trip.preferences?.some(p => p.toLowerCase().includes(search))
        if (!matchesSearch) return false
      }
      
      // Destination filter
      if (filters.destination) {
        const dest = filters.destination.toLowerCase()
        if (!trip.destination?.toLowerCase().includes(dest)) return false
      }
      
      // Month filter
      if (filters.month && trip.start_date) {
        const tripMonth = new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short' })
        if (tripMonth !== filters.month) return false
      }
      
      // Duration filter
      if (filters.duration && trip.start_date && trip.end_date) {
        const start = new Date(trip.start_date)
        const end = new Date(trip.end_date)
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        if (filters.duration.min && days < filters.duration.min) return false
        if (filters.duration.max && days > filters.duration.max) return false
      }
      
      // Cost filter
      if (filters.cost) {
        const costMap: Record<string, string> = { '$': 'budget', '$$': 'medium', '$$$': 'luxury' }
        if (trip.budget !== costMap[filters.cost]) return false
      }
      
      // Theme filter
      if (filters.theme) {
        const theme = filters.theme.toLowerCase()
        if (!trip.preferences?.some(p => p.toLowerCase().includes(theme))) return false
      }
      
      return true
    })
  }, [trips, debouncedSearch, filters])
  
  // Build active filters for display
  const activeFilters = useMemo(() => {
    const active: Array<{ key: string; label: string; value: any }> = []
    
    if (filters.destination) {
      active.push({ key: 'destination', label: `Destination: ${filters.destination}`, value: filters.destination })
    }
    if (filters.month) {
      active.push({ key: 'month', label: `Month: ${filters.month}`, value: filters.month })
    }
    if (filters.duration?.min || filters.duration?.max) {
      const label = filters.duration.min && filters.duration.max 
        ? `Duration: ${filters.duration.min}-${filters.duration.max} days`
        : filters.duration.min 
          ? `Duration: ${filters.duration.min}+ days`
          : `Duration: up to ${filters.duration.max} days`
      active.push({ key: 'duration', label, value: filters.duration })
    }
    if (filters.cost) {
      active.push({ key: 'cost', label: `Cost: ${filters.cost}`, value: filters.cost })
    }
    if (filters.theme) {
      active.push({ key: 'theme', label: `Theme: ${filters.theme}`, value: filters.theme })
    }
    if (filters.worldwide) {
      active.push({ key: 'worldwide', label: 'Worldwide', value: true })
    }
    
    return active
  }, [filters])
  
  const handleCreateGuide = () => {
    navigate('/guides/new')
  }
  
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Hero Header */}
      <div className="page py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
            Discover Travel Guides
          </h1>
          <p className="text-zinc-600">
            Find inspiration for your next adventure
          </p>
        </div>
        
        {/* Search + Filter Bar */}
        <div className="card p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                id="guide-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by destination, country, or tags…"
                className="search-input pl-10 w-full"
              />
            </div>
            
            {/* Filter Button */}
            <div className="relative">
              <GuideFilters
                value={filters}
                onChange={setFilters}
                activeFilters={activeFilters}
                isMobile={isMobile}
              />
            </div>
          </div>
          
          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-zinc-100">
              {activeFilters.map((filter, idx) => (
                <div key={idx} className="filter-badge">
                  <span>{filter.label}</span>
                  <button
                    onClick={() => {
                      const newFilters = { ...filters }
                      delete newFilters[filter.key as keyof FilterState]
                      setFilters(newFilters)
                    }}
                    className="ml-1.5 text-zinc-500 hover:text-zinc-700"
                  >
                    <span>×</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Results Count */}
        {filteredGuides.length > 0 && (
          <p className="text-sm text-zinc-600 mb-4">
            {filteredGuides.length} {filteredGuides.length === 1 ? 'guide' : 'guides'} found
          </p>
        )}
        
        {/* Guides Grid or Empty State */}
        {filteredGuides.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGuides.map((guide) => (
              <GuideCard key={guide.id} guide={guide} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={debouncedSearch || activeFilters.length > 0 ? "No guides found" : "No guides yet"}
            description={
              debouncedSearch || activeFilters.length > 0 
                ? "Try adjusting your search or filters"
                : "Create your first guide to get started"
            }
            action={{
              label: "Create Guide",
              onClick: handleCreateGuide
            }}
          />
        )}
      </div>
    </div>
  )
}