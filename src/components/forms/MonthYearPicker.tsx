interface MonthYearPickerProps {
  label?: string
  month: string
  year: string
  onMonthChange: (month: string) => void
  onYearChange: (year: string) => void
  error?: string
}

const MONTHS = [
  { value: '', label: 'Select month' },
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

const generateYears = () => {
  const currentYear = new Date().getFullYear()
  const years = [{ value: '', label: 'Select year' }]
  
  // Generate years from 1950 to current year
  for (let year = currentYear; year >= 1950; year--) {
    years.push({ value: year.toString(), label: year.toString() })
  }
  
  return years
}

export function MonthYearPicker({
  label,
  month,
  year,
  onMonthChange,
  onYearChange,
  error
}: MonthYearPickerProps) {
  const years = generateYears()

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <select
            value={month}
            onChange={(e) => onMonthChange(e.target.value)}
            className={`input-field ${
              error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
            }`}
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <select
            value={year}
            onChange={(e) => onYearChange(e.target.value)}
            className={`input-field ${
              error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
            }`}
          >
            {years.map((y) => (
              <option key={y.value} value={y.value}>
                {y.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}