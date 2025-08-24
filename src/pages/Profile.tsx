import { useState } from 'react'
import { useUser } from '../contexts/UserContext'
import { PreferencesDisplay } from '../components/preferences/PreferencesDisplay'
import { PreferencesFetchTest } from '../components/preferences/PreferencesFetchTest'
import { PreferencesForm } from '../components/preferences/PreferencesForm'
import { FixAccommodationData } from '../components/preferences/FixAccommodationData'
import { useUserPreferences } from '../hooks/useUserPreferences'
import { supabaseDb } from '../lib/supabaseDb'

export function Profile() {
  const { user, logout } = useUser()
  const [showEditForm, setShowEditForm] = useState(false)
  const { preferences, loading, savePreferences } = useUserPreferences()
  const [dbTestResult, setDbTestResult] = useState<any>(null)
  const [dbTestLoading, setDbTestLoading] = useState(false)

  const testDatabase = async () => {
    if (!user) return;
    
    setDbTestLoading(true);
    setDbTestResult(null);
    
    try {
      console.log('Testing DB with user:', user.id);
      
      const testData = {
        user_id: user.id,
        travel_pace: 'moderate',
        budget_range: { min: 100, max: 300 },
        accommodation_style: [{ style: 'hotel', confidence: 1.0, last_seen: new Date().toISOString(), count: 1 }]
      };
      
      // Test with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout after 5 seconds')), 5000);
      });
      
      const insertPromise = supabaseDb
        .from('user_preferences')
        .upsert(testData)
        .select()
        .single();
      
      const { data, error } = await Promise.race([
        insertPromise,
        timeoutPromise
      ]).catch(err => ({ data: null, error: err })) as any;
      
      if (error) {
        setDbTestResult({ success: false, error: error.message || error });
      } else {
        setDbTestResult({ success: true, data });
      }
    } catch (err: any) {
      setDbTestResult({ success: false, error: err.message });
    } finally {
      setDbTestLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600">Manage your account and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Account Information */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-6">Account Information</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={user?.full_name || ''}
                className="input-field"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                className="input-field"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <input
                type="text"
                value={user?.role || ''}
                className="input-field"
                readOnly
              />
            </div>
          </div>
        </div>

        {/* Travel Preferences */}
        <div className="card">
          {!showEditForm ? (
            <>
              <PreferencesDisplay 
                preferences={preferences} 
                loading={loading} 
              />
              <button
                onClick={() => setShowEditForm(true)}
                className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
              >
                Edit Preferences
              </button>
            </>
          ) : (
            <>
              <PreferencesForm
                preferences={preferences}
                onSave={async (newPrefs) => {
                  await savePreferences(newPrefs);
                  setShowEditForm(false);
                }}
                loading={loading}
              />
              <button
                onClick={() => setShowEditForm(false)}
                className="mt-4 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </>
          )}
          
          {/* Fix tool for accommodation data */}
          {process.env.NODE_ENV === 'development' && <FixAccommodationData />}
          
          {/* Temporary test component - remove in production */}
          {process.env.NODE_ENV === 'development' && <PreferencesFetchTest />}
          
          {/* Database test */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-900 mb-2">Database Test (Temporary)</h3>
            <button
              onClick={testDatabase}
              disabled={dbTestLoading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {dbTestLoading ? 'Testing...' : 'Test Database'}
            </button>
            {dbTestResult && (
              <div className={`mt-2 p-2 rounded ${dbTestResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
                <pre className="text-sm">
                  {JSON.stringify(dbTestResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Logout Button */}
        <div className="card">
          <button
            onClick={logout}
            className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}