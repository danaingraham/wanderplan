import { Check } from 'lucide-react'
import { cn } from '../../utils/cn'

interface StepIndicatorProps {
  steps: string[]
  currentStep: number
  completedSteps: number[]
}

export function StepIndicator({ steps, currentStep, completedSteps }: StepIndicatorProps) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isCompleted = completedSteps.includes(stepNumber)
          const isCurrent = currentStep === stepNumber
          // const isClickable = stepNumber <= Math.max(currentStep, ...completedSteps)
          
          return (
            <div key={step} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all",
                    isCompleted && "bg-primary-500 border-primary-500 text-white",
                    isCurrent && !isCompleted && "border-primary-500 text-primary-500 bg-white",
                    !isCurrent && !isCompleted && "border-gray-300 text-gray-500 bg-white"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    stepNumber
                  )}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs font-medium",
                    (isCurrent || isCompleted) ? "text-primary-600" : "text-gray-500"
                  )}
                >
                  {step}
                </span>
              </div>
              
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "w-16 h-0.5 mx-4 transition-colors",
                    isCompleted ? "bg-primary-500" : "bg-gray-300"
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}