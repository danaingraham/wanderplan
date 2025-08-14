import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('Processing authentication...')

  useEffect(() => {
    // Handle the callback from Supabase (email verification, password reset, etc.)
    const handleAuthCallback = async () => {
      try {
        // Get the hash fragment from the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const type = hashParams.get('type')

        if (accessToken) {
          // We have a valid token
          const { data: { user }, error } = await supabase.auth.getUser(accessToken)
          
          if (error) {
            setStatus(`Error: ${error.message}`)
            setTimeout(() => navigate('/login'), 3000)
            return
          }

          if (user) {
            if (type === 'signup') {
              setStatus('✅ Email verified successfully! Redirecting to login...')
              // Sign out so they can login fresh
              await supabase.auth.signOut()
              setTimeout(() => navigate('/login'), 2000)
            } else if (type === 'recovery') {
              setStatus('✅ Email verified! You can now reset your password.')
              setTimeout(() => navigate('/reset-password'), 2000)
            } else {
              setStatus('✅ Authentication successful! Redirecting...')
              setTimeout(() => navigate('/'), 2000)
            }
          }
        } else {
          // No token in URL, check if we're already logged in
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            navigate('/')
          } else {
            setStatus('No authentication token found. Redirecting to login...')
            setTimeout(() => navigate('/login'), 2000)
          }
        }
      } catch (error: any) {
        setStatus(`Error: ${error.message}`)
        setTimeout(() => navigate('/login'), 3000)
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">{status}</p>
      </div>
    </div>
  )
}