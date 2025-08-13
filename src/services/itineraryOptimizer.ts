import type { Place } from '../types'

interface DayPlan {
  day: number
  places: Place[]
  totalDistance: number
  categoryBalance: number
  timeFlowScore: number
}

class ItineraryOptimizer {
  
  // Calculate distance between two points using Haversine formula
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1)
    const dLon = this.deg2rad(lon2 - lon1)
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c // Distance in kilometers
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180)
  }

  // Calculate category variety score (higher = more variety, avoid consecutive same categories)
  private calculateCategoryBalance(places: Place[]): number {
    if (places.length <= 1) return 1
    
    let varietyScore = 0
    let consecutiveSameCategory = 0
    
    for (let i = 1; i < places.length; i++) {
      if (places[i].category === places[i-1].category) {
        consecutiveSameCategory++
        // Heavy penalty for consecutive restaurants or shops
        if (places[i].category === 'restaurant' || places[i].category === 'shop') {
          varietyScore -= 0.5
        } else {
          varietyScore -= 0.2
        }
      } else {
        varietyScore += 0.3 // Reward category changes
        consecutiveSameCategory = 0
      }
    }
    
    return Math.max(0, varietyScore / places.length)
  }

  // Calculate time flow score (logical progression through the day)
  private calculateTimeFlowScore(places: Place[]): number {
    let score = 1
    
    for (let i = 0; i < places.length; i++) {
      const place = places[i]
      const time = this.parseTime(place.start_time || '09:00')
      
      // Morning activities (6-11 AM): parks, attractions
      if (time >= 6 && time <= 11) {
        if (place.category === 'attraction' || place.category === 'activity') {
          score += 0.2
        }
      }
      
      // Lunch time (11 AM - 2 PM): restaurants, cafes
      if (time >= 11 && time <= 14) {
        if (place.category === 'restaurant' || place.category === 'cafe') {
          score += 0.3
        }
      }
      
      // Afternoon (2-6 PM): shopping, museums, activities
      if (time >= 14 && time <= 18) {
        if (place.category === 'shop' || place.category === 'attraction') {
          score += 0.2
        }
      }
      
      // Evening (6-10 PM): dinner, bars, entertainment
      if (time >= 18 && time <= 22) {
        if (place.category === 'restaurant' || place.category === 'bar') {
          score += 0.3
        }
      }
      
      // Penalize restaurants at wrong times
      if (place.category === 'restaurant') {
        if (time < 11 || (time > 14 && time < 17)) {
          score -= 0.4 // Strong penalty for restaurants at odd hours
        }
      }
    }
    
    return Math.max(0, score / places.length)
  }

  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours + minutes / 60
  }

  // Calculate total travel distance for a day
  private calculateTotalDistance(places: Place[]): number {
    if (places.length <= 1) return 0
    
    let totalDistance = 0
    for (let i = 1; i < places.length; i++) {
      const prev = places[i-1]
      const curr = places[i]
      
      if (prev.latitude && prev.longitude && curr.latitude && curr.longitude) {
        totalDistance += this.calculateDistance(
          prev.latitude, prev.longitude,
          curr.latitude, curr.longitude
        )
      }
    }
    
    return totalDistance
  }

  // Score a day plan based on multiple factors
  private scoreDayPlan(places: Place[]): DayPlan {
    const totalDistance = this.calculateTotalDistance(places)
    const categoryBalance = this.calculateCategoryBalance(places)
    const timeFlowScore = this.calculateTimeFlowScore(places)
    
    return {
      day: places[0]?.day || 1,
      places,
      totalDistance,
      categoryBalance,
      timeFlowScore
    }
  }

  // Optimize the order of places within a single day
  optimizeDayOrder(places: Place[]): Place[] {
    if (places.length <= 2) return places
    
    // Use a simple greedy approach with multi-objective scoring
    const optimizedPlaces: Place[] = []
    const remainingPlaces = [...places]
    
    // Always start with the first place (often accommodation or first planned activity)
    optimizedPlaces.push(remainingPlaces.shift()!)
    
    while (remainingPlaces.length > 0) {
      let bestIndex = 0
      let bestScore = -Infinity
      
      for (let i = 0; i < remainingPlaces.length; i++) {
        const candidate = remainingPlaces[i]
        const tempOrder = [...optimizedPlaces, candidate]
        const tempPlan = this.scoreDayPlan(tempOrder)
        
        // Multi-objective score
        const score = 
          (1 / (tempPlan.totalDistance + 1)) * 0.4 +  // Distance weight: 40%
          tempPlan.categoryBalance * 0.3 +             // Category variety: 30%
          tempPlan.timeFlowScore * 0.3                 // Time appropriateness: 30%
        
        if (score > bestScore) {
          bestScore = score
          bestIndex = i
        }
      }
      
      optimizedPlaces.push(remainingPlaces.splice(bestIndex, 1)[0])
    }
    
    // Update the order property
    optimizedPlaces.forEach((place, index) => {
      place.order = index
    })
    
    return optimizedPlaces
  }

  // Optimize all days in a trip
  optimizeTripItinerary(places: Place[]): Place[] {
    const placesByDay = places.reduce((acc, place) => {
      if (!acc[place.day]) acc[place.day] = []
      acc[place.day].push(place)
      return acc
    }, {} as Record<number, Place[]>)
    
    const optimizedPlaces: Place[] = []
    
    Object.keys(placesByDay).forEach(dayStr => {
      const day = parseInt(dayStr)
      const dayPlaces = placesByDay[day]
      const optimizedDayPlaces = this.optimizeDayOrder(dayPlaces)
      optimizedPlaces.push(...optimizedDayPlaces)
    })
    
    return optimizedPlaces
  }

  // Analyze and provide recommendations for itinerary improvements
  analyzeItinerary(places: Place[]): {
    overallScore: number
    recommendations: string[]
    dayScores: DayPlan[]
  } {
    const placesByDay = places.reduce((acc, place) => {
      if (!acc[place.day]) acc[place.day] = []
      acc[place.day].push(place)
      return acc
    }, {} as Record<number, Place[]>)

    const dayScores: DayPlan[] = []
    const recommendations: string[] = []
    let totalScore = 0

    Object.values(placesByDay).forEach(dayPlaces => {
      const dayPlan = this.scoreDayPlan(dayPlaces)
      dayScores.push(dayPlan)
      totalScore += dayPlan.categoryBalance + dayPlan.timeFlowScore + (1 / (dayPlan.totalDistance + 1))

      // Generate recommendations
      if (dayPlan.totalDistance > 20) {
        recommendations.push(`Day ${dayPlan.day}: Consider reducing travel distance (${dayPlan.totalDistance.toFixed(1)}km total)`)
      }
      
      if (dayPlan.categoryBalance < 0.3) {
        recommendations.push(`Day ${dayPlan.day}: Mix up activity types to avoid repetitive experiences`)
      }
      
      if (dayPlan.timeFlowScore < 0.5) {
        recommendations.push(`Day ${dayPlan.day}: Adjust timing - some activities might be scheduled at odd hours`)
      }
    })

    const overallScore = totalScore / Object.keys(placesByDay).length

    return {
      overallScore,
      recommendations,
      dayScores
    }
  }
}

export const itineraryOptimizer = new ItineraryOptimizer()