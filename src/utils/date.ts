import { format, formatDistance, formatDistanceToNow, isAfter, isBefore, parseISO, startOfDay, endOfDay, isToday } from 'date-fns'

export const formatDate = (date: string | Date, formatStr = 'MMM dd, yyyy'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatStr)
}

export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'MMM dd, yyyy h:mm a')
}

export const formatTimeOnly = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'h:mm a')
}

export const getRelativeTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return formatDistance(dateObj, new Date(), { addSuffix: true })
}

export const isDateInFuture = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  // Compare at the end of today vs start of the trip date
  // This ensures trips happening today are still considered "upcoming"
  return isAfter(startOfDay(dateObj), endOfDay(new Date()))
}

export const isDateInPast = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  // Compare end of trip date vs start of today
  // This ensures trips happening today are not considered "past"
  return isBefore(endOfDay(dateObj), startOfDay(new Date()))
}

export const isDateToday = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return isToday(dateObj)
}

export { formatDistanceToNow }