import { createClient } from '@supabase/supabase-js'

// Separate Supabase client for database operations
// This uses default settings without the auth restrictions

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

console.log('🗄️ Creating separate DB client with default settings');

// Create client with DEFAULT settings (no custom auth config)
export const supabaseDb = createClient(
  supabaseUrl,
  supabaseAnonKey
);

// Export for testing
export async function testDbConnection() {
  try {
    console.log('Testing DB connection...');
    const { data, error } = await supabaseDb
      .from('user_preferences')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('DB test error:', error);
      return false;
    }
    
    console.log('DB test success:', data);
    return true;
  } catch (err) {
    console.error('DB test exception:', err);
    return false;
  }
}