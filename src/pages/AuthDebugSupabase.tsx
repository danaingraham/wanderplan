import { useState, useEffect } from 'react'
import { useUser } from '../contexts/UserContext'
import { supabase } from '../lib/supabase'
import { storage } from '../utils/storage'

export function AuthDebugSupabase() {
  const { user, isUsingSupabase } = useUser() as any
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [testEmail, setTestEmail] = useState('')
  const [testPassword, setTestPassword] = useState('')
  const [testResult, setTestResult] = useState('')
  const [supabaseUsers, setSupabaseUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadDebugInfo()
  }, [user])

  const loadDebugInfo = async () => {
    // Check Supabase configuration
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    const isSupabaseConfigured = supabaseUrl && supabaseKey && supabaseUrl !== 'https://your-project-id.supabase.co'

    // Get Supabase session
    let supabaseSession = null
    let supabaseProfiles: any[] = []
    
    if (isSupabaseConfigured) {
      const { data: { session } } = await supabase.auth.getSession()
      supabaseSession = session
      
      // Try to get profiles (might fail due to RLS)
      const { data: profiles } = await supabase.from('profiles').select('*')
      if (profiles) {
        supabaseProfiles = profiles
      }
    }

    // Get localStorage data for comparison
    const localUsers: any[] = storage.get('wanderplan_users') || []
    const authToken = storage.get('authToken')
    
    const info = {
      authMode: isSupabaseConfigured ? 'SUPABASE' : 'LOCALSTORAGE',
      currentUser: user?.email || 'Not logged in',
      supabase: {
        configured: isSupabaseConfigured,
        url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'Not configured',
        hasSession: !!supabaseSession,
        sessionUser: supabaseSession?.user?.email || 'No session',
        profilesCount: supabaseProfiles.length
      },
      localStorage: {
        authToken: authToken ? 'Present' : 'Missing',
        userCount: localUsers.length,
        users: localUsers.map((u: any) => u.email)
      },
      browser: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        isMobile: /Mobile|Android|iPhone/i.test(navigator.userAgent)
      }
    }
    
    setDebugInfo(info)
    setSupabaseUsers(supabaseProfiles)
  }

  const testSupabaseLogin = async () => {
    if (!testEmail || !testPassword) {
      setTestResult('Please enter both email and password')
      return
    }

    setIsLoading(true)
    setTestResult('Testing login...')

    try {
      // Test Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      })

      if (error) {
        setTestResult(`
❌ Supabase Login Failed
Error: ${error.message}
Status: ${error.status}

Common issues:
- Email not verified (check your inbox)
- Wrong password
- Account doesn't exist
- Account created with different auth method (Google, etc.)

Debug info:
- Email entered: "${testEmail}"
- Email length: ${testEmail.length} chars
- Has spaces: ${testEmail !== testEmail.trim() ? 'YES' : 'No'}
`)
      } else if (data.user) {
        setTestResult(`
✅ Supabase Login Successful!
User ID: ${data.user.id}
Email: ${data.user.email}
Email Verified: ${data.user.email_confirmed_at ? 'Yes' : 'No'}
Created: ${data.user.created_at}
Provider: ${data.user.app_metadata?.provider || 'email'}

Session Token: ${data.session?.access_token?.substring(0, 20)}...

This means your credentials are correct!
If the app isn't logging you in, there might be an issue with the auth state management.
`)
      }
    } catch (err: any) {
      setTestResult(`
❌ Unexpected Error
${err.message}
`)
    } finally {
      setIsLoading(false)
    }
  }

  const checkSupabaseUser = async () => {
    if (!testEmail) {
      setTestResult('Please enter an email to check')
      return
    }

    setIsLoading(true)
    setTestResult('Checking Supabase database...')

    try {
      // This will only work if you're logged in as an admin
      // Regular users can't query other users for privacy
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', testEmail.toLowerCase())

      if (error) {
        // Try to check if we can at least query profiles table
        const { error: tableError } = await supabase
          .from('profiles')
          .select('count')
          .limit(1)

        if (tableError) {
          setTestResult(`
⚠️ Cannot Query User Database
This is normal - Supabase Row Level Security prevents querying other users.

To check if your account exists:
1. Try the "Test Login" function instead
2. Check your email for verification link
3. Try logging in through the main app

The profiles table exists and RLS is working correctly.
`)
        } else {
          setTestResult(`
No user found with email: ${testEmail}
(Note: You can only see your own profile due to security policies)
`)
        }
      } else if (profiles && profiles.length > 0) {
        setTestResult(`
✅ User Found in Supabase!
Email: ${profiles[0].email}
ID: ${profiles[0].id}
Name: ${profiles[0].full_name || 'Not set'}
Created: ${profiles[0].created_at}
`)
      } else {
        setTestResult(`
No user found with email: ${testEmail}
This email is not registered in Supabase.
`)
      }
    } catch (err: any) {
      setTestResult(`Error checking user: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshData = () => {
    loadDebugInfo()
    setTestResult('')
  }

  const signOutSupabase = async () => {
    setIsLoading(true)
    const { error } = await supabase.auth.signOut()
    if (error) {
      setTestResult(`Sign out failed: ${error.message}`)
    } else {
      setTestResult('Signed out successfully')
      loadDebugInfo()
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Supabase Auth Debug</h1>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            🔄 Refresh
          </button>
        </div>
        
        {/* Current Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Current Status</h2>
          <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        {/* Supabase Test Tools */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Supabase Test Tools</h2>
          
          {/* Test Login */}
          <div className="mb-6 border-2 border-blue-500 p-4 rounded bg-blue-50">
            <h3 className="font-medium mb-2 text-blue-700">🔑 Test Supabase Login</h3>
            <p className="text-sm text-gray-600 mb-3">Test if your credentials work with Supabase</p>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Email address"
              className="w-full px-3 py-2 border rounded mb-2"
              autoCapitalize="off"
              autoCorrect="off"
            />
            <input
              type="password"
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-3 py-2 border rounded mb-2"
              autoCapitalize="off"
              autoCorrect="off"
            />
            <button
              onClick={testSupabaseLogin}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : 'Test Login'}
            </button>
          </div>

          {/* Check User */}
          <div className="mb-6">
            <h3 className="font-medium mb-2">Check if User Exists</h3>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Email to check"
              className="w-full px-3 py-2 border rounded mb-2"
            />
            <button
              onClick={checkSupabaseUser}
              disabled={isLoading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              Check User
            </button>
          </div>

          {/* Sign Out */}
          <div className="mb-6">
            <button
              onClick={signOutSupabase}
              disabled={isLoading}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
            >
              Sign Out from Supabase
            </button>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">Result:</h3>
              <pre className="text-xs bg-yellow-50 p-4 rounded whitespace-pre-wrap">
                {testResult}
              </pre>
            </div>
          )}
        </div>

        {/* Important Notes */}
        <div className="bg-yellow-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2">Important Notes</h2>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>When you sign up, check your email for a verification link</li>
            <li>You must verify your email before you can login</li>
            <li>Supabase emails might go to spam folder</li>
            <li>Each browser/device has its own session</li>
            <li>Row Level Security prevents seeing other users' data</li>
            <li>If you signed up but can't login, use "Test Login" to diagnose</li>
          </ul>
        </div>
      </div>
    </div>
  )
}