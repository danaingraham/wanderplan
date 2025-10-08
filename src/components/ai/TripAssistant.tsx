import { useState, useRef, useEffect } from 'react'
import { Send, X, Sparkles, Utensils, Camera, Plus, Trash2, Edit3, ArrowUpDown, RotateCcw } from 'lucide-react'
import { openaiService } from '../../services/openai'
import { isOpenAIConfigured, isGoogleMapsConfigured } from '../../config/api'
import { googlePlacesService } from '../../services/googlePlaces'
import type { Trip, Place } from '../../types'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  actions?: ItineraryAction[]
}

interface ItineraryAction {
  type: 'add' | 'remove' | 'update' | 'reorder'
  description: string
  data: any
}

interface TripAssistantProps {
  trip: Trip
  places: Place[]
  onCreatePlace: (place: Omit<Place, 'id' | 'created_date' | 'updated_date'>) => string
  onUpdatePlace: (id: string, updates: Partial<Place>) => void
  onDeletePlace: (id: string) => void
}

const suggestedQuestions = [
  {
    icon: Plus,
    question: "Add top attractions",
    category: "add-attractions"
  },
  {
    icon: Utensils,
    question: "Add best restaurants",
    category: "add-food"
  },
  {
    icon: Edit3,
    question: "Optimize my itinerary",
    category: "optimization"
  },
  {
    icon: Camera,
    question: "Add photo spots",
    category: "add-photos"
  },
]

