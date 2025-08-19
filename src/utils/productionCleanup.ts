import { supabase } from '../lib/supabase'

/**
 * Production cleanup function to remove all guides from the database
 * Run this in the browser console on the production site
 */
export async function cleanupProductionGuides() {
  console.log('🧹 Starting production guide cleanup...')
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (!user) {
      console.error('❌ You must be logged in to clean up guides')
      return { success: false, message: 'Not logged in' }
    }
    
    console.log(`✅ Logged in as: ${user.email}`)
    
    // First, let's see what trips exist
    const { data: allTrips, error: fetchError } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', user.id)
    
    if (fetchError) {
      console.error('❌ Error fetching trips:', fetchError)
      return { success: false, message: fetchError.message }
    }
    
    console.log(`📊 Found ${allTrips?.length || 0} total trips`)
    
    // Identify guides (trips with is_guide=true or is_public=true)
    const guides = allTrips?.filter(trip => 
      trip.is_guide === true || 
      trip.is_public === true ||
      trip.title?.toLowerCase().includes('guide')
    ) || []
    
    if (guides.length === 0) {
      console.log('✅ No guides found in production')
      return { success: true, message: 'No guides to clean up', deletedCount: 0 }
    }
    
    console.log(`⚠️ Found ${guides.length} guide(s) to remove:`)
    guides.forEach(g => {
      console.log(`  - "${g.title}" (id: ${g.id})`)
      console.log(`    is_guide: ${g.is_guide}, is_public: ${g.is_public}`)
    })
    
    // Confirm deletion
    if (!window.confirm(`Delete ${guides.length} guide(s) from production? This cannot be undone!`)) {
      console.log('❌ Cleanup cancelled')
      return { success: false, message: 'Cancelled by user' }
    }
    
    // Delete the guides
    const guideIds = guides.map(g => g.id)
    const { error: deleteError } = await supabase
      .from('trips')
      .delete()
      .in('id', guideIds)
      .eq('user_id', user.id)
    
    if (deleteError) {
      console.error('❌ Error deleting guides:', deleteError)
      return { success: false, message: deleteError.message }
    }
    
    // Clear localStorage to force refresh
    localStorage.removeItem('wanderplan_trips')
    localStorage.removeItem('wanderplan_places')
    
    console.log(`✅ Successfully deleted ${guides.length} guide(s) from production!`)
    console.log('🔄 Please refresh the page to see the changes')
    
    return { 
      success: true, 
      message: `Deleted ${guides.length} guide(s)`, 
      deletedCount: guides.length,
      deletedGuides: guides.map(g => ({ id: g.id, title: g.title }))
    }
    
  } catch (error: any) {
    console.error('❌ Unexpected error:', error)
    return { success: false, message: error.message }
  }
}

// Make it available globally when loaded
if (typeof window !== 'undefined') {
  (window as any).cleanupProductionGuides = cleanupProductionGuides
  console.log('🧹 Production cleanup loaded. Run: window.cleanupProductionGuides()')
}