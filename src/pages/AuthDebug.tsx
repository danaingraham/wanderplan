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
        // Try multiple hashing methods to ensure compatibility
        const methods = []
        
        // Method 1: New UTF-8 safe method
        try {
          const encoder = new TextEncoder()
          const data = encoder.encode(newPassword + 'wanderplan-salt-v2')
          const hash1 = btoa(String.fromCharCode(...data))
          methods.push({ name: 'UTF-8 v2', hash: hash1 })
        } catch (e) {
          methods.push({ name: 'UTF-8 v2', hash: 'Failed: ' + e })
        }
        
        // Method 2: Old simple method
        try {
          const hash2 = btoa(newPassword + 'wanderplan-salt')
          methods.push({ name: 'Simple v1', hash: hash2 })
        } catch (e) {
          methods.push({ name: 'Simple v1', hash: 'Failed: ' + e })
        }
        
        // Use the first successful method
        const successfulMethod = methods.find(m => !m.hash.startsWith('Failed'))
        if (!successfulMethod) {
          throw new Error('All hashing methods failed')
        }
        
        // Update the password with the successful hash
        storage.set(`wanderplan_password_${user.id}`, successfulMethod.hash)
        
        setTestResult(`
          Password Reset Successful!
          Email: ${user.email}
          New Password: ${newPassword}
          Method Used: ${successfulMethod.name}
          New Hash (first 30): ${successfulMethod.hash.substring(0, 30)}...
          
          All Methods Tested:
          ${methods.map(m => `${m.name}: ${m.hash.substring(0, 20)}...`).join('\n          ')}
          
          You can now login with this password.
        `)
      } catch (error: any) {
        setTestResult(`Error resetting password: ${error.message}`)
      }
    } else {
      setTestResult(`No user found with email: ${testEmail}`)
    }
  }

  const testLogin = () => {
    if (!testEmail || !testPassword) {
      setTestResult('Please enter both email and password to test')
      return
    }

    const users: any[] = storage.get('wanderplan_users') || []
    
    // Debug: Show all users
    const allEmails = users.map((u: any) => u.email)
    
    // Try different email matching approaches
    const user = users.find((u: any) => u.email.toLowerCase() === testEmail.toLowerCase())
    const userExactMatch = users.find((u: any) => u.email === testEmail)
    const userTrimmed = users.find((u: any) => u.email.toLowerCase().trim() === testEmail.toLowerCase().trim())
    
    if (!user && !userExactMatch && !userTrimmed) {
      setTestResult(`
        No user found with email: "${testEmail}"
        Email length: ${testEmail.length} characters
        
        All registered users (${users.length} total):
        ${allEmails.map((e: string, i: number) => `${i + 1}. "${e}" (${e.length} chars)`).join('\n        ')}
        
        Debug Info:
        - Your entered email: "${testEmail}"
        - Trimmed version: "${testEmail.trim()}"
        - Lowercase: "${testEmail.toLowerCase()}"
        - Has spaces: ${testEmail !== testEmail.trim() ? 'YES - FOUND SPACES!' : 'No'}
        
        Try:
        1. Copy email from "Find User" result
        2. Check for invisible characters
        3. Retype email manually
      `)
      return
    }
    
    // Use whichever user was found
    const foundUser = user || userExactMatch || userTrimmed

    const storedHash = storage.get(`wanderplan_password_${foundUser.id}`) as string
    
    // Try all possible hash methods to see which one matches
    const attempts = []
    
    // Method 1: New UTF-8 safe method
    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(testPassword + 'wanderplan-salt-v2')
      const hash1 = btoa(String.fromCharCode(...data))
      attempts.push({
        method: 'UTF-8 v2',
        hash: hash1,
        matches: hash1 === storedHash
      })
    } catch (e: any) {
      attempts.push({
        method: 'UTF-8 v2',
        hash: 'Error: ' + e.message,
        matches: false
      })
    }
    
    // Method 2: Old simple method
    try {
      const hash2 = btoa(testPassword + 'wanderplan-salt')
      attempts.push({
        method: 'Simple v1',
        hash: hash2,
        matches: hash2 === storedHash
      })
    } catch (e: any) {
      attempts.push({
        method: 'Simple v1',
        hash: 'Error: ' + e.message,
        matches: false
      })
    }
    
    // Method 3: Direct comparison (in case password was stored unhashed somehow)
    attempts.push({
      method: 'Direct',
      hash: testPassword,
      matches: testPassword === storedHash
    })
    
    const matchingMethod = attempts.find(a => a.matches)
    
    setTestResult(`
      Login Test Results:
      Email: ${foundUser.email}
      Password Entered: "${testPassword}"
      Password Length: ${testPassword.length}
      
      Stored Hash (first 30): ${storedHash?.substring(0, 30)}...
      Stored Hash Length: ${storedHash?.length || 0}
      
      ${matchingMethod ? '✅ LOGIN WOULD SUCCEED' : '❌ LOGIN WOULD FAIL'}
      ${matchingMethod ? `Matching Method: ${matchingMethod.method}` : 'No matching method found'}
      
      All Methods Tested:
      ${attempts.map(a => `
        ${a.method}: ${a.matches ? '✅ MATCH' : '❌ NO MATCH'}
        Generated: ${typeof a.hash === 'string' ? a.hash.substring(0, 30) + '...' : a.hash}
      `).join('')}
      
      Debugging Info:
      - Check for trailing spaces in password
      - Check for autocapitalization on mobile
      - Try typing password in notes app first, then copy/paste
    `)
  }

  const refreshData = () => {
    // Force re-read of localStorage
    window.location.reload()
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Authentication Debug Page</h1>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            🔄 Refresh Data
          </button>
        </div>
        
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

          {/* Test Login */}
          <div className="mb-6 border-2 border-blue-500 p-4 rounded bg-blue-50">
            <h3 className="font-medium mb-2 text-blue-700">🔑 Test Login (Use This First!)</h3>
            <p className="text-sm text-gray-600 mb-3">Test if your email/password combination would work</p>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Email address"
              className="w-full px-3 py-2 border rounded mb-2"
            />
            <input
              type="text"
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
              placeholder="Password to test"
              className="w-full px-3 py-2 border rounded mb-2"
            />
            <button
              onClick={testLogin}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
            >
              Test Login
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