import React from 'react';
import { Hotel, Home, Building, MapPin, DollarSign } from 'lucide-react';
import { PlacePhoto } from '../places/PlacePhoto';
import type { Place } from '../../types';

interface AccommodationSectionProps {
  accommodations: Place[];
  tripDuration: number;
}

export function AccommodationSection({ accommodations, tripDuration }: AccommodationSectionProps) {
  if (accommodations.length === 0) {
    return null;
  }

  const getAccommodationIcon = (place: Place) => {
    const name = place.name.toLowerCase();
    const desc = (place.description || '').toLowerCase();
    
    if (name.includes('airbnb') || desc.includes('airbnb') || desc.includes('vacation rental')) {
      return <Home className="w-5 h-5 text-blue-600" />;
    }
    if (name.includes('hostel') || desc.includes('hostel')) {
      return <Building className="w-5 h-5 text-green-600" />;
    }
    return <Hotel className="w-5 h-5 text-purple-600" />;
  };

  const extractPrice = (description: string): string | null => {
    // Look for price patterns like $180/night or ($180/night)
    const priceMatch = description.match(/\$(\d+)\/night/);
    return priceMatch ? priceMatch[0] : null;
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 sm:p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Hotel className="w-5 h-5 text-purple-600" />
        <h2 className="text-lg font-semibold text-gray-900">
          Accommodation {tripDuration > 1 ? `(${tripDuration} nights)` : ''}
        </h2>
      </div>

      <div className="space-y-3">
        {accommodations.map((place) => {
          const price = extractPrice(place.description || '');
          
          return (
            <div 
              key={place.id} 
              className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row gap-3 p-3 sm:p-4">
                {/* Photo */}
                <div className="w-full sm:w-24 h-32 sm:h-24 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                  <PlacePhoto
                    placeId={place.place_id}
                    photoUrl={place.photo_url || undefined}
                    placeName={place.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col gap-1.5 sm:gap-2">
                    {/* Title and Price Row */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getAccommodationIcon(place)}
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base break-words line-clamp-2 flex-1">
                          {place.name}
                        </h3>
                      </div>
                      
                      {/* Price Badge */}
                      {price && (
                        <div className="shrink-0 self-start">
                          <div className="bg-green-100 text-green-800 px-2 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium inline-flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
                            <DollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                            <span>{price.replace('$', '').replace('/night', '')}/nt</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Address */}
                    {place.address && (
                      <div className="flex items-start gap-1 text-xs sm:text-sm text-gray-600">
                        <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 mt-0.5" />
                        <span className="break-words line-clamp-2">{place.address}</span>
                      </div>
                    )}

                    {/* Description */}
                    {place.description && (
                      <p className="text-xs sm:text-sm text-gray-700 line-clamp-2">
                        {place.description.replace(/\$\d+\/night\s*/, '')}
                      </p>
                    )}
                    
                    {/* Why Recommended */}
                    {place.why_recommended && (
                      <div className="mt-1">
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">
                          {place.why_recommended}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total Cost Estimate */}
      {tripDuration > 1 && accommodations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Estimated total accommodation cost:</span>
            <span className="font-semibold text-gray-900">
              {(() => {
                const firstAccom = accommodations[0];
                const price = extractPrice(firstAccom.description || '');
                if (price) {
                  const nightlyRate = parseInt(price.match(/\d+/)?.[0] || '0');
                  return `$${nightlyRate * tripDuration} (${tripDuration} nights)`;
                }
                return 'Price not available';
              })()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}