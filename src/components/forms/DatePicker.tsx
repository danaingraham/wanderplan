import { useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isAfter, isBefore } from 'date-fns'
import { cn } from '../../utils/cn'

interface DatePickerProps {
  label?: string
  value?: string
  onChange: (date: string) => void
  placeholder?: string
  minDate?: Date
  maxDate?: Date
  error?: string
}

export function DatePicker({ 
  label, 
  value, 
  onChange, 
  placeholder = "Select date",
  minDate,
  maxDate,
  error 
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  const selectedDate = value ? new Date(value) : null
  
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)
  
  const days = []
  let day = startDate
  
  while (day <= endDate) {
    days.push(day)
    day = addDays(day, 1)
  }
  
  const handleDateClick = (date: Date) => {
    if (minDate && isBefore(date, minDate)) return
    if (maxDate && isAfter(date, maxDate)) return
    
    onChange(format(date, 'yyyy-MM-dd'))
    setIsOpen(false)
  }
  
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }
  
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }
  
  return (
    <div className="relative">
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
        <span className={selectedDate ? "text-gray-900" : "text-gray-400"}>
          {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : placeholder}
        </span>
        <Calendar className="w-5 h-5 text-gray-400" />
      </button>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 p-4 w-80">
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
              
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDateClick(day)}
                  disabled={isDisabled}
                  className={cn(
                    "p-2 text-sm rounded-lg hover:bg-gray-100 transition-colors",
                    !isSameMonth(day, currentMonth) && "text-gray-300",
                    selectedDate && isSameDay(day, selectedDate) && "bg-primary-500 text-white hover:bg-primary-600",
                    isDisabled && "text-gray-300 cursor-not-allowed hover:bg-transparent"
                  )}
                >
                  {format(day, 'd')}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}