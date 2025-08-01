import { AlertCircle, CheckCircle, Settings } from 'lucide-react'
import { isGoogleMapsConfigured, isOpenAIConfigured } from '../../config/api'

export function ApiStatus() {
  const googleMapsConfigured = isGoogleMapsConfigured()
  const openaiConfigured = isOpenAIConfigured()
  
  // If both are configured, show success message briefly
  if (googleMapsConfigured && openaiConfigured) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
        <div className="flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div>
            <h3 className="text-sm font-medium text-green-800">
              APIs Configured Successfully!
            </h3>
            <p className="text-xs text-green-700 mt-1">
              Google Places and OpenAI are ready. You'll get real location data and AI-powered suggestions.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
      <div className="flex items-start space-x-3">
        <Settings className="w-5 h-5 text-amber-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-amber-800 mb-2">
            API Configuration
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              {googleMapsConfigured ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-500" />
              )}
              <span className={googleMapsConfigured ? 'text-green-700' : 'text-amber-700'}>
                Google Places API: {googleMapsConfigured ? 'Configured' : 'Not configured'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {openaiConfigured ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-500" />
              )}
              <span className={openaiConfigured ? 'text-green-700' : 'text-amber-700'}>
                OpenAI API: {openaiConfigured ? 'Configured' : 'Not configured'}
              </span>
            </div>
          </div>
          {(!googleMapsConfigured || !openaiConfigured) && (
            <p className="text-xs text-amber-700 mt-2">
              Add your API keys to the .env file to enable all features. 
              {!googleMapsConfigured && ' Google Places enables real location data.'}
              {!openaiConfigured && ' OpenAI enables AI-powered itinerary suggestions.'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}