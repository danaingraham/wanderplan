import React from 'react'
import { MapPin, DollarSign, Star, ExternalLink, Globe, Phone, CheckCircle } from 'lucide-react'
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
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-semibold">{accommodation.name}</h3>
                  {accommodation.place_id && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Google Verified
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <span className="capitalize">{accommodation.type}</span>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {accommodation.verified_address || accommodation.neighborhood}
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4" />
                    <span>{accommodation.priceRange}</span>
                  </div>
                  {accommodation.google_rating && (
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                      <span>{accommodation.google_rating}</span>
                      <span className="text-gray-400 ml-1">(Google)</span>
                    </div>
                  )}
                  {accommodation.rating && !accommodation.google_rating && (
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 mr-1" />
                      <span>{accommodation.rating}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Display Google photos first, then regular images */}
            {((accommodation.google_photos && accommodation.google_photos.length > 0) || 
              (accommodation.images && accommodation.images.length > 0)) && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {accommodation.google_photos && accommodation.google_photos.length > 0 ? (
                  accommodation.google_photos.slice(0, 3).map((photo, index) => (
                    <img
                      key={`google-${index}`}
                      src={photo}
                      alt={accommodation.name}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ))
                ) : accommodation.images ? (
                  accommodation.images.slice(0, 3).map((image) => (
                    <img
                      key={image.id}
                      src={image.url}
                      alt={image.caption || accommodation.name}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ))
                ) : null}
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

            <div className="flex flex-wrap gap-2">
              {accommodation.bookingLinks && accommodation.bookingLinks.length > 0 && (
                accommodation.bookingLinks.map((link, index) => (
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
                ))
              )}
              {accommodation.website && (
                <a
                  href={accommodation.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 text-sm"
                >
                  <Globe className="w-4 h-4 mr-1" />
                  Official Website
                </a>
              )}
              {accommodation.phone && (
                <a
                  href={`tel:${accommodation.phone}`}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                >
                  <Phone className="w-4 h-4 mr-1" />
                  {accommodation.phone}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AccommodationsSection