import React, { useState } from 'react'
import { Clock, DollarSign, MapPin, Star, Calendar, AlertCircle, ExternalLink } from 'lucide-react'
import type { ActivityRecommendation, ActivityCategory } from '../../types/guide'

interface ActivitiesSectionProps {
  activities: ActivityRecommendation[]
}

const categoryColors: Record<ActivityCategory, string> = {
  sightseeing: 'bg-purple-100 text-purple-700',
  adventure: 'bg-red-100 text-red-700',
  cultural: 'bg-indigo-100 text-indigo-700',
  shopping: 'bg-pink-100 text-pink-700',
  nightlife: 'bg-gray-800 text-white',
  relaxation: 'bg-green-100 text-green-700',
  dining: 'bg-orange-100 text-orange-700',
  nature: 'bg-teal-100 text-teal-700'
}

const ActivitiesSection: React.FC<ActivitiesSectionProps> = ({ activities }) => {
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | 'all'>('all')

  const categories = Array.from(new Set(activities.map(a => a.category)))
  const filteredActivities = selectedCategory === 'all' 
    ? activities 
    : activities.filter(a => a.category === selectedCategory)

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold mb-6">Things to Do</h2>
      
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            selectedCategory === 'all' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({activities.length})
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1 rounded-full text-sm capitalize transition-colors ${
              selectedCategory === category 
                ? categoryColors[category]
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category} ({activities.filter(a => a.category === category).length})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredActivities.map((activity) => (
          <div key={activity.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            {activity.images && activity.images.length > 0 && (
              <img
                src={activity.images[0].url}
                alt={activity.name}
                className="w-full h-48 object-cover"
              />
            )}
            
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold">{activity.name}</h3>
                <span className={`px-2 py-1 rounded text-xs capitalize ${categoryColors[activity.category]}`}>
                  {activity.category}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {activity.location}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {activity.duration}
                </div>
                {activity.cost && (
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    {activity.cost}
                  </div>
                )}
                {activity.rating && (
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                    {activity.rating}
                  </div>
                )}
              </div>

              <p className="text-gray-700 text-sm mb-3">{activity.description}</p>

              {activity.bestTimeToVisit && (
                <div className="flex items-center text-sm text-blue-600 mb-3">
                  <Calendar className="w-4 h-4 mr-1" />
                  Best time: {activity.bestTimeToVisit}
                </div>
              )}

              {activity.difficulty && (
                <div className="mb-3">
                  <span className={`inline-block px-2 py-1 rounded text-xs ${
                    activity.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                    activity.difficulty === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {activity.difficulty} difficulty
                  </span>
                </div>
              )}

              {activity.tips && activity.tips.length > 0 && (
                <div className="bg-gray-50 p-3 rounded mb-3">
                  <h4 className="font-semibold text-sm mb-1">Tips</h4>
                  <ul className="space-y-1">
                    {activity.tips.map((tip, index) => (
                      <li key={index} className="text-xs text-gray-600 flex items-start">
                        <span className="text-blue-600 mr-1">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activity.bookingRequired && (
                <div className="flex items-center text-sm text-amber-600 mb-3">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Booking required
                </div>
              )}

              {activity.bookingLink && (
                <a
                  href={activity.bookingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Book this activity
                </a>
              )}

              {activity.accessibility && (
                <p className="text-xs text-gray-500 mt-2">
                  Accessibility: {activity.accessibility}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ActivitiesSection