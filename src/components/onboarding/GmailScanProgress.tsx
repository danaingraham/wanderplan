import { useEffect, useState } from 'react';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { Mail, Hotel, Plane, Utensils, MapPin, TrendingUp } from 'lucide-react';

export function GmailScanProgress() {
  const { 
    scanProgress, 
    scannedData, 
    updateScanProgress, 
    updateScannedData,
    setDetectedPreferences,
    nextStep 
  } = useOnboarding();
  
  const [currentMessage, setCurrentMessage] = useState('Connecting to Gmail...');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Simulate scanning process
  useEffect(() => {
    const messages = [
      'Connecting to Gmail...',
      'Searching for travel bookings...',
      'Found Airbnb confirmations...',
      'Analyzing flight reservations...',
      'Checking restaurant bookings...',
      'Processing hotel stays...',
      'Building your travel profile...',
      'Almost done...'
    ];

    let progress = 0;
    let messageIndex = 0;
    let mockHotels = 0;
    let mockFlights = 0;
    let mockRestaurants = 0;
    let mockActivities = 0;

    const interval = setInterval(() => {
      progress += Math.random() * 15;
      
      if (progress > 100) {
        progress = 100;
        clearInterval(interval);
        
        // Set mock detected preferences
        setDetectedPreferences({
          budget_type: 'mid_range',
          accommodation_style: [
            { style: 'hotel', confidence: 0.9, last_seen: new Date().toISOString(), count: 5 },
            { style: 'airbnb', confidence: 0.7, last_seen: new Date().toISOString(), count: 3 }
          ],
          preferred_cuisines: [
            { cuisine: 'Italian', confidence: 0.8, sample_size: 10 },
            { cuisine: 'Japanese', confidence: 0.7, sample_size: 8 },
            { cuisine: 'Mexican', confidence: 0.6, sample_size: 6 }
          ],
          frequent_destinations: [
            { city: 'New York', count: 4, last_visit: new Date().toISOString() },
            { city: 'San Francisco', count: 3, last_visit: new Date().toISOString() },
            { city: 'London', count: 2, last_visit: new Date().toISOString() }
          ],
          pace_preference: 'moderate'
        });
        
        setTimeout(() => {
          nextStep();
        }, 1000);
        return;
      }

      updateScanProgress(progress);
      
      // Update message
      if (progress > (messageIndex + 1) * 12.5) {
        messageIndex = Math.min(messageIndex + 1, messages.length - 1);
        setCurrentMessage(messages[messageIndex]);
      }

      // Simulate finding bookings
      if (Math.random() > 0.7) {
        const type = Math.floor(Math.random() * 4);
        switch(type) {
          case 0:
            mockHotels++;
            updateScannedData({ hotels: mockHotels });
            break;
          case 1:
            mockFlights++;
            updateScannedData({ flights: mockFlights });
            break;
          case 2:
            mockRestaurants++;
            updateScannedData({ restaurants: mockRestaurants });
            break;
          case 3:
            mockActivities++;
            updateScannedData({ activities: mockActivities });
            break;
        }
      }
    }, 500);

    setIsAnalyzing(true);

    return () => clearInterval(interval);
  }, [updateScanProgress, updateScannedData, setDetectedPreferences, nextStep]);

  const categories = [
    { icon: Hotel, label: 'Hotels', count: scannedData.hotels, color: 'text-blue-600' },
    { icon: Plane, label: 'Flights', count: scannedData.flights, color: 'text-primary-600' },
    { icon: Utensils, label: 'Restaurants', count: scannedData.restaurants, color: 'text-green-600' },
    { icon: MapPin, label: 'Activities', count: scannedData.activities, color: 'text-orange-600' }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
          <Mail className="w-10 h-10 text-primary-600" />
        </div>
        <p className="text-lg font-medium text-gray-900 mb-2">
          Building Your Travel DNA
        </p>
        <p className="text-sm text-gray-600">
          {currentMessage}
        </p>
      </div>

      {/* Progress bar */}
      <div className="relative">
        <div className="bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-primary-500 to-secondary-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${scanProgress}%` }}
          />
        </div>
        <div className="absolute -top-1 transition-all duration-500"
          style={{ left: `${Math.max(0, Math.min(95, scanProgress))}%` }}
        >
          <div className="bg-white border-2 border-primary-500 rounded-full w-5 h-5" />
        </div>
      </div>

      {/* Found items grid */}
      <div className="grid grid-cols-2 gap-4">
        {categories.map((category) => (
          <div 
            key={category.label}
            className={`bg-gray-50 rounded-lg p-4 transition-all ${
              category.count > 0 ? 'ring-2 ring-primary-200 bg-primary-50' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <category.icon className={`w-5 h-5 ${category.color} mr-2`} />
                <span className="text-sm font-medium text-gray-700">
                  {category.label}
                </span>
              </div>
              <span className={`text-lg font-bold ${
                category.count > 0 ? category.color : 'text-gray-400'
              }`}>
                {category.count}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Insights preview */}
      {(scannedData.hotels > 0 || scannedData.flights > 0) && (
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-4">
          <div className="flex items-start">
            <TrendingUp className="w-5 h-5 text-primary-600 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-gray-900 mb-1">
                Early insights detected!
              </p>
              <p className="text-gray-600">
                {scannedData.hotels > 3 && "You seem to prefer established hotel chains. "}
                {scannedData.flights > 5 && "You're a frequent traveler! "}
                {scannedData.restaurants > 10 && "Food experiences are important to you. "}
                {(scannedData.hotels + scannedData.flights + scannedData.restaurants + scannedData.activities) > 20 && 
                  "You have a rich travel history to build from!"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading animation */}
      {isAnalyzing && (
        <div className="flex justify-center space-x-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-primary-600 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}