import { useState } from 'react'

export function NetworkDiagnostic() {
  const [results, setResults] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const addResult = (msg: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`])
  }

  const runDiagnostics = async () => {
    setIsRunning(true)
    setResults([])
    
    // Test 1: Basic fetch to Supabase
    addResult('Testing direct fetch to Supabase...')
    try {
      const response = await fetch('https://zhusodnwzmbpvvkxjtvn.supabase.co/auth/v1/health', {
        method: 'GET',
        mode: 'cors',
      })
      if (response.ok) {
        addResult('✅ Can reach Supabase via fetch')
      } else {
        addResult(`⚠️ Supabase responded with status: ${response.status}`)
      }
    } catch (err: any) {
      addResult(`❌ Cannot fetch from Supabase: ${err.message}`)
    }

    // Test 2: Check if localStorage works
    addResult('Testing localStorage...')
    try {
      localStorage.setItem('test', 'value')
      const value = localStorage.getItem('test')
      if (value === 'value') {
        addResult('✅ localStorage works')
      } else {
        addResult('⚠️ localStorage read/write mismatch')
      }
      localStorage.removeItem('test')
    } catch (err: any) {
      addResult(`❌ localStorage blocked: ${err.message}`)
    }

    // Test 3: Check if we can reach other APIs
    addResult('Testing fetch to jsonplaceholder API...')
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/posts/1')
      if (response.ok) {
        addResult('✅ Can reach external APIs')
      } else {
        addResult(`⚠️ External API status: ${response.status}`)
      }
    } catch (err: any) {
      addResult(`❌ Cannot reach external APIs: ${err.message}`)
    }

    // Test 4: Check WebSocket support (Supabase uses this)
    addResult('Testing WebSocket support...')
    try {
      if ('WebSocket' in window) {
        addResult('✅ WebSocket API available')
      } else {
        addResult('❌ WebSocket not supported')
      }
    } catch (err: any) {
      addResult(`❌ WebSocket check failed: ${err.message}`)
    }

    // Test 5: Check third-party cookies
    addResult('Checking cookie settings...')
    try {
      if (navigator.cookieEnabled) {
        addResult('✅ Cookies enabled')
      } else {
        addResult('❌ Cookies disabled - Supabase needs this!')
      }
    } catch (err: any) {
      addResult(`⚠️ Cannot check cookies: ${err.message}`)
    }

    // Test 6: Direct Supabase health check
    addResult('Testing Supabase health endpoint...')
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch('https://zhusodnwzmbpvvkxjtvn.supabase.co/rest/v1/', {
        signal: controller.signal,
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpodXNvZG53em1icHZ2a3hqdHZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNDQyOTUsImV4cCI6MjA3MDcyMDI5NX0.CcwEJ7FtVgVDXWS83A7ui8zMZSwTNn1UWivFVnPoh9g'
        }
      })
      clearTimeout(timeoutId)
      
      if (response.ok || response.status === 401) {
        addResult('✅ Supabase API is reachable')
      } else {
        addResult(`⚠️ Supabase API status: ${response.status}`)
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        addResult('❌ Supabase request timed out after 5 seconds')
      } else {
        addResult(`❌ Cannot reach Supabase API: ${err.message}`)
      }
    }

    // Test 7: Check User Agent
    addResult(`User Agent: ${navigator.userAgent}`)
    addResult(`Platform: ${navigator.platform}`)
    
    setIsRunning(false)
    addResult('--- Diagnostics complete ---')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Network Diagnostic</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <p className="mb-4">This tests what your browser can and cannot access.</p>
          <button
            onClick={runDiagnostics}
            disabled={isRunning}
            className="px-6 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            {isRunning ? 'Running...' : 'Run Diagnostics'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="font-semibold mb-4">Results:</h2>
            <div className="space-y-1">
              {results.map((result, i) => (
                <div 
                  key={i} 
                  className={`text-sm font-mono ${
                    result.includes('✅') ? 'text-green-600' :
                    result.includes('❌') ? 'text-red-600' :
                    result.includes('⚠️') ? 'text-yellow-600' :
                    'text-gray-600'
                  }`}
                >
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 bg-yellow-50 rounded-lg p-4 text-sm">
          <h3 className="font-semibold mb-2">If Supabase is blocked:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Check if you have any ad blockers or VPNs</li>
            <li>Try disabling "Enhanced Tracking Protection"</li>
            <li>Check if your network blocks certain domains</li>
            <li>Try on a different network (home WiFi vs cellular)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}