import { validateApiKeys, isGoogleMapsConfigured, isOpenAIConfigured } from '../config/api'
import { realApiService } from '../services/realApi'

export async function testApiConfiguration() {
  console.log('🔧 Testing API Configuration...')
  
  // Test basic configuration
  console.log('Google Maps configured:', isGoogleMapsConfigured())
  console.log('OpenAI configured:', isOpenAIConfigured())
  
  const allConfigured = validateApiKeys()
  console.log('All APIs configured:', allConfigured)
  
  // Test API service availability
  const apiStatus = realApiService.isConfigured()
  console.log('API Service Status:', apiStatus)
  
  if (apiStatus.googlePlaces) {
    console.log('✅ Google Places API is ready')
    
    try {
      // Test destination suggestions
      const suggestions = await realApiService.getDestinationSuggestions('New York')
      console.log('🗺️ Destination suggestions test:', suggestions.length > 0 ? 'SUCCESS' : 'NO RESULTS')
      if (suggestions.length > 0) {
        console.log('Sample suggestion:', suggestions[0])
      }
    } catch (error) {
      console.error('❌ Google Places test failed:', error)
    }
  }
  
  if (apiStatus.openai) {
    console.log('✅ OpenAI API is ready')
    
    // Note: We won't test OpenAI here to avoid API usage, but it's configured
    console.log('🤖 OpenAI ready for itinerary generation and chat assistance')
  }
  
  return {
    googleMaps: apiStatus.googlePlaces,
    openai: apiStatus.openai,
    allConfigured,
  }
}