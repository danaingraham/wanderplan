// Direct removal function that works with localStorage
export function checkLocalTrips() {
  console.log('🔍 Checking localStorage trips...')
  
  const tripsData = localStorage.getItem('wanderplan_trips')
  
  if (!tripsData) {
    console.log('❌ No trips in localStorage')
    return []
  }
  
  try {
    const trips = JSON.parse(tripsData)
    console.log(`📦 Found ${trips.length} trip(s) in localStorage:`)
    
    trips.forEach((trip: any, index: number) => {
      const isGuide = trip.is_guide === true || trip.is_public === true
      console.log(`${index + 1}. "${trip.title}" ${isGuide ? '⚠️ GUIDE' : ''}`)
      console.log(`   ID: ${trip.id}`)
      console.log(`   Destination: ${trip.destination}`)
      console.log(`   is_public: ${trip.is_public}`)
      console.log(`   is_guide: ${trip.is_guide}`)
    })
    
    const guides = trips.filter((t: any) => t.is_guide === true || t.is_public === true)
    if (guides.length > 0) {
      console.log(`\n⚠️ Found ${guides.length} guide(s) that should be removed`)
    }
    
    return trips
  } catch (e) {
    console.error('Error parsing trips:', e)
    return []
  }
}

export function removeAllGuides() {
  console.log('🗑️ Removing all guides from localStorage...')
  
  const tripsData = localStorage.getItem('wanderplan_trips')
  
  if (!tripsData) {
    console.log('❌ No trips found')
    return false
  }
  
  try {
    const trips = JSON.parse(tripsData)
    const beforeCount = trips.length
    
    // Filter out guides
    const filtered = trips.filter((trip: any) => {
      const isGuide = trip.is_guide === true || trip.is_public === true
      if (isGuide) {
        console.log(`🎯 Removing guide: "${trip.title}"`)
        return false
      }
      return true
    })
    
    const removedCount = beforeCount - filtered.length
    
    if (removedCount === 0) {
      console.log('✅ No guides found to remove')
      return false
    }
    
    // Save filtered trips back
    localStorage.setItem('wanderplan_trips', JSON.stringify(filtered))
    console.log(`✅ Removed ${removedCount} guide(s)`)
    console.log('🔄 Please refresh the page to see changes')
    
    return true
  } catch (e) {
    console.error('Error:', e)
    return false
  }
}

export function removeById(tripId: string) {
  console.log(`🗑️ Removing trip ${tripId}...`)
  
  const tripsData = localStorage.getItem('wanderplan_trips')
  
  if (!tripsData) {
    console.log('❌ No trips found')
    return false
  }
  
  try {
    const trips = JSON.parse(tripsData)
    const beforeCount = trips.length
    
    const filtered = trips.filter((trip: any) => {
      if (trip.id === tripId) {
        console.log(`🎯 Found and removing: "${trip.title}"`)
        return false
      }
      return true
    })
    
    if (filtered.length === beforeCount) {
      console.log('❌ Trip not found')
      return false
    }
    
    localStorage.setItem('wanderplan_trips', JSON.stringify(filtered))
    console.log('✅ Trip removed')
    console.log('🔄 Please refresh the page')
    
    return true
  } catch (e) {
    console.error('Error:', e)
    return false
  }
}

// Make them immediately available
if (typeof window !== 'undefined') {
  (window as any).checkLocalTrips = checkLocalTrips;
  (window as any).removeAllGuides = removeAllGuides;
  (window as any).removeById = removeById;
  
  console.log('💣 Direct removal tools loaded:');
  console.log('  - window.checkLocalTrips() : See what\'s in localStorage');
  console.log('  - window.removeAllGuides() : Remove all guides');
  console.log('  - window.removeById(id) : Remove specific trip');
}