import { useState, useRef, useEffect } from 'react'
import { MessageCircle, Send, X, Sparkles, MapPin, Utensils, Camera } from 'lucide-react'
import { openaiService } from '../../services/openai'
import { isOpenAIConfigured } from '../../config/api'
import type { Trip, Place } from '../../types'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface TripAssistantProps {
  trip: Trip
  places: Place[]
}

const suggestedQuestions = [
  {
    icon: MapPin,
    question: "What are the must-see attractions in this destination?",
    category: "attractions"
  },
  {
    icon: Utensils,
    question: "Can you recommend some local restaurants and cuisine?",
    category: "food"
  },
  {
    icon: Camera,
    question: "What are the best spots for photos and Instagram?",
    category: "photos"
  },
  {
    icon: MessageCircle,
    question: "How can I optimize my itinerary for better flow?",
    category: "optimization"
  },
]

export function TripAssistant({ trip, places }: TripAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add welcome message
      const welcomeMessage: Message = {
        id: '1',
        role: 'assistant',
        content: `Hi! I'm your travel assistant for your trip to ${trip.destination}. I can help you with recommendations, itinerary optimization, local tips, and answer any questions about your trip. What would you like to know?`,
        timestamp: new Date(),
      }
      setMessages([welcomeMessage])
    }
  }, [isOpen, trip.destination])

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
      const response = await openaiService.getTripAdvice(trip, places, content)
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
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

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-105 animate-bounce-gentle"
          title="Ask AI Assistant"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col animate-scale-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-primary-500 to-primary-600 rounded-t-2xl">
        <div className="flex items-center space-x-2 text-white">
          <Sparkles className="w-5 h-5" />
          <h3 className="font-semibold">Trip Assistant</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:text-gray-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
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