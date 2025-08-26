import { useState } from 'react'
import { useUser } from '../contexts/UserContext'
import { PreferencesDisplay } from '../components/preferences/PreferencesDisplay'
import { PreferencesForm } from '../components/preferences/PreferencesForm'
import { useUserPreferences } from '../hooks/useUserPreferences'

export function Profile() {
  const { user, logout } = useUser()
  const [showEditForm, setShowEditForm] = useState(false)
  const { preferences, loading, savePreferences } = useUserPreferences()

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