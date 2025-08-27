interface ActivityItem {
  id: string
  type: 'trip_view' | 'trip_create' | 'trip_edit' | 'place_add' | 'place_remove'
  tripId: string
  tripTitle?: string
  destination?: string
  metadata?: Record<string, any>
  timestamp: string
  userId: string
}

interface RecentlyViewed {
  tripId: string
  tripTitle: string
  destination: string
  lastViewed: string
  viewCount: number
}

class UserActivityService {
  private readonly STORAGE_KEY = 'wanderplan_activity'
  private readonly MAX_ITEMS = 50
  private readonly MAX_RECENT = 10

  /**
   * Track a user activity
   */
  trackActivity(
    type: ActivityItem['type'],
    tripId: string,
    metadata?: {
      tripTitle?: string
      destination?: string
      [key: string]: any
    },
    userId?: string
  ): void {
    try {
      const activity: ActivityItem = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        tripId,
        tripTitle: metadata?.tripTitle,
        destination: metadata?.destination,
        metadata,
        timestamp: new Date().toISOString(),
        userId: userId || 'anonymous'
      }

      // Get existing activities
      const activities = this.getActivities()
      
      // Add new activity at the beginning
      activities.unshift(activity)
      
      // Keep only the most recent items
      const trimmed = activities.slice(0, this.MAX_ITEMS)
      
      // Save to localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmed))
      
      // Also track in session for immediate use
      this.updateRecentlyViewed(tripId, metadata?.tripTitle, metadata?.destination)
      
      console.log('📊 Activity tracked:', type, tripId)
    } catch (error) {
      console.error('Error tracking activity:', error)
    }
  }

  /**
   * Get all activities
   */
  getActivities(): ActivityItem[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error getting activities:', error)
      return []
    }
  }

  /**
   * Get recently viewed trips
   */
  getRecentlyViewed(limit: number = 5): RecentlyViewed[] {
    try {
      const activities = this.getActivities()
      const tripViews = new Map<string, RecentlyViewed>()
      
      // Process activities to build recently viewed list
      activities
        .filter(a => a.type === 'trip_view' && a.tripId && a.tripTitle)
        .forEach(activity => {
          const existing = tripViews.get(activity.tripId)
          
          if (existing) {
            existing.viewCount++
            // Update last viewed if this is more recent
            if (activity.timestamp > existing.lastViewed) {
              existing.lastViewed = activity.timestamp
            }
          } else {
            tripViews.set(activity.tripId, {
              tripId: activity.tripId,
              tripTitle: activity.tripTitle || 'Untitled Trip',
              destination: activity.destination || 'Unknown',
              lastViewed: activity.timestamp,
              viewCount: 1
            })
          }
        })
      
      // Sort by last viewed and return top items
      return Array.from(tripViews.values())
        .sort((a, b) => new Date(b.lastViewed).getTime() - new Date(a.lastViewed).getTime())
        .slice(0, limit)
    } catch (error) {
      console.error('Error getting recently viewed:', error)
      return []
    }
  }

  /**
   * Update recently viewed trips (session-based for quick access)
   */
  private updateRecentlyViewed(
    tripId: string, 
    title?: string, 
    destination?: string
  ): void {
    if (!tripId || !title) return
    
    const key = 'wanderplan_recent_trips'
    
    try {
      const stored = sessionStorage.getItem(key)
      const recent = stored ? JSON.parse(stored) : []
      
      // Remove if already exists
      const filtered = recent.filter((r: any) => r.tripId !== tripId)
      
      // Add at the beginning
      filtered.unshift({
        tripId,
        title,
        destination,
        timestamp: Date.now()
      })
      
      // Keep only recent items
      const trimmed = filtered.slice(0, this.MAX_RECENT)
      
      sessionStorage.setItem(key, JSON.stringify(trimmed))
    } catch (error) {
      console.error('Error updating recently viewed:', error)
    }
  }

  /**
   * Get user behavior patterns
   */
  getUserPatterns(): {
    mostViewedDestinations: string[]
    preferredTimes: string[]
    averageSessionLength: number
    totalTripsViewed: number
  } {
    const activities = this.getActivities()
    
    // Count destination views
    const destinationCounts = new Map<string, number>()
    activities
      .filter(a => a.destination)
      .forEach(a => {
        const count = destinationCounts.get(a.destination!) || 0
        destinationCounts.set(a.destination!, count + 1)
      })
    
    // Get top destinations
    const mostViewedDestinations = Array.from(destinationCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([dest]) => dest)
    
    // Analyze activity times
    const hours = activities.map(a => new Date(a.timestamp).getHours())
    const timeRanges = {
      morning: hours.filter(h => h >= 6 && h < 12).length,
      afternoon: hours.filter(h => h >= 12 && h < 18).length,
      evening: hours.filter(h => h >= 18 && h < 24).length,
      night: hours.filter(h => h >= 0 && h < 6).length
    }
    
    const preferredTimes = Object.entries(timeRanges)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([time]) => time)
    
    // Calculate session metrics
    const tripViews = activities.filter(a => a.type === 'trip_view')
    const uniqueTrips = new Set(tripViews.map(a => a.tripId)).size
    
    // Estimate average session length (simplified)
    const sessions = this.identifySessions(activities)
    const avgSessionLength = sessions.length > 0
      ? sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length / 60000 // Convert to minutes
      : 0
    
    return {
      mostViewedDestinations,
      preferredTimes,
      averageSessionLength: Math.round(avgSessionLength),
      totalTripsViewed: uniqueTrips
    }
  }

  /**
   * Identify user sessions from activities
   */
  private identifySessions(activities: ActivityItem[]): Array<{ start: string; end: string; duration: number }> {
    if (activities.length === 0) return []
    
    const SESSION_GAP = 30 * 60 * 1000 // 30 minutes gap = new session
    const sessions: Array<{ start: string; end: string; duration: number }> = []
    
    let sessionStart = activities[0].timestamp
    let sessionEnd = activities[0].timestamp
    
    for (let i = 1; i < activities.length; i++) {
      const current = new Date(activities[i].timestamp).getTime()
      const previous = new Date(activities[i - 1].timestamp).getTime()
      
      if (previous - current > SESSION_GAP) {
        // New session detected
        sessions.push({
          start: sessionStart,
          end: sessionEnd,
          duration: new Date(sessionEnd).getTime() - new Date(sessionStart).getTime()
        })
        sessionStart = activities[i].timestamp
        sessionEnd = activities[i].timestamp
      } else {
        sessionEnd = activities[i].timestamp
      }
    }
    
    // Add the last session
    sessions.push({
      start: sessionStart,
      end: sessionEnd,
      duration: new Date(sessionEnd).getTime() - new Date(sessionStart).getTime()
    })
    
    return sessions
  }

  /**
   * Clear all activity data
   */
  clearActivities(): void {
    localStorage.removeItem(this.STORAGE_KEY)
    sessionStorage.removeItem('wanderplan_recent_trips')
    console.log('🧹 Activity data cleared')
  }

  /**
   * Get activity statistics
   */
  getStats(): {
    totalActivities: number
    uniqueTrips: number
    mostCommonAction: string
    lastActivity: string | null
  } {
    const activities = this.getActivities()
    
    if (activities.length === 0) {
      return {
        totalActivities: 0,
        uniqueTrips: 0,
        mostCommonAction: 'none',
        lastActivity: null
      }
    }
    
    // Count action types
    const actionCounts = new Map<string, number>()
    activities.forEach(a => {
      const count = actionCounts.get(a.type) || 0
      actionCounts.set(a.type, count + 1)
    })
    
    const mostCommonAction = Array.from(actionCounts.entries())
      .sort((a, b) => b[1] - a[1])[0][0]
    
    return {
      totalActivities: activities.length,
      uniqueTrips: new Set(activities.map(a => a.tripId)).size,
      mostCommonAction,
      lastActivity: activities[0]?.timestamp || null
    }
  }
}

// Export singleton instance
export const userActivityService = new UserActivityService()

// Export types
export type { ActivityItem, RecentlyViewed }