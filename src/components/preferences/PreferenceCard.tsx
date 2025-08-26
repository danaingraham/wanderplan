import { useState } from 'react';
import { ChevronDown, ChevronUp, Edit2, X, Check } from 'lucide-react';

interface PreferenceCardProps {
  title: string;
  icon: React.ReactNode;
  expanded?: boolean;
  onToggle?: () => void;
  children: React.ReactNode;
}

export function PreferenceCard({ 
  title, 
  icon, 
  expanded = false, 
  onToggle,
  children 
}: PreferenceCardProps) {
  return (
    <div className="card">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 -m-4 hover:bg-gray-50 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="text-2xl">{icon}</div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
      
      {expanded && (
        <div className="pt-4 mt-4 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
}

interface PreferenceItemProps {
  label: string;
  value: any;
  type?: 'text' | 'select' | 'chips' | 'budget' | 'slider';
  options?: string[] | { value: string; label: string }[];
  onSave?: (value: any) => void;
  placeholder?: string;
}

export function PreferenceItem({ 
  label, 
  value, 
  type = 'text', 
  options = [],
  onSave,
  placeholder = 'Not set'
}: PreferenceItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onSave?.(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const formatValue = (val: any) => {
    if (!val || (Array.isArray(val) && val.length === 0)) return placeholder;
    if (Array.isArray(val)) return val.join(', ');
    if (type === 'budget' && typeof val === 'number') return `$${val} per day`;
    if (typeof val === 'string' && val.includes('_')) {
      return val.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
    return val;
  };

  if (!isEditing) {
    return (
      <div className="flex items-center justify-between py-2">
        <div>
          <p className="text-sm font-medium text-gray-700">{label}</p>
          <p className="text-gray-900">{formatValue(value)}</p>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="py-2">
      <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
      
      {type === 'text' && (
        <input
          type="text"
          value={editValue || ''}
          onChange={(e) => setEditValue(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder={placeholder}
        />
      )}

      {type === 'budget' && (
        <div className="flex items-center gap-2">
          <span className="text-gray-500">$</span>
          <input
            type="number"
            value={editValue || ''}
            onChange={(e) => setEditValue(Number(e.target.value))}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="0"
            min="0"
            step="10"
          />
          <span className="text-gray-500">per day</span>
        </div>
      )}

      {type === 'select' && (
        <select
          value={editValue || ''}
          onChange={(e) => setEditValue(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Select...</option>
          {options.map((option) => {
            const optValue = typeof option === 'string' ? option : option.value;
            const optLabel = typeof option === 'string' ? option : option.label;
            return (
              <option key={optValue} value={optValue}>
                {optLabel}
              </option>
            );
          })}
        </select>
      )}

      {type === 'chips' && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {options.map((option) => {
              const optValue = typeof option === 'string' ? option : option.value;
              const optLabel = typeof option === 'string' ? option : option.label;
              const isSelected = Array.isArray(editValue) && editValue.includes(optValue);
              
              return (
                <button
                  key={optValue}
                  onClick={() => {
                    if (isSelected) {
                      setEditValue(editValue.filter((v: string) => v !== optValue));
                    } else {
                      setEditValue([...(editValue || []), optValue]);
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-primary-100 text-primary-700 border-2 border-primary-300'
                      : 'bg-gray-100 text-gray-700 border-2 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {optLabel}
                </button>
              );
            })}
          </div>
          <input
            type="text"
            placeholder="Add custom..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value) {
                setEditValue([...(editValue || []), e.currentTarget.value]);
                e.currentTarget.value = '';
              }
            }}
          />
        </div>
      )}

      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={handleSave}
          className="flex items-center gap-1 px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
        >
          <Check className="w-4 h-4" />
          Save
        </button>
        <button
          onClick={handleCancel}
          className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </div>
  );
}

// Completeness indicator component
export function PreferenceCompleteness({ 
  completeness 
}: { 
  completeness: number 
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Profile Completeness</span>
        <span className="text-sm font-semibold text-primary-600">{completeness}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="h-2 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-500"
          style={{ width: `${completeness}%` }}
        />
      </div>
      {completeness < 50 && (
        <p className="text-xs text-gray-500 mt-1">
          Add more preferences to improve your recommendations
        </p>
      )}
    </div>
  );
}