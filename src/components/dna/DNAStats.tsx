import { MapPin, Utensils, Calendar, Compass } from 'lucide-react';
import type { UserPreferences } from '../../types/preferences';
import { getTravelStats } from '../../utils/travelDNA';

interface DNAStatsProps {
  preferences: Partial<UserPreferences>;
  variant?: 'grid' | 'list';
}

export function DNAStats({ preferences, variant = 'grid' }: DNAStatsProps) {
  const stats = getTravelStats(preferences);
  
  const statItems = [
    {
      icon: MapPin,
      label: 'Destinations',
      value: stats.destinationsVisited || 0,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      icon: Utensils,
      label: 'Cuisines',
      value: stats.cuisinesTried || 0,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Calendar,
      label: 'Trips Analyzed',
      value: stats.tripsAnalyzed || 0,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: Compass,
      label: 'Travel Pace',
      value: formatPace(stats.travelPace),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  if (variant === 'grid') {
    return (
      <div className="grid grid-cols-2 gap-4">
        {statItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={`${item.bgColor} rounded-lg p-4`}>
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${item.color}`} />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {item.value}
                  </div>
                  <div className="text-xs text-gray-600">{item.label}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {statItems.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`p-2 ${item.bgColor} rounded-lg`}>
                <Icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <span className="text-sm font-medium text-gray-700">{item.label}</span>
            </div>
            <span className="text-sm font-bold text-gray-900">{item.value}</span>
          </div>
        );
      })}
    </div>
  );
}

function formatPace(pace: string | null): string {
  if (!pace || pace === 'Not set') return 'Not set';
  
  const paceLabels: Record<string, string> = {
    relaxed: 'Relaxed',
    moderate: 'Moderate',
    packed: 'Fast-paced'
  };
  
  return paceLabels[pace] || pace;
}