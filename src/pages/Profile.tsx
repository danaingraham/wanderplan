import { useState } from 'react'
import { useUser } from '../contexts/UserContext'
import { User, Bell, Shield, CreditCard } from 'lucide-react'
import { cn } from '../utils/cn'
import { PreferencesDisplay } from '../components/preferences/PreferencesDisplay'
import { PreferencesFetchTest } from '../components/preferences/PreferencesFetchTest'
import { PreferencesForm } from '../components/preferences/PreferencesForm'
import { useUserPreferences } from '../hooks/useUserPreferences'

type SettingsTab = 'profile' | 'notifications' | 'security' | 'billing'

export function Profile() {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [showEditForm, setShowEditForm] = useState(false)
  const { preferences, loading, savePreferences } = useUserPreferences()

  const tabs = [
    { id: 'profile' as SettingsTab, label: 'Profile', icon: User },
    { id: 'notifications' as SettingsTab, label: 'Notifications', icon: Bell },
    { id: 'security' as SettingsTab, label: 'Security', icon: Shield },
    { id: 'billing' as SettingsTab, label: 'Billing', icon: CreditCard },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Desktop Header */}
      <div className="hidden md:block mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="md:w-64">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                    activeTab === tab.id
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          {activeTab === 'profile' && (
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
              
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Editing</h3>
                <p className="text-gray-600">
                  Profile editing features will be available soon. You'll be able to update your
                  name, add a profile photo, and manage your personal information.
                </p>
              </div>
            </div>
          )}

          {/* Add preferences section at the bottom of profile tab */}
          {activeTab === 'profile' && (
            <div className="mt-6">
              {!showEditForm ? (
                <>
                  <PreferencesDisplay />
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
              
              {/* Temporary test component - remove in production */}
              {process.env.NODE_ENV === 'development' && <PreferencesFetchTest />}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>
              <p className="text-gray-600">
                Notification settings will be available soon. You'll be able to manage email
                notifications, trip reminders, and collaboration alerts.
              </p>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-6">Security Settings</h2>
              <p className="text-gray-600">
                Security features will be available soon. You'll be able to change your password,
                enable two-factor authentication, and manage active sessions.
              </p>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-6">Billing & Subscription</h2>
              <p className="text-gray-600">
                Billing management will be available soon. You'll be able to view your subscription,
                update payment methods, and download invoices.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}