import { User, Sparkles, Settings } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';
import type { TripPreferenceMetadata } from '../../types/preferenceTracking';

interface PreferenceIndicatorProps {
  metadata?: TripPreferenceMetadata;
  variant?: 'badge' | 'inline' | 'detailed';
  className?: string;
}

export function PreferenceIndicator({ 
  metadata, 
  variant = 'badge',
  className = '' 
}: PreferenceIndicatorProps) {
  if (!metadata || metadata.totalPreferencesApplied === 0) {
    return null;
  }

  // Calculate indicator color based on preference source
  const getIndicatorColor = () => {
    if (metadata.overriddenPreferences > 0) {
      return 'text-purple-600 bg-purple-50 border-purple-200';
    }
    if (metadata.profilePreferences > 0) {
      return 'text-blue-600 bg-blue-50 border-blue-200';
    }
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getIcon = () => {
    if (metadata.overriddenPreferences > metadata.profilePreferences) {
      return <Sparkles className="w-3.5 h-3.5" />;
    }
    if (metadata.profilePreferences > 0) {
      return <User className="w-3.5 h-3.5" />;
    }
    return <Settings className="w-3.5 h-3.5" />;
  };

  const getTooltipContent = () => {
    const parts: string[] = [];
    
    if (metadata.profilePreferences > 0) {
      parts.push(`${metadata.profilePreferences} from your profile`);
    }
    
    if (metadata.overriddenPreferences > 0) {
      parts.push(`${metadata.overriddenPreferences} customized for this trip`);
    }
    
    if (metadata.defaultPreferences > 0) {
      parts.push(`${metadata.defaultPreferences} default settings`);
    }
    
    return `Preferences applied: ${parts.join(', ')}`;
  };

  if (variant === 'badge') {
    return (
      <Tooltip content={getTooltipContent()}>
        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium ${getIndicatorColor()} ${className}`}>
          {getIcon()}
          <span>{metadata.totalPreferencesApplied}</span>
        </div>
      </Tooltip>
    );
  }

  if (variant === 'inline') {
    return (
      <Tooltip content={getTooltipContent()}>
        <div className={`inline-flex items-center gap-1 text-xs ${className}`}>
          {getIcon()}
          <span className="text-gray-600">
            {metadata.totalPreferencesApplied} preference{metadata.totalPreferencesApplied !== 1 ? 's' : ''}
          </span>
        </div>
      </Tooltip>
    );
  }

  // Detailed variant
  return (
    <div className={`bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3 border border-purple-100 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${getIndicatorColor()}`}>
            {getIcon()}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              Personalized with your preferences
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              {getTooltipContent()}
            </p>
          </div>
        </div>
      </div>
      
      {metadata.tracking && (
        <div className="mt-3 space-y-1">
          {metadata.tracking.budgetType && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">Budget:</span>
              <span className="font-medium">
                {metadata.tracking.budgetType.value}
                {metadata.tracking.budgetType.source === 'override' && 
                  <span className="ml-1 text-purple-600">(customized)</span>
                }
              </span>
            </div>
          )}
          
          {metadata.tracking.dietaryRestrictions && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">Dietary:</span>
              <span className="font-medium">
                {metadata.tracking.dietaryRestrictions.value.join(', ')}
              </span>
            </div>
          )}
          
          {metadata.tracking.accommodationStyle && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">Accommodation:</span>
              <span className="font-medium">
                {metadata.tracking.accommodationStyle.value.join(', ')}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}