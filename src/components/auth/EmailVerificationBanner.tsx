import { useState } from 'react'
import { Mail, X, RefreshCw } from 'lucide-react'
import { useUser } from '../../contexts/UserContext'
import { supabase } from '../../lib/supabase'

export function EmailVerificationBanner() {
  const { user } = useUser()
  const [isResending, setIsResending] = useState(false)
  const [message, setMessage] = useState('')
  const [dismissed, setDismissed] = useState(false)

  // Only show for unverified email users using Supabase
  const shouldShow = user && !user.email_verified && user.auth_provider === 'local' && !dismissed

  if (!shouldShow) return null

  const handleResendVerification = async () => {
    setIsResending(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      })

      if (error) {
        setMessage('Failed to resend verification email. Please try again.')
      } else {
        setMessage('Verification email sent! Please check your inbox.')
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="bg-yellow-50 border-b border-yellow-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center flex-1">
            <Mail className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">
                Please verify your email address
              </p>
              <p className="text-xs text-yellow-600 mt-0.5">
                Check your inbox for a verification link or{' '}
                <button
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="font-medium underline hover:no-underline disabled:opacity-50"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="inline w-3 h-3 mr-1 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'resend verification email'
                  )}
                </button>
              </p>
              {message && (
                <p className={`text-xs mt-1 ${message.includes('sent') ? 'text-green-600' : 'text-red-600'}`}>
                  {message}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="ml-3 flex-shrink-0 text-yellow-600 hover:text-yellow-700"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}