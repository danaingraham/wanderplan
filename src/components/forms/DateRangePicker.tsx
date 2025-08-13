import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isAfter, isBefore, isWithinInterval } from 'date-fns'
import { cn } from '../../utils/cn'

interface DateRangePickerProps {
  label?: string
  startDate?: string
  endDate?: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  placeholder?: string
  minDate?: Date
  maxDate?: Date
  error?: string
}

export function DateRangePicker({ 
  label, 
  startDate, 
  endDate,
  onStartDateChange,
  onEndDateChange,
  placeholder = "Select dates",
  minDate,
  maxDate,
  error 
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectingStart, setSelectingStart] = useState(true)
  const lastClickTimeRef = useRef<number>(0)
  const lastClickDateRef = useRef<Date | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Create dates in local timezone to avoid UTC offset issues
  const createLocalDate = (dateString: string) => {
    if (!dateString) return null
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day) // month is 0-indexed
  }
  
  const selectedStartDate = startDate ? createLocalDate(startDate) : null
  const selectedEndDate = endDate ? createLocalDate(endDate) : null
  
  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])
  
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDateWeek = startOfWeek(monthStart)
  const endDateWeek = endOfWeek(monthEnd)
  
  const days = []
  let day = startDateWeek
  
  while (day <= endDateWeek) {
    days.push(day)
    day = addDays(day, 1)
  }
  
  const formatDateForInput = (date: Date) => {
    // Create date string in local timezone to avoid timezone offset issues
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const handleDateClick = (date: Date) => {
    const dateString = formatDateForInput(date)
    console.log('🗓️ Date clicked:', dateString, 'Raw date:', date)
    console.log('🗓️ Current state:', {
      selectingStart,
      selectedStartDate: selectedStartDate ? formatDateForInput(selectedStartDate) : null,
      selectedEndDate: selectedEndDate ? formatDateForInput(selectedEndDate) : null
    })
    
    if (minDate && isBefore(date, minDate)) {
      console.log('❌ Date is before minDate, ignoring')
      return
    }
    if (maxDate && isAfter(date, maxDate)) {
      console.log('❌ Date is after maxDate, ignoring')
      return
    }
    
    const now = Date.now()
    const timeSinceLastClick = now - lastClickTimeRef.current
    const isDoubleClick = timeSinceLastClick < 300 && lastClickDateRef.current && isSameDay(lastClickDateRef.current, date)
    
    console.log('🖱️ Click timing:', {
      timeSinceLastClick,
      isDoubleClick,
      lastClickDate: lastClickDateRef.current ? formatDateForInput(lastClickDateRef.current) : null
    })
    
    lastClickTimeRef.current = now
    lastClickDateRef.current = date
    
    if (isDoubleClick) {
      // Double click: reset and start new range from this date
      console.log('✨ Double click detected - starting new range')
      onStartDateChange(dateString)
      onEndDateChange('')
      setSelectingStart(false) // Next click will be end date
    } else if (selectingStart || !selectedStartDate) {
      // First click or selecting start date
      console.log('🟢 Setting start date')
      onStartDateChange(dateString)
      onEndDateChange('')
      setSelectingStart(false) // Next click will be end date
    } else {
      // Second click - setting end date
      if (selectedStartDate && isBefore(date, selectedStartDate)) {
        // If clicked date is before start date, swap them
        console.log('🔄 End date before start date - swapping')
        onStartDateChange(dateString)
        onEndDateChange(formatDateForInput(selectedStartDate))
      } else {
        // Normal case - set end date
        console.log('🔴 Setting end date')
        onEndDateChange(dateString)
      }
      setSelectingStart(true) // Next click will start new range
      setIsOpen(false) // Close picker after selecting range
    }
    
    console.log('🗓️ New state will be:', {
      selectingStart: isDoubleClick ? false : selectingStart || !selectedStartDate ? false : true
    })
  }
  
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }
  
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const isInRange = (date: Date) => {
    if (!selectedStartDate || !selectedEndDate) return false
    return isWithinInterval(date, { start: selectedStartDate, end: selectedEndDate })
  }

  const isRangeStart = (date: Date) => {
    return selectedStartDate && isSameDay(date, selectedStartDate)
  }

  const isRangeEnd = (date: Date) => {
    return selectedEndDate && isSameDay(date, selectedEndDate)
  }

  const formatDateRange = () => {
    if (selectedStartDate && selectedEndDate) {
      return `${format(selectedStartDate, 'MMM dd, yyyy')} - ${format(selectedEndDate, 'MMM dd, yyyy')}`
    } else if (selectedStartDate) {
      return `${format(selectedStartDate, 'MMM dd, yyyy')} - ?`
    }
    return placeholder
  }
  
  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "input-field flex items-center justify-between",
          error && "border-red-300 focus:border-red-500 focus:ring-red-500"
        )}
      >
        <span className={(selectedStartDate || selectedEndDate) ? "text-gray-900" : "text-gray-400"}>
          {formatDateRange()}
        </span>
        <Calendar className="w-5 h-5 text-gray-400" />
      </button>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {isOpen && (
        <div className="absolute z-[90] mt-1 bg-white rounded-xl shadow-lg border border-gray-200 p-4 w-80">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="font-medium text-gray-900">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Instructions */}
          <div className="mb-3 p-2 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              {selectingStart || !selectedStartDate 
                ? "Click to select start date" 
                : "Click to select end date, double-click to start new range"
              }
            </p>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="p-2 text-xs font-medium text-gray-500 text-center">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const isDisabled = 
                (minDate && isBefore(day, minDate)) ||
                (maxDate && isAfter(day, maxDate))
              
              const inRange = isInRange(day)
              const rangeStart = isRangeStart(day)
              const rangeEnd = isRangeEnd(day)
              
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDateClick(day)}
                  disabled={isDisabled}
                  className={cn(
                    "p-2 text-sm rounded-lg hover:bg-gray-100 transition-colors relative",
                    !isSameMonth(day, currentMonth) && "text-gray-300",
                    inRange && !rangeStart && !rangeEnd && "bg-primary-100 text-primary-800",
                    rangeStart && "bg-primary-500 text-white hover:bg-primary-600",
                    rangeEnd && "bg-primary-500 text-white hover:bg-primary-600",
                    rangeStart && rangeEnd && "bg-primary-600 text-white", // Same day start and end
                    isDisabled && "text-gray-300 cursor-not-allowed hover:bg-transparent"
                  )}
                >
                  {format(day, 'd')}
                  {rangeStart && !rangeEnd && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
                  )}
                  {rangeEnd && !rangeStart && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Clear button */}
          {(selectedStartDate || selectedEndDate) && (
            <div className="mt-4 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  onStartDateChange('')
                  onEndDateChange('')
                  setSelectingStart(true)
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear dates
              </button>
              {selectedStartDate && selectedEndDate && (
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-sm bg-primary-500 text-white px-3 py-1 rounded-lg hover:bg-primary-600"
                >
                  Done
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}