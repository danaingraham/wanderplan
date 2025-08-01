import { format, formatDistance, isAfter, isBefore, parseISO } from 'date-fns'

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
  return isAfter(dateObj, new Date())
}

export const isDateInPast = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return isBefore(dateObj, new Date())
}