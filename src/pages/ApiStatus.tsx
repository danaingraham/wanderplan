import { useEffect, useState } from 'react'
import { Card } from '../components/ui/Card'
import { CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react'
import { API_CONFIG, isGoogleMapsConfigured, isOpenAIConfigured } from '../config/api'

export function ApiStatus() {
  const [googleMapsStatus, setGoogleMapsStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [openAIStatus, setOpenAIStatus] = useState<'checking' | 'connected' | 'error' | 'not-configured'>('checking')
  const [googleMapsError, setGoogleMapsError] = useState<string>('')
  const [openAIError, setOpenAIError] = useState<string>('')

  useEffect(() => {
    // Check Google Maps
    if (isGoogleMapsConfigured()) {
      // Try to load Google Maps
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${API_CONFIG.googleMaps.apiKey}&libraries=places`
      script.async = true
      script.onload = () => setGoogleMapsStatus('connected')
      script.onerror = () => {
        setGoogleMapsStatus('error')
        setGoogleMapsError('Failed to load Google Maps. Check your API key and billing.')
      }
      document.head.appendChild(script)
    } else {
      setGoogleMapsStatus('error')
      setGoogleMapsError('No API key configured')
    }

    // Check OpenAI
    const checkOpenAI = async () => {
      if (!isOpenAIConfigured()) {
        setOpenAIStatus('not-configured')
        setOpenAIError('No API key configured')
        return
      }

      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${API_CONFIG.openai.apiKey}`
          }
        })
        
        if (response.ok) {
          setOpenAIStatus('connected')
        } else {
          setOpenAIStatus('error')
          setOpenAIError(`API Error: ${response.status} ${response.statusText}`)
        }
      } catch (error) {
        setOpenAIStatus('error')
        setOpenAIError('Failed to connect to OpenAI')
      }
    }

    checkOpenAI()
  }, [])

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-6 h-6 text-green-500" />
      case 'error':
        return <XCircle className="w-6 h-6 text-red-500" />
      case 'not-configured':
        return <AlertCircle className="w-6 h-6 text-yellow-500" />
      default:
        return <Loader className="w-6 h-6 text-gray-500 animate-spin" />
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">API Status</h1>
      
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Environment</h2>
        <div className="space-y-2 font-mono text-sm">
          <p>Mode: {import.meta.env.MODE}</p>
          <p>Dev: {import.meta.env.DEV ? 'true' : 'false'}</p>
          <p>Prod: {import.meta.env.PROD ? 'true' : 'false'}</p>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Google Maps API</h2>
          <StatusIcon status={googleMapsStatus} />
        </div>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Status: <span className={`font-semibold ${
              googleMapsStatus === 'connected' ? 'text-green-600' : 
              googleMapsStatus === 'error' ? 'text-red-600' : 'text-gray-600'
            }`}>{googleMapsStatus}</span>
          </p>
          <p className="text-sm text-gray-600">
            API Key: {API_CONFIG.googleMaps.apiKey ? 
              `${API_CONFIG.googleMaps.apiKey.substring(0, 8)}...` : 
              'Not configured'}
          </p>
          {googleMapsError && (
            <p className="text-sm text-red-600">{googleMapsError}</p>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">OpenAI API</h2>
          <StatusIcon status={openAIStatus} />
        </div>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Status: <span className={`font-semibold ${
              openAIStatus === 'connected' ? 'text-green-600' : 
              openAIStatus === 'error' ? 'text-red-600' : 
              openAIStatus === 'not-configured' ? 'text-yellow-600' : 'text-gray-600'
            }`}>{openAIStatus}</span>
          </p>
          <p className="text-sm text-gray-600">
            API Key: {API_CONFIG.openai.apiKey ? 
              `${API_CONFIG.openai.apiKey.substring(0, 7)}...` : 
              'Not configured'}
          </p>
          <p className="text-sm text-gray-600">
            Model: {API_CONFIG.openai.model}
          </p>
          {openAIError && (
            <p className="text-sm text-red-600">{openAIError}</p>
          )}
        </div>
      </Card>

      <Card className="p-6 bg-blue-50">
        <h2 className="text-lg font-semibold mb-2">How to configure API keys locally:</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Create a <code className="bg-gray-100 px-1 py-0.5 rounded">.env</code> file in your project root</li>
          <li>Add your API keys:
            <pre className="mt-2 bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key_here
VITE_OPENAI_API_KEY=your_openai_key_here`}
            </pre>
          </li>
          <li>Restart your development server: <code className="bg-gray-100 px-1 py-0.5 rounded">npm run dev</code></li>
        </ol>
      </Card>
    </div>
  )
}