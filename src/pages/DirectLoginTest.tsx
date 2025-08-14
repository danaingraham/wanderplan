import { useState } from 'react'

export function DirectLoginTest() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState('')

  const testDirectSupabase = async () => {
    setResult('Testing...')
    
    try {
      // Create a fresh Supabase client directly
      const { createClient } = await import('@supabase/supabase-js')
      
      // Custom storage adapter for better mobile support
      const customStorage = {
        getItem: (key: string) => {
          try {
            return window.localStorage.getItem(key)
          } catch (error) {
            console.error('Storage getItem error:', error)
            return null
          }
        },
        setItem: (key: string, value: string) => {
          try {
            window.localStorage.setItem(key, value)
          } catch (error) {
            console.error('Storage setItem error:', error)
          }
        },
        removeItem: (key: string) => {
          try {
            window.localStorage.removeItem(key)
          } catch (error) {
            console.error('Storage removeItem error:', error)
          }
        }
      }
      
      const client = createClient(
        'https://zhusodnwzmbpvvkxjtvn.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpodXNvZG53em1icHZ2a3hqdHZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNDQyOTUsImV4cCI6MjA3MDcyMDI5NX0.CcwEJ7FtVgVDXWS83A7ui8zMZSwTNn1UWivFVnPoh9g',
        {
          auth: {
            persistSession: true,
            storageKey: 'wanderplan-auth',
            storage: customStorage,
            flowType: 'implicit',
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        }
      )
      
      setResult('Client created, attempting login...')
      
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })
      
      if (error) {
        setResult(`❌ Login failed: ${error.message}
Code: ${error.code}
Status: ${error.status}`)
      } else if (data.user) {
        // Try to get session to verify it worked
        const { data: sessionData } = await client.auth.getSession()
        
        setResult(`✅ LOGIN SUCCESSFUL!
User: ${data.user.email}
ID: ${data.user.id}
Session: ${sessionData.session ? 'Active' : 'None'}

The login works! The issue is in the app's auth setup.
Try refreshing the main login page now.`)
        
        // Store in localStorage to help the app
        localStorage.setItem('wanderplan-auth-token', data.session?.access_token || '')
      }
    } catch (err: any) {
      setResult(`Error: ${err.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Direct Login Test</h1>
        <p className="text-sm text-gray-600 mb-4">
          This creates a fresh Supabase client to test login directly.
        </p>
        
        <div className="bg-white rounded-lg shadow p-6">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-3 py-2 border rounded mb-3"
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="email"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-3 py-2 border rounded mb-3"
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="current-password"
          />
          <button
            onClick={testDirectSupabase}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded"
          >
            Test Direct Login
          </button>
        </div>

        {result && (
          <div className="mt-4 bg-white rounded-lg shadow p-6">
            <pre className="text-xs whitespace-pre-wrap">{result}</pre>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-600">
          <p>After successful login here, try the main app login.</p>
        </div>
      </div>
    </div>
  )
}