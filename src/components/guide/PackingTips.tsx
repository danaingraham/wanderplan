import React from 'react'
import { Luggage } from 'lucide-react'

interface PackingTipsProps {
  tips: string[]
}

const PackingTips: React.FC<PackingTipsProps> = ({ tips }) => {
  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex items-center mb-3">
        <Luggage className="w-5 h-5 text-blue-600 mr-2" />
        <h3 className="font-semibold">Packing Tips</h3>
      </div>
      
      <ul className="space-y-2">
        {tips.map((tip, index) => (
          <li key={index} className="text-sm text-gray-600 flex items-start">
            <span className="text-blue-600 mr-2">✓</span>
            {tip}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default PackingTips