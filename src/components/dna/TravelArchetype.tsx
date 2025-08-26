import type { TravelArchetype } from '../../types/preferences';
import { ARCHETYPE_DEFINITIONS } from '../../utils/travelDNA';

interface TravelArchetypeProps {
  archetype: TravelArchetype;
  showDescription?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function TravelArchetypeCard({ 
  archetype, 
  showDescription = true,
  size = 'md' 
}: TravelArchetypeProps) {
  const definition = ARCHETYPE_DEFINITIONS[archetype];
  
  const sizeClasses = {
    sm: 'text-sm p-3',
    md: 'text-base p-4',
    lg: 'text-lg p-6'
  };

  const iconSizes = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl'
  };

  return (
    <div className={`bg-gradient-to-br ${definition.color} rounded-xl text-white ${sizeClasses[size]}`}>
      <div className="flex items-center gap-4">
        <div className={`${iconSizes[size]}`}>
          {definition.icon}
        </div>
        <div className="flex-1">
          <h3 className={`font-bold ${size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-base' : 'text-xl'}`}>
            {definition.label}
          </h3>
          {showDescription && (
            <p className={`mt-1 opacity-90 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
              {definition.description}
            </p>
          )}
        </div>
      </div>
      
      {showDescription && size !== 'sm' && (
        <div className="mt-4 flex gap-2 flex-wrap">
          {definition.primaryTraits.map(trait => (
            <span 
              key={trait}
              className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium capitalize"
            >
              {trait}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}