export function TripAssistant({ trip, places, onCreatePlace, onUpdatePlace, onDeletePlace }: TripAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Storage key for this specific trip's conversation
  const conversationKey = `wanderplan_conversation_${trip.id}`

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load conversation when component mounts
  useEffect(() => {
    const loadConversation = () => {
      try {
        const savedConversation = localStorage.getItem(conversationKey)
        if (savedConversation) {
          const parsedMessages = JSON.parse(savedConversation)
          // Convert timestamp strings back to Date objects
          const messagesWithDates = parsedMessages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
          setMessages(messagesWithDates)
          console.log('🔄 Loaded conversation for trip:', trip.id, messagesWithDates.length, 'messages')
        }
      } catch (error) {
        console.error('Failed to load conversation:', error)
      }
    }
    
    loadConversation()
  }, [conversationKey, trip.id])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add welcome message
      const welcomeMessage: Message = {
        id: '1',
        role: 'assistant',
        content: `Hi! I'm your ${trip.destination} assistant. I can add places, optimize your itinerary, or answer questions. What can I do?`,
        timestamp: new Date(),
      }
      setMessages([welcomeMessage])
    }
  }, [isOpen, trip.destination, messages.length])

  // Save conversation whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(conversationKey, JSON.stringify(messages))
        console.log('💾 Saved conversation for trip:', trip.id, messages.length, 'messages')
      } catch (error) {
        console.error('Failed to save conversation:', error)
      }
    }
  }, [messages, conversationKey, trip.id])

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    if (!isOpenAIConfigured()) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, the AI assistant is not configured. Please add your OpenAI API key to use this feature.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // Convert messages to format expected by OpenAI, excluding the welcome message
      const conversationHistory = messages
        .filter(msg => msg.id !== '1') // Exclude welcome message
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }))

      const { response, actions } = await openaiService.getTripAdviceWithActions(
        trip,
        places,
        content,
        conversationHistory
      )
      
      // Auto-execute simple actions immediately for one-shot behavior
      let autoExecutedCount = 0
      if (actions && actions.length > 0) {
        const simpleActions = actions.filter(action =>
          action.type === 'add' ||
          action.type === 'remove' ||
          (action.type === 'reorder' && actions.length <= 3)
        )

        // Auto-execute if it's a simple request with 1-3 clear actions
        if (simpleActions.length > 0 && simpleActions.length <= 3) {
          for (const action of simpleActions) {
            try {
              await executeAction(action)
              autoExecutedCount++
            } catch (error) {
              console.error('Auto-execution failed:', error)
            }
          }
        }
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        // Only show action buttons for complex actions that weren't auto-executed
        actions: autoExecutedCount > 0 ? [] : (actions || [])
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('AI assistant error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again later.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    handleSendMessage(question)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSendMessage(inputValue)
  }

  const enrichPlaceWithGoogleData = async (placeData: any): Promise<any> => {
    // If Google Maps is not configured, return the place as-is
    if (!isGoogleMapsConfigured()) {
      console.log('⚠️ Google Maps not configured, skipping place enrichment')
      return placeData
    }

    try {
      // Search for the place using name and address
      const searchQuery = `${placeData.name}, ${placeData.address}`
      console.log('🔍 Looking up place in Google Places:', searchQuery)

      const results = await googlePlacesService.searchPlaces(searchQuery)

      if (results && results.length > 0) {
        const googlePlace = results[0]
        console.log('✅ Found Google Place:', googlePlace.name, 'with', googlePlace.photos?.length || 0, 'photos')

        return {
          ...placeData,
          place_id: googlePlace.place_id,
          photo_url: googlePlace.photos && googlePlace.photos.length > 0
            ? googlePlace.photos[0].photo_reference
            : undefined,
          latitude: googlePlace.geometry.location.lat,
          longitude: googlePlace.geometry.location.lng,
          // Update address with the canonical one from Google
          address: googlePlace.formatted_address,
        }
      } else {
        // Fallback: Try geocoding the address to at least get coordinates
        console.log('⚠️ No Google Places results found, trying geocoding for:', placeData.address)
        const coords = await googlePlacesService.geocodeAddress(placeData.address)

        if (coords) {
          console.log('✅ Geocoded address successfully:', coords)
          return {
            ...placeData,
            latitude: coords.lat,
            longitude: coords.lng,
          }
        }

        console.log('❌ Could not geocode address, place will not show on map')
        return placeData
      }
    } catch (error) {
      console.error('❌ Failed to enrich place with Google data:', error)
      return placeData // Return original data if enrichment fails
    }
  }

  const executeAction = async (action: ItineraryAction) => {
    console.log('🎬 Executing action:', action.type, action.description, action.data)
    console.log('🎬 Current places count:', places.length)
    try {
      switch (action.type) {
        case 'add':
          const dayPlaces = places.filter(p => p.day === action.data.day)
          console.log(`🎬 Adding place to day ${action.data.day}, existing places on this day:`, dayPlaces.length)

          // Enrich the place with Google Places data (photo, place_id, lat/lng)
          const enrichedData = await enrichPlaceWithGoogleData(action.data)

          const newPlace = {
            ...enrichedData,
            trip_id: trip.id,
            // Calculate proper order based on day and existing places
            order: dayPlaces.length
          }
          console.log('🎬 Creating place with order:', newPlace.order, newPlace)
          const placeId = onCreatePlace(newPlace)
          console.log('🎬 Place created with ID:', placeId)
          break
        
        case 'update':
          if (action.data.id && action.data.updates) {
            onUpdatePlace(action.data.id, action.data.updates)
          } else {
            console.warn('Invalid update action data:', action.data)
          }
          break
        
        case 'remove':
          onDeletePlace(action.data.id)
          break
        
        case 'reorder':
          // Handle bulk reordering of places
          if (action.data.places && Array.isArray(action.data.places)) {
            action.data.places.forEach((placeUpdate: any) => {
              onUpdatePlace(placeUpdate.id, {
                day: placeUpdate.day,
                order: placeUpdate.order,
                start_time: placeUpdate.start_time
              })
            })
          }
          break
        
        default:
          console.warn('Unsupported action type:', action.type)
      }

      // No confirmation message needed - AI response already confirms the action
    } catch (error) {
      console.error('Failed to execute action:', error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `❌ Sorry, I couldn't execute that action. ${error}`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  const clearConversation = () => {
    try {
      localStorage.removeItem(conversationKey)
      setMessages([])
      console.log('🗑️ Cleared conversation for trip:', trip.id)
    } catch (error) {
      console.error('Failed to clear conversation:', error)
    }
  }

  if (!isOpen) {
    return (
      <div 
        className="fixed right-4 sm:right-6" 
        style={{ 
          zIndex: 9999,
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)'
        }}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white rounded-full p-3 sm:p-4 shadow-lg transition-all duration-200 hover:scale-105 animate-bounce-gentle"
          title="Ask AI Assistant"
          aria-label="Open AI assistant"
        >
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>
    )
  }

  return (
    <div 
      className="fixed right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 max-w-[24rem] h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col animate-scale-in" 
      style={{ 
        zIndex: 9999,
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)'
      }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-primary-500 to-primary-600 rounded-t-2xl">
        <div className="flex items-center space-x-2 text-white">
          <Sparkles className="w-5 h-5" />
          <h3 className="font-semibold">Trip Assistant</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={clearConversation}
            className="text-white hover:text-gray-200 transition-colors"
            title="Clear conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              
              {/* Action buttons */}
              {message.actions && message.actions.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={async () => await executeAction(action)}
                      className={`flex items-center space-x-2 w-full text-left p-2 rounded-lg transition-colors border ${
                        message.role === 'user'
                          ? 'bg-white bg-opacity-20 hover:bg-opacity-30 border-white border-opacity-30 text-white'
                          : 'bg-primary-50 hover:bg-primary-100 border-primary-200 text-primary-700'
                      }`}
                    >
                      {action.type === 'add' && <Plus className="w-4 h-4" />}
                      {action.type === 'update' && <Edit3 className="w-4 h-4" />}
                      {action.type === 'remove' && <Trash2 className="w-4 h-4" />}
                      {action.type === 'reorder' && <ArrowUpDown className="w-4 h-4" />}
                      <span className="text-xs font-medium">{action.description}</span>
                    </button>
                  ))}
                </div>
              )}
              
              <p className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        {/* Suggested Questions */}
        {messages.length <= 1 && !isLoading && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 font-medium">Suggested questions:</p>
            {suggestedQuestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestedQuestion(suggestion.question)}
                className="w-full text-left p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200"
              >
                <div className="flex items-center space-x-2">
                  <suggestion.icon className="w-4 h-4 text-primary-500" />
                  <span className="text-sm text-gray-700">{suggestion.question}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about your trip..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white rounded-xl px-4 py-2 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}