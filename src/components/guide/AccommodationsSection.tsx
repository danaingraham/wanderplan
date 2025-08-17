import React from 'react'
import { MapPin, DollarSign, Star, ExternalLink } from 'lucide-react'
import type { AccommodationRecommendation } from '../../types/guide'

interface AccommodationsSectionProps {
  accommodations: AccommodationRecommendation[]
}

const AccommodationsSection: React.FC<AccommodationsSectionProps> = ({ accommodations }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold mb-6">Where to Stay</h2>
      
      <div className="space-y-6">
        {accommodations.map((accommodation) => (
          <div key={accommodation.id} className="border-b last:border-b-0 pb-6 last:pb-0">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-xl font-semibold mb-1">{accommodation.name}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="capitalize">{accommodation.type}</span>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {accommodation.neighborhood}
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4" />
                    <span>{accommodation.priceRange}</span>
                  </div>
                  {accommodation.rating && (
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 mr-1" />
                      <span>{accommodation.rating}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {accommodation.images && accommodation.images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {accommodation.images.slice(0, 3).map((image) => (
                  <img
                    key={image.id}
                    src={image.url}
                    alt={image.caption || accommodation.name}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}

            <p className="text-gray-700 mb-4">{accommodation.description}</p>

            {accommodation.authorNotes && (
              <div className="bg-blue-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Author's Note:</span> {accommodation.authorNotes}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {accommodation.pros && accommodation.pros.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Pros</h4>
                  <ul className="space-y-1">
                    {accommodation.pros.map((pro, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <span className="text-green-600 mr-2">✓</span>
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {accommodation.cons && accommodation.cons.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Cons</h4>
                  <ul className="space-y-1">
                    {accommodation.cons.map((con, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <span className="text-red-600 mr-2">✗</span>
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {accommodation.amenities && accommodation.amenities.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-sm mb-2">Amenities</h4>
                <div className="flex flex-wrap gap-2">
                  {accommodation.amenities.map((amenity, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {accommodation.bookingLinks && accommodation.bookingLinks.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {accommodation.bookingLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    {link.provider}
                    {link.priceEstimate && (
                      <span className="ml-2 text-gray-500">({link.priceEstimate})</span>
                    )}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default AccommodationsSection