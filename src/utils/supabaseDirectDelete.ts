import { supabase } from '../lib/supabase'

// Use the existing supabase client that's already authenticated
export async function listSupabaseTrips() {
  console.log('📋 Listing trips from Supabase...')
  
  try {
    // Don't check auth - assume we're already logged in since the app is working
    const { data: trips, error } = await supabase
      .from('trips')
      .select('id, title, destination, is_guide, is_public, created_at, user_id')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching trips:', error)
      return null
    }
    
    if (!trips || trips.length === 0) {
      console.log('No trips found')
      return []
    }
    
    console.log(`Found ${trips.length} trip(s):`)
    trips.forEach((trip, index) => {
      const isGuide = trip.is_guide === true || trip.is_public === true
      console.log(`${index + 1}. "${trip.title}" ${isGuide ? '⚠️ GUIDE' : ''}`)
      console.log(`   ID: ${trip.id}`)
      console.log(`   is_guide: ${trip.is_guide}, is_public: ${trip.is_public}`)
    })
    
    const guides = trips.filter(t => t.is_guide === true || t.is_public === true)
    if (guides.length > 0) {
      console.log(`\n⚠️ Found ${guides.length} guide(s) to remove`)
    }
    
    return trips
  } catch (error: any) {
    console.error('Error:', error)
    return null
  }
}

export async function deleteSupabaseGuide(tripId: string) {
  console.log(`🗑️ Deleting trip ${tripId} from Supabase...`)
  
  try {
    // First check if it exists
    const { data: trip, error: fetchError } = await supabase
      .from('trips')
      .select('title')
      .eq('id', tripId)
      .single()
    
    if (fetchError || !trip) {
      console.error('Trip not found or error:', fetchError)
      return false
    }
    
    console.log(`Found trip: "${trip.title}"`)
    
    // Delete it
    const { error: deleteError } = await supabase
      .from('trips')
      .delete()
      .eq('id', tripId)
    
    if (deleteError) {
      console.error('Delete error:', deleteError)
      return false
    }
    
    console.log('✅ Deleted from Supabase')
    
    // Clear localStorage cache
    localStorage.removeItem('wanderplan_trips')
    localStorage.removeItem('wanderplan_places')
    
    console.log('✅ Cleared localStorage cache')
    console.log('🔄 Please refresh the page')
    
    return true
  } catch (error: any) {
    console.error('Error:', error)
    return false
  }
}

export async function deleteAllSupabaseGuides() {
  console.log('🗑️ Deleting all guides from Supabase...')
  
  try {
    // Get all trips with guide flags
    const { data: guides, error: fetchError } = await supabase
      .from('trips')
      .select('id, title')
      .or('is_guide.eq.true,is_public.eq.true')
    
    if (fetchError) {
      console.error('Error fetching guides:', fetchError)
      return false
    }
    
    if (!guides || guides.length === 0) {
      console.log('No guides found to delete')
      return false
    }
    
    console.log(`Found ${guides.length} guide(s) to delete:`)
    guides.forEach(g => console.log(`  - "${g.title}" (${g.id})`))
    
    if (!confirm(`Delete ${guides.length} guide(s)? This cannot be undone!`)) {
      console.log('Cancelled')
      return false
    }
    
    // Delete them all
    const ids = guides.map(g => g.id)
    const { error: deleteError } = await supabase
      .from('trips')
      .delete()
      .in('id', ids)
    
    if (deleteError) {
      console.error('Delete error:', deleteError)
      return false
    }
    
    console.log(`✅ Deleted ${guides.length} guide(s) from Supabase`)
    
    // Clear localStorage cache
    localStorage.removeItem('wanderplan_trips')
    localStorage.removeItem('wanderplan_places')
    
    console.log('🔄 Please refresh the page')
    
    return true
  } catch (error: any) {
    console.error('Error:', error)
    return false
  }
}

if (typeof window !== 'undefined') {
  (window as any).listSupabaseTrips = listSupabaseTrips;
  (window as any).deleteSupabaseGuide = deleteSupabaseGuide;
  (window as any).deleteAllSupabaseGuides = deleteAllSupabaseGuides;
  
  console.log('🗄️ Supabase direct tools loaded:');
  console.log('  - window.listSupabaseTrips() : List all trips in Supabase');
  console.log('  - window.deleteSupabaseGuide(id) : Delete specific trip from Supabase');
  console.log('  - window.deleteAllSupabaseGuides() : Delete all guides from Supabase');
}