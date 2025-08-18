import React from 'react'
import { FileText, Plus } from 'lucide-react'

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ 
  title = "No guides yet",
  description = "Create your first guide to get started",
  icon,
  action
}: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="card max-w-md w-full p-8 text-center">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
             style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent) 15%, white)' }}>
          {icon || <FileText className="w-8 h-8" style={{ color: 'var(--color-accent)' }} />}
        </div>
        
        {/* Title */}
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
          {title}
        </h3>
        
        {/* Description */}
        <p className="text-sm text-zinc-600 mb-6">
          {description}
        </p>
        
        {/* Action Button */}
        {action && (
          <button
            onClick={action.onClick}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {action.label}
          </button>
        )}
      </div>
    </div>
  )
}