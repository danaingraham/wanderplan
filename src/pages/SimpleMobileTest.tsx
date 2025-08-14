import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function SimpleMobileTest() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const testDirectLogin = async () => {
    setIsLoading(true)
    setResult('Starting test...')
    
    const startTime = Date.now()
    
    try {
      setResult('Calling Supabase...')
      
      // Set a timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout after 10 seconds')), 10000)
      )
      
      // Try to login
      const loginPromise = supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })
      
      // Race between login and timeout
      const { data, error } = await Promise.race([
        loginPromise,
        timeoutPromise
      ]) as any
      
      const elapsed = Date.now() - startTime
      
      if (error) {
        setResult(`❌ Login failed after ${elapsed}ms
Error: ${error.message}
Code: ${error.code || 'none'}
Status: ${error.status || 'none'}

Email: "${email}"
Email length: ${email.length}
Password length: ${password.length}
Has spaces in email: ${email !== email.trim()}`)
      } else if (data?.user) {
        setResult(`✅ SUCCESS after ${elapsed}ms!
User: ${data.user.email}
ID: ${data.user.id}
Verified: ${data.user.email_confirmed_at ? 'Yes' : 'No'}

You CAN login! The app just needs to handle it properly.`)
      } else {
        setResult(`❓ Unexpected response after ${elapsed}ms
No error but no user data`)
      }
    } catch (err: any) {
      const elapsed = Date.now() - startTime
      setResult(`⏱️ Timeout/Error after ${elapsed}ms
${err.message}

This usually means:
1. Network is blocking Supabase
2. CORS issue on mobile
3. Supabase is unreachable`)
    } finally {
      setIsLoading(false)
    }
  }

  const testConnection = async () => {
    setIsLoading(true)
    setResult('Testing Supabase connection...')
    
    try {
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        setResult(`❌ Can't connect to Supabase
${error.message}`)
      } else {
        setResult(`✅ Connected to Supabase!
Session: ${data.session ? 'Active' : 'None'}
Now try logging in above.`)
      }
    } catch (err: any) {
      setResult(`❌ Connection failed
${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Simple Mobile Login Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h2 className="font-semibold mb-4">Test Connection First</h2>
          <button
            onClick={testConnection}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-gray-500 text-white rounded disabled:opacity-50"
          >
            Test Supabase Connection
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h2 className="font-semibold mb-4">Test Login</h2>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-3 py-2 border rounded mb-3"
            autoCapitalize="off"
            autoCorrect="off"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-3 py-2 border rounded mb-3"
            autoCapitalize="off"
            autoCorrect="off"
          />
          <button
            onClick={testDirectLogin}
            disabled={isLoading || !email || !password}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test Login'}
          </button>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold mb-2">Result:</h3>
            <pre className="text-xs whitespace-pre-wrap">{result}</pre>
          </div>
        )}

        <div className="mt-6 text-sm text-gray-600">
          <p>This page tests Supabase login with a 10-second timeout.</p>
          <p>If it hangs, we'll know it's a network issue.</p>
        </div>
      </div>
    </div>
  )
}