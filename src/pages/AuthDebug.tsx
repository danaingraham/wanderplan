import { useState, useEffect } from 'react'
import { storage } from '../utils/storage'
import { useUser } from '../contexts/UserContext'

export function AuthDebug() {
  const { user } = useUser()
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [testEmail, setTestEmail] = useState('')
  const [testPassword, setTestPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [testResult, setTestResult] = useState('')

  useEffect(() => {
    // Gather debug information
    const users: any[] = storage.get('wanderplan_users') || []
    const authToken = storage.get('authToken')
    
    const info = {
      currentUser: user?.email || 'Not logged in',
      registeredUsers: users.map((u: any) => ({
        email: u.email,
        id: u.id,
        hasPassword: !!storage.get(`wanderplan_password_${u.id}`),
        passwordHash: (storage.get(`wanderplan_password_${u.id}`) as string)?.substring(0, 20) + '...',
        authProvider: u.auth_provider || 'email',
        createdDate: u.created_date
      })),
      authToken: authToken ? 'Present' : 'Missing',
      emailConfig: {
        hasResendKey: !!(import.meta.env.VITE_RESEND_API_KEY),
        resendKeyLength: import.meta.env.VITE_RESEND_API_KEY?.length || 0
      },
      localStorage: {
        totalKeys: Object.keys(localStorage).length,
        wanderplanKeys: Object.keys(localStorage).filter(k => k.includes('wanderplan')).length
      },
      browser: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        isMobile: /Mobile|Android|iPhone/i.test(navigator.userAgent)
      }
    }
    
    setDebugInfo(info)
  }, [user])

  const testPasswordHash = () => {
    if (!testPassword) {
      setTestResult('Please enter a password to test')
      return
    }

    try {
      // Test old hash method
      const oldHash = btoa(testPassword + 'wanderplan-salt')
      
      // Test new hash method
      const encoder = new TextEncoder()
      const data = encoder.encode(testPassword + 'wanderplan-salt-v2')
      const newHash = btoa(String.fromCharCode(...data))
      
      setTestResult(`
        Password: "${testPassword}"
        Length: ${testPassword.length}
        Old Hash (first 20 chars): ${oldHash.substring(0, 20)}...
        New Hash (first 20 chars): ${newHash.substring(0, 20)}...
      `)
    } catch (error: any) {
      setTestResult(`Error hashing password: ${error.message}`)
    }
  }

  const findUserByEmail = () => {
    if (!testEmail) {
      setTestResult('Please enter an email to search')
      return
    }

    const users: any[] = storage.get('wanderplan_users') || []
    const user = users.find((u: any) => u.email.toLowerCase() === testEmail.toLowerCase())
    
    if (user) {
      const passwordHash = storage.get(`wanderplan_password_${user.id}`) as string
      setTestResult(`
        User Found:
        Email: ${user.email}
        ID: ${user.id}
        Has Password: ${passwordHash ? 'Yes' : 'No'}
        Password Hash (first 20): ${passwordHash?.substring(0, 20) || 'N/A'}...
        Auth Provider: ${user.auth_provider || 'email'}
      `)
    } else {
      setTestResult(`No user found with email: ${testEmail}`)
    }
  }

  const resetUserPassword = () => {
    if (!testEmail || !newPassword) {
      setTestResult('Please enter both email and new password')
      return
    }

    const users: any[] = storage.get('wanderplan_users') || []
    const user = users.find((u: any) => u.email.toLowerCase() === testEmail.toLowerCase())
    
    if (user) {
      try {
        // Hash the new password using the new method
        const encoder = new TextEncoder()
        const data = encoder.encode(newPassword + 'wanderplan-salt-v2')
        const hashedPassword = btoa(String.fromCharCode(...data))
        
        // Update the password
        storage.set(`wanderplan_password_${user.id}`, hashedPassword)
        
        setTestResult(`
          Password Reset Successful!
          Email: ${user.email}
          New Password: ${newPassword}
          New Hash (first 20): ${hashedPassword.substring(0, 20)}...
          
          You can now login with this password.
        `)
      } catch (error: any) {
        setTestResult(`Error resetting password: ${error.message}`)
      }
    } else {
      setTestResult(`No user found with email: ${testEmail}`)
    }
  }

  const clearAllData = () => {
    if (window.confirm('This will delete ALL Wanderplan data. Are you sure?')) {
      const keys = Object.keys(localStorage).filter(k => k.includes('wanderplan'))
      keys.forEach(k => localStorage.removeItem(k))
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Authentication Debug Page</h1>
        
        {/* Current Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Current Status</h2>
          <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        {/* Test Tools */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Test Tools</h2>
          
          {/* Password Hash Test */}
          <div className="mb-6">
            <h3 className="font-medium mb-2">Test Password Hashing</h3>
            <input
              type="text"
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
              placeholder="Enter password to test"
              className="w-full px-3 py-2 border rounded mb-2"
            />
            <button
              onClick={testPasswordHash}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Test Hash
            </button>
          </div>

          {/* Find User */}
          <div className="mb-6">
            <h3 className="font-medium mb-2">Find User by Email</h3>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Enter email to search"
              className="w-full px-3 py-2 border rounded mb-2"
            />
            <button
              onClick={findUserByEmail}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Find User
            </button>
          </div>

          {/* Manual Password Reset */}
          <div className="mb-6">
            <h3 className="font-medium mb-2">Manual Password Reset</h3>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Email address"
              className="w-full px-3 py-2 border rounded mb-2"
            />
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              className="w-full px-3 py-2 border rounded mb-2"
            />
            <button
              onClick={resetUserPassword}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Reset Password
            </button>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">Test Result:</h3>
              <pre className="text-xs bg-yellow-50 p-4 rounded">
                {testResult}
              </pre>
            </div>
          )}

          {/* Danger Zone */}
          <div className="border-t pt-4">
            <h3 className="font-medium mb-2 text-red-600">Danger Zone</h3>
            <button
              onClick={clearAllData}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear All Wanderplan Data
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">How to Use This Page</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Check "Current Status" to see all registered users and their info</li>
            <li>Use "Find User by Email" to check if your account exists</li>
            <li>Use "Test Password Hashing" to see how passwords are being encoded</li>
            <li>If you see your email but can't login, try the "Clear All Data" option and re-register</li>
            <li>Screenshot this page on mobile to share debug info</li>
          </ol>
        </div>
      </div>
    </div>
  )
}