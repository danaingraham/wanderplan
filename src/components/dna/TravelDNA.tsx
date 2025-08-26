import { useMemo } from 'react';
import type { DNAScores } from '../../types/preferences';

interface TravelDNAProps {
  scores: DNAScores;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  animated?: boolean;
}

export function TravelDNA({ 
  scores, 
  size = 'md', 
  showLabels = true,
  animated = true 
}: TravelDNAProps) {
  const dimensions = [
    { key: 'adventure', label: 'Adventure', color: '#10b981' },
    { key: 'culture', label: 'Culture', color: '#8b5cf6' },
    { key: 'luxury', label: 'Luxury', color: '#ec4899' },
    { key: 'social', label: 'Social', color: '#3b82f6' },
    { key: 'relaxation', label: 'Relaxation', color: '#06b6d4' },
    { key: 'culinary', label: 'Culinary', color: '#f97316' }
  ];

  const sizeConfig = {
    sm: { width: 200, height: 200, fontSize: 10, dotSize: 3 },
    md: { width: 300, height: 300, fontSize: 12, dotSize: 4 },
    lg: { width: 400, height: 400, fontSize: 14, dotSize: 5 }
  }[size];

  const center = sizeConfig.width / 2;
  const maxRadius = center - 40;
  const angleStep = (Math.PI * 2) / dimensions.length;

  // Calculate polygon points for the radar chart
  const polygonPoints = useMemo(() => {
    return dimensions.map((dim, index) => {
      const angle = angleStep * index - Math.PI / 2;
      const value = scores[dim.key as keyof DNAScores] || 0;
      const radius = (value / 100) * maxRadius;
      const x = center + Math.cos(angle) * radius;
      const y = center + Math.sin(angle) * radius;
      return { x, y, value, dimension: dim };
    });
  }, [scores, dimensions, angleStep, center, maxRadius]);

  const polygonPath = polygonPoints.map(p => `${p.x},${p.y}`).join(' ');

  // Create grid lines
  const gridLevels = [20, 40, 60, 80, 100];
  
  return (
    <div className="relative">
      <svg 
        width={sizeConfig.width} 
        height={sizeConfig.height}
        className={animated ? 'transition-all duration-500' : ''}
      >
        {/* Background circles (grid) */}
        {gridLevels.map(level => (
          <circle
            key={level}
            cx={center}
            cy={center}
            r={(level / 100) * maxRadius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
        ))}

        {/* Axis lines */}
        {dimensions.map((_, index) => {
          const angle = angleStep * index - Math.PI / 2;
          const x = center + Math.cos(angle) * maxRadius;
          const y = center + Math.sin(angle) * maxRadius;
          return (
            <line
              key={index}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          );
        })}

        {/* DNA polygon */}
        <polygon
          points={polygonPath}
          fill="url(#dnaGradient)"
          fillOpacity="0.3"
          stroke="url(#dnaGradient)"
          strokeWidth="2"
          className={animated ? 'transition-all duration-1000' : ''}
        />

        {/* Data points */}
        {polygonPoints.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={sizeConfig.dotSize}
            fill={point.dimension.color}
            className={animated ? 'transition-all duration-1000' : ''}
          />
        ))}

        {/* Labels */}
        {showLabels && dimensions.map((dim, index) => {
          const angle = angleStep * index - Math.PI / 2;
          const labelRadius = maxRadius + 20;
          const x = center + Math.cos(angle) * labelRadius;
          const y = center + Math.sin(angle) * labelRadius;
          
          return (
            <text
              key={index}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={sizeConfig.fontSize}
              fill="#4b5563"
              className="font-medium"
            >
              {dim.label}
            </text>
          );
        })}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="dnaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>

      {/* Score tooltips on hover (for larger sizes) */}
      {size !== 'sm' && (
        <div className="absolute inset-0 pointer-events-none">
          {polygonPoints.map((point, index) => (
            <div
              key={index}
              className="absolute group pointer-events-auto"
              style={{
                left: `${point.x - 10}px`,
                top: `${point.y - 10}px`,
                width: '20px',
                height: '20px'
              }}
            >
              <div className="hidden group-hover:block absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10">
                {point.dimension.label}: {point.value}%
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}