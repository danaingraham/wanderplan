import { supabase } from '../lib/supabase'

export async function quickProductionCheck() {
  console.log('🔍 Quick Production Check...')
  
  try {
    // Step 1: Check auth
    console.log('Step 1: Checking authentication...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('Auth error:', authError)
      return { error: 'Auth failed', details: authError }
    }
    
    if (!user) {
      console.log('❌ Not logged in')
      return { error: 'Not logged in' }
    }
    
    console.log('✅ Logged in as:', user.email, '(ID:', user.id, ')')
    
    // Step 2: Try to fetch trips
    console.log('Step 2: Fetching trips from database...')
    const { data: trips, error: fetchError } = await supabase
      .from('trips')
      .select('id, title, destination, is_guide, is_public, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (fetchError) {
      console.error('Fetch error:', fetchError)
      return { error: 'Fetch failed', details: fetchError }
    }
    
    console.log(`✅ Found ${trips?.length || 0} trips total`)
    
    if (trips && trips.length > 0) {
      console.log('Trip details:')
      trips.forEach((trip, index) => {
        console.log(`${index + 1}. "${trip.title}"`)
        console.log(`   - ID: ${trip.id}`)
        console.log(`   - Destination: ${trip.destination}`)
        console.log(`   - is_guide: ${trip.is_guide}`)
        console.log(`   - is_public: ${trip.is_public}`)
        console.log(`   - Created: ${new Date(trip.created_at).toLocaleDateString()}`)
      })
      
      // Check for guides
      const guides = trips.filter(t => t.is_guide === true || t.is_public === true)
      if (guides.length > 0) {
        console.log(`\n⚠️ Found ${guides.length} guide(s) to potentially remove:`)
        guides.forEach(g => console.log(`   - "${g.title}" (ID: ${g.id})`))
      } else {
        console.log('\n✅ No guides found')
      }
    }
    
    return { 
      success: true, 
      user: user.email,
      totalTrips: trips?.length || 0,
      guides: trips?.filter(t => t.is_guide === true || t.is_public === true) || []
    }
    
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return { error: 'Unexpected error', details: error.message }
  }
}

// Simple delete function
export async function deleteGuideById(tripId: string) {
  console.log(`🗑️ Attempting to delete trip ${tripId}...`)
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('Not logged in')
      return false
    }
    
    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', tripId)
      .eq('user_id', user.id)
    
    if (error) {
      console.error('Delete error:', error)
      return false
    }
    
    console.log('✅ Deleted successfully')
    localStorage.removeItem('wanderplan_trips')
    localStorage.removeItem('wanderplan_places')
    console.log('Cleared localStorage. Please refresh the page.')
    return true
    
  } catch (error: any) {
    console.error('Error:', error)
    return false
  }
}

if (typeof window !== 'undefined') {
  (window as any).quickProductionCheck = quickProductionCheck;
  (window as any).deleteGuideById = deleteGuideById;
  console.log('🔧 Debug tools loaded:');
  console.log('  - window.quickProductionCheck() : Check what trips exist');
  console.log('  - window.deleteGuideById(id) : Delete a specific trip');
}