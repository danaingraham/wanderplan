import { 
  Utensils, 
  Camera, 
  TreePine, 
  Music, 
  ShoppingBag, 
  Building, 
  Mountain,
  Heart,
  Users,
  User,
  Briefcase
} from 'lucide-react'
import { cn } from '../../utils/cn'

const preferenceIcons = {
  foodie: Utensils,
  culture: Camera,
  nature: TreePine,
  nightlife: Music,
  shopping: ShoppingBag,
  history: Building,
  adventure: Mountain,
}

const tripTypeIcons = {
  solo: User,
  romantic: Heart,
  family: Users,
  friends: Users,
  business: Briefcase,
}

interface PreferenceSelectorProps {
  label: string
  options: { value: string; label: string }[]
  selectedValues: string[]
  onChange: (values: string[]) => void
  maxSelections?: number
  type?: 'preferences' | 'trip-type'
  singleSelect?: boolean
}

export function PreferenceSelector({ 
  label, 
  options, 
  selectedValues, 
  onChange, 
  maxSelections,
  type = 'preferences',
  singleSelect = false
}: PreferenceSelectorProps) {
  
  const handleToggle = (value: string) => {
    if (singleSelect) {
      onChange([value])
    } else {
      if (selectedValues.includes(value)) {
        onChange(selectedValues.filter(v => v !== value))
      } else {
        if (maxSelections && selectedValues.length >= maxSelections) {
          return
        }
        onChange([...selectedValues, value])
      }
    }
  }
  
  const getIcon = (value: string) => {
    if (type === 'preferences') {
      return preferenceIcons[value as keyof typeof preferenceIcons]
    } else if (type === 'trip-type') {
      return tripTypeIcons[value as keyof typeof tripTypeIcons]
    }
    return null
  }
  
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        {label}
        {maxSelections && !singleSelect && (
          <span className="text-gray-500 ml-1">
            ({selectedValues.length}/{maxSelections})
          </span>
        )}
      </label>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {options.map((option) => {
          const isSelected = selectedValues.includes(option.value)
          const Icon = getIcon(option.value)
          const isDisabled = !singleSelect && maxSelections && 
            selectedValues.length >= maxSelections && !isSelected
          
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => !isDisabled && handleToggle(option.value)}
              disabled={isDisabled || false}
              className={cn(
                "p-4 rounded-xl border-2 transition-all text-left space-y-2",
                "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                isSelected 
                  ? "border-primary-500 bg-primary-50 text-primary-700" 
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300",
                isDisabled && "opacity-50 cursor-not-allowed hover:border-gray-200 hover:shadow-none"
              )}
            >
              {Icon && (
                <Icon className={cn(
                  "w-6 h-6",
                  isSelected ? "text-primary-600" : "text-gray-400"
                )} />
              )}
              <div className="font-medium text-sm">{option.label}</div>
            </button>
          )
        })}
      </div>
      
      {type === 'preferences' && (
        <p className="mt-2 text-xs text-gray-500">
          Select your travel interests to get personalized recommendations
        </p>
      )}
    </div>
  )
}