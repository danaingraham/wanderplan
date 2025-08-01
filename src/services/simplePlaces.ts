import { API_CONFIG, isGoogleMapsConfigured } from '../config/api'

// Simple Google Places implementation using direct script loading
class SimplePlacesService {
  private initialized = false
  private autocompleteService: google.maps.places.AutocompleteService | null = null

  async initialize(): Promise<void> {
    if (this.initialized) return

    if (!isGoogleMapsConfigured()) {
      throw new Error('Google Maps API key not configured')
    }

    try {
      // Load Google Maps API script
      if (!window.google) {
        await this.loadGoogleMapsScript()
      }

      // Initialize autocomplete service
      this.autocompleteService = new window.google.maps.places.AutocompleteService()
      this.initialized = true
      console.log('✅ Simple Google Places service initialized')
    } catch (error) {
      console.error('❌ Failed to initialize Simple Google Places:', error)
      throw error
    }
  }

  private loadGoogleMapsScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${API_CONFIG.googleMaps.apiKey}&libraries=places`
      script.async = true
      script.defer = true
      
      script.onload = () => {
        console.log('✅ Google Maps script loaded')
        resolve()
      }
      
      script.onerror = () => {
        console.error('❌ Failed to load Google Maps script')
        reject(new Error('Failed to load Google Maps script'))
      }

      document.head.appendChild(script)
    })
  }

  async getDestinationSuggestions(input: string): Promise<Array<{
    place_id: string
    description: string
    main_text: string
    secondary_text: string
  }>> {
    console.log('🔍 SimplePlaces: Getting suggestions for:', input)
    
    try {
      await this.initialize()
      
      if (!this.autocompleteService) {
        throw new Error('Autocomplete service not available')
      }

      return new Promise((resolve) => {
        const request: google.maps.places.AutocompletionRequest = {
          input,
          types: ['(cities)'],
        }

        console.log('📞 SimplePlaces: Making API request...')
        
        // Add timeout
        const timeout = setTimeout(() => {
          console.warn('⏰ SimplePlaces: Request timed out')
          resolve([])
        }, 8000)

        this.autocompleteService!.getPlacePredictions(request, (predictions, status) => {
          clearTimeout(timeout)
          
          console.log('📍 SimplePlaces: Status:', status)
          console.log('📍 SimplePlaces: Predictions:', predictions)

          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            const results = predictions.map(prediction => ({
              place_id: prediction.place_id,
              description: prediction.description,
              main_text: prediction.structured_formatting.main_text,
              secondary_text: prediction.structured_formatting.secondary_text,
            }))
            
            console.log('✅ SimplePlaces: Returning', results.length, 'suggestions')
            resolve(results)
          } else {
            console.warn('⚠️ SimplePlaces: No results, status:', status)
            resolve([])
          }
        })
      })
    } catch (error) {
      console.error('❌ SimplePlaces: Error getting suggestions:', error)
      return []
    }
  }
}

export const simplePlacesService = new SimplePlacesService()