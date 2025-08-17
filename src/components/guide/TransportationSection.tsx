import React from 'react'
import { Train, Car, Bike, MapPin, DollarSign, Info } from 'lucide-react'
import type { TransportationTip } from '../../types/guide'

interface TransportationSectionProps {
  transportation: TransportationTip[]
}

const transportIcons = {
  public: Train,
  taxi: Car,
  rideshare: Car,
  rental: Car,
  walking: MapPin,
  bike: Bike
}

const transportColors = {
  public: 'bg-blue-100 text-blue-700',
  taxi: 'bg-yellow-100 text-yellow-700',
  rideshare: 'bg-purple-100 text-purple-700',
  rental: 'bg-green-100 text-green-700',
  walking: 'bg-gray-100 text-gray-700',
  bike: 'bg-teal-100 text-teal-700'
}

const TransportationSection: React.FC<TransportationSectionProps> = ({ transportation }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold mb-6">Getting Around</h2>
      
      <div className="space-y-4">
        {transportation.map((tip) => {
          const Icon = transportIcons[tip.type] || Info
          
          return (
            <div key={tip.id} className="border rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${transportColors[tip.type]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold capitalize">{tip.type} Transport</h3>
                    {tip.cost && (
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="w-4 h-4 mr-1" />
                        {tip.cost}
                      </div>
                    )}
                  </div>
                  
                  <p className="text-gray-700 mb-3">{tip.description}</p>
                  
                  {tip.tips && tip.tips.length > 0 && (
                    <div className="bg-gray-50 p-3 rounded">
                      <h4 className="text-sm font-semibold mb-2">Tips</h4>
                      <ul className="space-y-1">
                        {tip.tips.map((tipText, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start">
                            <span className="text-blue-600 mr-2">•</span>
                            {tipText}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TransportationSection