import React from 'react'
import { Sparkles } from 'lucide-react'

interface GuideHighlightsProps {
  highlights: string[]
}

const GuideHighlights: React.FC<GuideHighlightsProps> = ({ highlights }) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <Sparkles className="w-5 h-5 text-blue-600 mr-2" />
        <h2 className="text-xl font-bold">Trip Highlights</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {highlights.map((highlight, index) => (
          <div key={index} className="flex items-start">
            <span className="text-blue-600 mr-2 text-lg">•</span>
            <p className="text-gray-700">{highlight}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default GuideHighlights