import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function MobileAuthTest() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testLogin = async () => {
    setLoading(true)
    setResult('Testing login...')
    
    try {
      // Test 1: Check if localStorage works
      try {
        localStorage.setItem('test', 'works')
        localStorage.removeItem('test')
        setResult(prev => prev + '\n✅ localStorage works')
      } catch (e) {
        setResult(prev => prev + '\n❌ localStorage failed: ' + (e as any).message)
      }

      // Test 2: Try to login with the existing supabase client
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })
      
      if (error) {
        setResult(prev => prev + `\n❌ Login failed: ${error.message}`)
      } else if (data.user) {
        setResult(prev => prev + `\n✅ LOGIN SUCCESS! User: ${data.user.email}`)
        
        // Test 3: Check if session persists
        const { data: sessionData } = await supabase.auth.getSession()
        if (sessionData.session) {
          setResult(prev => prev + '\n✅ Session is active')
        } else {
          setResult(prev => prev + '\n❌ No session found')
        }
      }
    } catch (err: any) {
      setResult(prev => prev + `\n❌ Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Mobile Auth Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '16px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            marginBottom: '10px'
          }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '16px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            marginBottom: '10px'
          }}
        />
        <button
          onClick={testLogin}
          disabled={loading || !email || !password}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '16px',
            backgroundColor: loading ? '#ccc' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Testing...' : 'Test Login'}
        </button>
      </div>

      {result && (
        <div style={{
          backgroundColor: '#f5f5f5',
          padding: '10px',
          borderRadius: '4px',
          whiteSpace: 'pre-wrap',
          fontSize: '14px',
          fontFamily: 'monospace'
        }}>
          {result}
        </div>
      )}
    </div>
  )
}