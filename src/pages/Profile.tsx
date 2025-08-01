import { useUser } from '../contexts/UserContext'

export function Profile() {
  const { user } = useUser()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
        <p className="text-gray-600">Manage your account and preferences</p>
      </div>
      
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={user?.full_name || ''}
              className="input-field"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              className="input-field"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <input
              type="text"
              value={user?.role || ''}
              className="input-field"
              readOnly
            />
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Coming Soon</h3>
          <p className="text-gray-600">
            Profile editing, notification settings, privacy controls, and account management
            features will be available soon.
          </p>
        </div>
      </div>
    </div>
  )
}