export const storage = {
  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key)
      const parsed = item ? JSON.parse(item) : null
      console.log(`📖 Storage: Getting ${key} - found ${parsed ? (Array.isArray(parsed) ? parsed.length : 'non-array') : 'null'} items`)
      return parsed
    } catch (error) {
      console.error(`Error getting item from storage: ${key}`, error)
      return null
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      // Create backup before overwriting (especially for trips)
      if (key === STORAGE_KEYS.TRIPS && Array.isArray(value)) {
        const existing = localStorage.getItem(key)
        if (existing) {
          const backupKey = `${key}_backup_${Date.now()}`
          localStorage.setItem(backupKey, existing)
          console.log(`🔄 Storage: Created backup at ${backupKey}`)
          
          // Keep only the 3 most recent backups to avoid storage bloat
          const allKeys = Object.keys(localStorage)
          const backupKeys = allKeys.filter(k => k.startsWith(`${key}_backup_`)).sort()
          if (backupKeys.length > 3) {
            backupKeys.slice(0, -3).forEach(oldBackup => {
              localStorage.removeItem(oldBackup)
              console.log(`🗑️ Storage: Cleaned up old backup ${oldBackup}`)
            })
          }
        }
      }
      
      const serialized = JSON.stringify(value)
      console.log(`💾 Storage: Setting ${key} with ${Array.isArray(value) ? value.length : 'non-array'} items`)
      console.log(`💾 Storage: Data preview:`, Array.isArray(value) ? value.slice(0, 3) : value)
      
      // Prevent saving empty arrays for critical data unless it's intentional
      if (key === STORAGE_KEYS.TRIPS && Array.isArray(value) && value.length === 0) {
        const existing = localStorage.getItem(key)
        if (existing) {
          const existingData = JSON.parse(existing)
          if (Array.isArray(existingData) && existingData.length > 0) {
            console.warn(`⚠️ Storage: Attempting to save empty trips array when ${existingData.length} exist. This could be data loss!`)
            console.warn(`⚠️ Storage: Existing trips:`, existingData.map(t => ({ id: t.id, title: t.title })))
          }
        }
      }
      
      localStorage.setItem(key, serialized)
      
      // Verify it was saved
      const verification = localStorage.getItem(key)
      if (verification) {
        const parsed = JSON.parse(verification)
        console.log(`✅ Storage: Verified ${key} saved with ${Array.isArray(parsed) ? parsed.length : 'non-array'} items`)
      } else {
        console.error(`❌ Storage: Failed to verify ${key} was saved`)
      }
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
  },

  // Recovery functions
  getBackups: (key: string): string[] => {
    try {
      const allKeys = Object.keys(localStorage)
      return allKeys.filter(k => k.startsWith(`${key}_backup_`)).sort().reverse()
    } catch (error) {
      console.error('Error getting backups:', error)
      return []
    }
  },

  recoverFromBackup: (key: string, backupKey?: string): boolean => {
    try {
      const backupKeys = storage.getBackups(key)
      const backupToUse = backupKey || backupKeys[0] // Use most recent if not specified
      
      if (!backupToUse) {
        console.warn(`No backup found for ${key}`)
        return false
      }
      
      const backupData = localStorage.getItem(backupToUse)
      if (backupData) {
        localStorage.setItem(key, backupData)
        console.log(`✅ Recovered ${key} from backup ${backupToUse}`)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error recovering from backup:', error)
      return false
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