import { CheckCircle, Circle, TrendingUp } from 'lucide-react';

interface DNACompletenessProps {
  completeness: number;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function DNACompleteness({ 
  completeness, 
  showDetails = true,
  size = 'md' 
}: DNACompletenessProps) {
  const getCompletionLevel = () => {
    if (completeness >= 80) return { label: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (completeness >= 60) return { label: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (completeness >= 40) return { label: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { label: 'Needs Work', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const level = getCompletionLevel();
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (completeness / 100) * circumference;

  const sizeConfig = {
    sm: { width: 80, height: 80, strokeWidth: 4, fontSize: 'text-lg' },
    md: { width: 120, height: 120, strokeWidth: 6, fontSize: 'text-2xl' },
    lg: { width: 160, height: 160, strokeWidth: 8, fontSize: 'text-3xl' }
  };

  const config = sizeConfig[size];

  const milestones = [
    { threshold: 25, label: 'Getting Started', icon: Circle, unlocked: completeness >= 25 },
    { threshold: 50, label: 'Half Way There', icon: TrendingUp, unlocked: completeness >= 50 },
    { threshold: 75, label: 'Almost Complete', icon: CheckCircle, unlocked: completeness >= 75 },
    { threshold: 100, label: 'DNA Master', icon: CheckCircle, unlocked: completeness === 100 }
  ];

  return (
    <div className="space-y-4">
      {/* Circular Progress */}
      <div className="flex items-center justify-center">
        <div className="relative">
          <svg width={config.width} height={config.height} className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx={config.width / 2}
              cy={config.height / 2}
              r="45"
              stroke="#e5e7eb"
              strokeWidth={config.strokeWidth}
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx={config.width / 2}
              cy={config.height / 2}
              r="45"
              stroke="url(#progressGradient)"
              strokeWidth={config.strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
            {/* Gradient definition */}
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`font-bold ${config.fontSize} ${level.color}`}>
              {completeness}%
            </div>
            {size !== 'sm' && (
              <div className="text-xs text-gray-600">Complete</div>
            )}
          </div>
        </div>
      </div>

      {/* Status label */}
      <div className="text-center">
        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${level.bgColor} ${level.color}`}>
          {level.label}
        </span>
      </div>

      {/* Milestones */}
      {showDetails && size !== 'sm' && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Milestones</h4>
          <div className="space-y-1">
            {milestones.map((milestone) => {
              const Icon = milestone.icon;
              return (
                <div
                  key={milestone.threshold}
                  className={`flex items-center gap-2 text-sm ${
                    milestone.unlocked ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  <Icon 
                    className={`w-4 h-4 ${
                      milestone.unlocked ? 'text-green-500' : 'text-gray-300'
                    }`}
                  />
                  <span className={milestone.unlocked ? '' : 'line-through'}>
                    {milestone.label}
                  </span>
                  {!milestone.unlocked && (
                    <span className="text-xs text-gray-500">
                      ({milestone.threshold}%)
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Call to action */}
      {showDetails && completeness < 100 && (
        <div className="bg-primary-50 rounded-lg p-3">
          <p className="text-sm text-primary-700">
            {completeness < 40 
              ? '🎯 Complete your Travel DNA to get personalized recommendations'
              : completeness < 70
              ? '✨ You\'re doing great! Add a few more details for better trips'
              : '🏆 Almost there! Complete your DNA for the best experience'}
          </p>
        </div>
      )}
    </div>
  );
}