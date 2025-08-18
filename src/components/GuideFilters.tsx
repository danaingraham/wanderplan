import React, { useState, useEffect, useRef } from 'react'
import { X, Filter, Calendar, Clock, DollarSign, Globe, Sparkles } from 'lucide-react'

export interface FilterState {
  destination?: string
  month?: string
  duration?: { min?: number; max?: number }
  cost?: string
  theme?: string
  worldwide?: boolean
}

interface GuideFiltersProps {
  value: FilterState
  onChange: (filters: FilterState) => void
  activeFilters: Array<{ key: string; label: string; value: any }>
  isMobile?: boolean
}

const THEMES = ['Adventure', 'Relaxation', 'Culture', 'Foodie', 'Photography', 'Nature', 'City Break']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function GuideFilters({ value, onChange, activeFilters, isMobile = false }: GuideFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState<FilterState>(value)
  const popoverRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    setLocalFilters(value)
  }, [value])
  
  // Close popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    if (isOpen && !isMobile) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, isMobile])
  
  const handleApply = () => {
    onChange(localFilters)
    setIsOpen(false)
  }
  
  const handleReset = () => {
    setLocalFilters({})
    onChange({})
    setIsOpen(false)
  }
  
  const removeFilter = (key: string) => {
    const newFilters = { ...value }
    delete newFilters[key as keyof FilterState]
    onChange(newFilters)
  }
  
  const FilterPanel = () => (
    <div className="p-4 space-y-4">
      {/* Destination */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
          Destination
        </label>
        <input
          type="text"
          placeholder="City or country..."
          value={localFilters.destination || ''}
          onChange={(e) => setLocalFilters({ ...localFilters, destination: e.target.value })}
          className="search-input"
        />
      </div>
      
      {/* Month */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
          <Calendar className="inline w-4 h-4 mr-1" />
          Travel Month
        </label>
        <div className="grid grid-cols-4 gap-2">
          {MONTHS.map((month) => (
            <button
              key={month}
              onClick={() => setLocalFilters({ 
                ...localFilters, 
                month: localFilters.month === month ? undefined : month 
              })}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                localFilters.month === month 
                  ? 'border-transparent text-white' 
                  : 'border-zinc-200 hover:border-zinc-300'
              }`}
              style={{ 
                backgroundColor: localFilters.month === month ? 'var(--color-accent)' : 'white'
              }}
            >
              {month}
            </button>
          ))}
        </div>
      </div>
      
      {/* Duration */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
          <Clock className="inline w-4 h-4 mr-1" />
          Duration (days)
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            min="1"
            value={localFilters.duration?.min || ''}
            onChange={(e) => setLocalFilters({ 
              ...localFilters, 
              duration: { ...localFilters.duration, min: parseInt(e.target.value) || undefined }
            })}
            className="search-input flex-1"
          />
          <span className="self-center text-zinc-500">to</span>
          <input
            type="number"
            placeholder="Max"
            min="1"
            value={localFilters.duration?.max || ''}
            onChange={(e) => setLocalFilters({ 
              ...localFilters, 
              duration: { ...localFilters.duration, max: parseInt(e.target.value) || undefined }
            })}
            className="search-input flex-1"
          />
        </div>
      </div>
      
      {/* Cost */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
          <DollarSign className="inline w-4 h-4 mr-1" />
          Budget
        </label>
        <div className="flex gap-2">
          {['$', '$$', '$$$'].map((cost) => (
            <button
              key={cost}
              onClick={() => setLocalFilters({ 
                ...localFilters, 
                cost: localFilters.cost === cost ? undefined : cost 
              })}
              className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                localFilters.cost === cost 
                  ? 'border-transparent text-white' 
                  : 'border-zinc-200 hover:border-zinc-300'
              }`}
              style={{ 
                backgroundColor: localFilters.cost === cost ? 'var(--color-secondary)' : 'white'
              }}
            >
              {cost}
            </button>
          ))}
        </div>
      </div>
      
      {/* Theme */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
          <Sparkles className="inline w-4 h-4 mr-1" />
          Travel Theme
        </label>
        <div className="flex flex-wrap gap-2">
          {THEMES.map((theme) => (
            <button
              key={theme}
              onClick={() => setLocalFilters({ 
                ...localFilters, 
                theme: localFilters.theme === theme ? undefined : theme 
              })}
              className={`chip ${
                localFilters.theme === theme ? 'ring-2' : ''
              }`}
              style={{ 
                '--tw-ring-color': 'var(--color-primary)'
              } as React.CSSProperties}
            >
              {theme}
            </button>
          ))}
        </div>
      </div>
      
      {/* Worldwide Toggle */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text)' }}>
          <Globe className="w-4 h-4" />
          Worldwide coverage
        </label>
        <button
          onClick={() => setLocalFilters({ ...localFilters, worldwide: !localFilters.worldwide })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            localFilters.worldwide ? '' : 'bg-zinc-200'
          }`}
          style={{ 
            backgroundColor: localFilters.worldwide ? 'var(--color-accent)' : undefined
          }}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            localFilters.worldwide ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      </div>
      
      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={handleReset}
          className="flex-1 px-4 py-2 text-sm rounded-xl border border-zinc-200 hover:bg-zinc-50"
        >
          Reset
        </button>
        <button
          onClick={handleApply}
          className="flex-1 btn-primary text-sm"
        >
          Apply Filters
        </button>
      </div>
    </div>
  )
  
  return (
    <>
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 hover:border-zinc-300 bg-white text-sm font-medium"
        style={{ color: 'var(--color-text)' }}
      >
        <Filter className="w-4 h-4" />
        Filters
        {activeFilters.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full text-white"
                style={{ backgroundColor: 'var(--color-secondary)' }}>
            {activeFilters.length}
          </span>
        )}
      </button>
      
      {/* Desktop Popover */}
      {!isMobile && isOpen && (
        <div ref={popoverRef} className="absolute right-0 top-full mt-2 w-96 card z-50">
          <FilterPanel />
        </div>
      )}
      
      {/* Mobile Bottom Sheet */}
      {isMobile && isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Sheet */}
          <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-zinc-100 px-4 py-3 flex items-center justify-between">
              <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>
                Filters
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <FilterPanel />
          </div>
        </>
      )}
      
      {/* Active Filter Chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter, idx) => (
            <div key={idx} className="filter-badge">
              <span>{filter.label}</span>
              <button
                onClick={() => removeFilter(filter.key)}
                className="ml-1.5 text-zinc-500 hover:text-zinc-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}