import { cn } from '../../utils/cn'

interface CardSkeletonProps {
  size?: 'small' | 'medium' | 'large'
  showInfoCards?: boolean
  className?: string
}

export function CardSkeleton({ 
  size = 'medium', 
  showInfoCards = true,
  className 
}: CardSkeletonProps) {
  const sizeClasses = {
    small: 'h-48',
    medium: 'h-56',
    large: 'h-64'
  }

  return (
    <div className={cn(
      "bg-white rounded-xl overflow-hidden shadow-md animate-pulse",
      className
    )}>
      {/* Image skeleton */}
      <div className={cn("bg-gray-200", sizeClasses[size])} />
      
      {/* Info cards skeleton */}
      {showInfoCards && (
        <div className="p-4 bg-gray-50">
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="h-8 bg-gray-200 rounded mb-1" />
                <div className="h-3 bg-gray-200 rounded w-2/3 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}