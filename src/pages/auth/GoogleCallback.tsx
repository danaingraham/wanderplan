import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
// TODO: Re-enable Gmail integration
// import { gmailAuthService } from '../../services/gmail/gmailAuthService'
import { useUser } from '../../contexts/UserContext'

export default function GoogleCallback() {
  const navigate = useNavigate()
  const { user } = useUser()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the authorization code from URL params
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        const error = urlParams.get('error')

        if (error) {
          throw new Error(`Authorization error: ${error}`)
        }

        if (!code) {
          throw new Error('No authorization code received')
        }

        if (!user?.id) {
          throw new Error('User not authenticated')
        }

        console.log('📧 Processing Gmail authorization...')

        // TODO: Re-enable Gmail integration
        // Exchange code for tokens and save connection
        // const success = await gmailAuthService.handleOAuthCallback(code, user.id)
        const success = false // Temporarily disabled

        if (success) {
          console.log('✅ Gmail connected successfully')
          // Redirect to profile page with success message
          navigate('/profile?gmail=connected')
        } else {
          throw new Error('Gmail integration temporarily disabled')
        }
      } catch (error) {
        console.error('OAuth callback error:', error)
        setError(error instanceof Error ? error.message : 'Failed to connect Gmail')
        
        // Redirect to profile with error after 3 seconds
        setTimeout(() => {
          navigate('/profile?gmail=error')
        }, 3000)
      } finally {
        setIsProcessing(false)
      }
    }

    handleCallback()
  }, [user, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral-500 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900">
                Connecting Gmail...
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Please wait while we set up your Gmail connection
              </p>
            </>
          ) : error ? (
            <>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Connection Failed
              </h2>
              <p className="mt-2 text-sm text-red-600">
                {error}
              </p>
              <p className="mt-2 text-sm text-gray-600">
                Redirecting to profile...
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Gmail Connected!
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Redirecting to profile...
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}