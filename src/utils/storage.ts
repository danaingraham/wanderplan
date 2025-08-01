export const storage = {
  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error(`Error getting item from storage: ${key}`, error)
      return null
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Error setting item in storage: ${key}`, error)
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing item from storage: ${key}`, error)
    }
  },

  clear: (): void => {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('Error clearing storage', error)
    }
  }
}

export const STORAGE_KEYS = {
  USER: 'wanderplan_user',
  TRIPS: 'wanderplan_trips',
  PLACES: 'wanderplan_places',
  DRAFT_TRIPS: 'wanderplan_draft_trips',
  SETTINGS: 'wanderplan_settings'
} as const