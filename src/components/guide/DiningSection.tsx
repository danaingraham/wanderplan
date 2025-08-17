import React, { useState } from 'react'
import { MapPin, DollarSign, Star, Clock, AlertCircle, ExternalLink } from 'lucide-react'
import type { DiningRecommendation, MealType } from '../../types/guide'

interface DiningSectionProps {
  dining: DiningRecommendation[]
}

const mealTypeColors: Record<MealType, string> = {
  breakfast: 'bg-yellow-100 text-yellow-700',
  lunch: 'bg-green-100 text-green-700',
  dinner: 'bg-purple-100 text-purple-700',
  brunch: 'bg-orange-100 text-orange-700',
  snack: 'bg-pink-100 text-pink-700',
  dessert: 'bg-red-100 text-red-700'
}

const DiningSection: React.FC<DiningSectionProps> = ({ dining }) => {
  const [selectedMealType, setSelectedMealType] = useState<MealType | 'all'>('all')
  const [selectedCuisine, setSelectedCuisine] = useState<string>('all')

  const mealTypes = Array.from(new Set(dining.flatMap(d => d.mealTypes)))
  const cuisines = Array.from(new Set(dining.map(d => d.cuisine)))

  const filteredDining = dining.filter(restaurant => {
    const matchesMealType = selectedMealType === 'all' || restaurant.mealTypes.includes(selectedMealType)
    const matchesCuisine = selectedCuisine === 'all' || restaurant.cuisine === selectedCuisine
    return matchesMealType && matchesCuisine
  })

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold mb-6">Where to Eat</h2>
      
      {/* Filters */}
      <div className="space-y-4 mb-6">
        {/* Meal Type Filter */}
        <div>
          <p className="text-sm font-semibold mb-2">Meal Type</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedMealType('all')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedMealType === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {mealTypes.map((mealType) => (
              <button
                key={mealType}
                onClick={() => setSelectedMealType(mealType)}
                className={`px-3 py-1 rounded-full text-sm capitalize transition-colors ${
                  selectedMealType === mealType 
                    ? mealTypeColors[mealType]
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {mealType}
              </button>
            ))}
          </div>
        </div>

        {/* Cuisine Filter */}
        <div>
          <p className="text-sm font-semibold mb-2">Cuisine</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCuisine('all')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                selectedCuisine === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Cuisines
            </button>
            {cuisines.map((cuisine) => (
              <button
                key={cuisine}
                onClick={() => setSelectedCuisine(cuisine)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedCuisine === cuisine 
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cuisine}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {filteredDining.map((restaurant) => (
          <div key={restaurant.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold">{restaurant.name}</h3>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mt-1">
                  <span className="font-medium">{restaurant.cuisine}</span>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {restaurant.neighborhood}
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4" />
                    <span>{restaurant.priceRange}</span>
                  </div>
                  {restaurant.rating && (
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 mr-1" />
                      {restaurant.rating}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Meal Type Tags */}
            <div className="flex flex-wrap gap-1 mb-3">
              {restaurant.mealTypes.map((mealType) => (
                <span
                  key={mealType}
                  className={`px-2 py-1 rounded text-xs capitalize ${mealTypeColors[mealType]}`}
                >
                  {mealType}
                </span>
              ))}
            </div>

            {restaurant.images && restaurant.images.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-3">
                {restaurant.images.slice(0, 4).map((image) => (
                  <img
                    key={image.id}
                    src={image.url}
                    alt={restaurant.name}
                    className="w-full h-20 object-cover rounded"
                  />
                ))}
              </div>
            )}

            <p className="text-gray-700 text-sm mb-3">{restaurant.description}</p>

            {restaurant.mustTryDishes && restaurant.mustTryDishes.length > 0 && (
              <div className="bg-amber-50 p-3 rounded mb-3">
                <h4 className="font-semibold text-sm mb-1">Must Try</h4>
                <div className="flex flex-wrap gap-2">
                  {restaurant.mustTryDishes.map((dish, index) => (
                    <span key={index} className="text-sm text-amber-800">
                      {dish}{index < restaurant.mustTryDishes.length - 1 ? ',' : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {restaurant.atmosphere && (
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-semibold">Atmosphere:</span> {restaurant.atmosphere}
              </p>
            )}

            {restaurant.dietaryOptions && restaurant.dietaryOptions.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {restaurant.dietaryOptions.map((option, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs"
                  >
                    {option}
                  </span>
                ))}
              </div>
            )}

            {restaurant.authorNotes && (
              <div className="bg-blue-50 p-3 rounded mb-3">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Author's Note:</span> {restaurant.authorNotes}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {restaurant.reservationRequired && (
                  <div className="flex items-center text-sm text-amber-600">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Reservation required
                  </div>
                )}
              </div>
              
              {restaurant.reservationLink && (
                <a
                  href={restaurant.reservationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Make reservation
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DiningSection