import { useState } from 'react'
import { Plus, Plane, Hotel, Car, Train, Calendar, Clock, MapPin, Hash, Mail, Edit2, Trash2, X, Check } from 'lucide-react'
import { formatDate } from '../../utils/date'

export interface LogisticsItem {
  id: string
  trip_id?: string
  type: 'flight' | 'hotel' | 'car_rental' | 'train' | 'accommodation' | 'transport'
  title: string
  description?: string
  startDate: string
  endDate?: string
  startTime?: string
  endTime?: string
  location?: string
  confirmationNumber?: string
  email?: string
  notes?: string
  cost?: number
  currency?: string
  created_date?: string
  updated_date?: string
}

interface LogisticsContainerProps {
  logistics: LogisticsItem[]
  onAdd: (item: Omit<LogisticsItem, 'id'>) => void
  onUpdate: (id: string, updates: Partial<LogisticsItem>) => void
  onDelete: (id: string) => void
  tripStartDate?: string
  tripEndDate?: string
  hideAddButton?: boolean
  hideHeader?: boolean
}

const logisticsTypes = [
  { value: 'flight', label: 'Flight', icon: Plane, color: 'blue' },
  { value: 'hotel', label: 'Hotel', icon: Hotel, color: 'purple' },
  { value: 'accommodation', label: 'Accommodation', icon: Hotel, color: 'purple' },
  { value: 'car_rental', label: 'Car Rental', icon: Car, color: 'green' },
  { value: 'train', label: 'Train', icon: Train, color: 'orange' },
  { value: 'transport', label: 'Transport', icon: Car, color: 'gray' },
] as const

function getTypeConfig(type: LogisticsItem['type']) {
  return logisticsTypes.find(t => t.value === type) || logisticsTypes[0]
}

function LogisticsCard({ item, onUpdate, onDelete }: { 
  item: LogisticsItem, 
  onUpdate: (id: string, updates: Partial<LogisticsItem>) => void,
  onDelete: (id: string) => void 
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState(item)
  const typeConfig = getTypeConfig(item.type)
  const IconComponent = typeConfig.icon

  const handleSave = () => {
    onUpdate(item.id, editData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditData(item)
    setIsEditing(false)
  }

  return (
    <div className={`bg-white rounded-xl border-l-4 border-${typeConfig.color}-400 shadow-sm hover:shadow-md transition-all duration-200 p-4`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 bg-${typeConfig.color}-100 rounded-full flex items-center justify-center`}>
            <IconComponent className={`w-5 h-5 text-${typeConfig.color}-600`} />
          </div>
          <div>
            {isEditing ? (
              <input
                type="text"
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                className="text-lg font-semibold text-gray-900 bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none"
                placeholder="Title"
              />
            ) : (
              <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
            )}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${typeConfig.color}-100 text-${typeConfig.color}-800 mt-1`}>
              {typeConfig.label}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancel}
                className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Date and Time */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            {isEditing ? (
              <div className="flex gap-2">
                <input
                  type="date"
                  value={editData.startDate}
                  onChange={(e) => setEditData({ ...editData, startDate: e.target.value })}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                />
                {(editData.endDate || editData.type === 'hotel' || editData.type === 'accommodation') && (
                  <>
                    <span>to</span>
                    <input
                      type="date"
                      value={editData.endDate || ''}
                      onChange={(e) => setEditData({ ...editData, endDate: e.target.value })}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    />
                  </>
                )}
              </div>
            ) : (
              <span>
                {formatDate(item.startDate, 'MMM dd, yyyy')}
                {item.endDate && ` - ${formatDate(item.endDate, 'MMM dd, yyyy')}`}
              </span>
            )}
          </div>

          {(item.startTime || isEditing) && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              {isEditing ? (
                <div className="flex gap-2 items-center">
                  <input
                    type="time"
                    value={editData.startTime || ''}
                    onChange={(e) => setEditData({ ...editData, startTime: e.target.value })}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  />
                  {editData.endTime !== undefined && (
                    <>
                      <span>to</span>
                      <input
                        type="time"
                        value={editData.endTime || ''}
                        onChange={(e) => setEditData({ ...editData, endTime: e.target.value })}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      />
                    </>
                  )}
                </div>
              ) : (
                <span>
                  {item.startTime}
                  {item.endTime && ` - ${item.endTime}`}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Location and Details */}
        <div className="space-y-2">
          {(item.location || isEditing) && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              {isEditing ? (
                <input
                  type="text"
                  value={editData.location || ''}
                  onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                  className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
                  placeholder="Location"
                />
              ) : (
                <span className="break-words">{item.location}</span>
              )}
            </div>
          )}

          {(item.confirmationNumber || isEditing) && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Hash className="w-4 h-4 flex-shrink-0" />
              {isEditing ? (
                <input
                  type="text"
                  value={editData.confirmationNumber || ''}
                  onChange={(e) => setEditData({ ...editData, confirmationNumber: e.target.value })}
                  className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
                  placeholder="Confirmation Number"
                />
              ) : (
                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                  {item.confirmationNumber}
                </span>
              )}
            </div>
          )}

          {(item.email || isEditing) && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="w-4 h-4 flex-shrink-0" />
              {isEditing ? (
                <input
                  type="email"
                  value={editData.email || ''}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
                  placeholder="Email"
                />
              ) : (
                <a href={`mailto:${item.email}`} className="text-blue-600 hover:underline">
                  {item.email}
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {(item.description || isEditing) && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          {isEditing ? (
            <textarea
              value={editData.description || ''}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 resize-none"
              placeholder="Description or notes..."
              rows={2}
            />
          ) : (
            <p className="text-sm text-gray-600">{item.description}</p>
          )}
        </div>
      )}

      {/* Cost */}
      {(item.cost || isEditing) && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Cost:</span>
          {isEditing ? (
            <div className="flex gap-2">
              <input
                type="number"
                value={editData.cost || ''}
                onChange={(e) => setEditData({ ...editData, cost: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="w-20 text-sm border border-gray-300 rounded px-2 py-1"
                placeholder="0"
                step="0.01"
              />
              <input
                type="text"
                value={editData.currency || 'USD'}
                onChange={(e) => setEditData({ ...editData, currency: e.target.value })}
                className="w-16 text-sm border border-gray-300 rounded px-2 py-1"
                placeholder="USD"
              />
            </div>
          ) : (
            <span className="text-sm font-semibold text-green-600">
              {item.cost?.toLocaleString('en-US', { 
                style: 'currency', 
                currency: item.currency || 'USD' 
              })}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export function LogisticsContainer({ logistics, onAdd, onUpdate, onDelete, tripStartDate, hideAddButton = false, hideHeader = false }: LogisticsContainerProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItem, setNewItem] = useState<Omit<LogisticsItem, 'id'>>({
    type: 'flight',
    title: '',
    startDate: tripStartDate || new Date().toISOString().split('T')[0],
    description: '',
    location: '',
    confirmationNumber: '',
    email: '',
  })

  const handleAdd = () => {
    if (newItem.title.trim()) {
      onAdd(newItem)
      setNewItem({
        type: 'flight',
        title: '',
        startDate: tripStartDate || new Date().toISOString().split('T')[0],
        description: '',
        location: '',
        confirmationNumber: '',
        email: '',
      })
      setShowAddForm(false)
    }
  }

  // Sort logistics by start date
  const sortedLogistics = [...logistics].sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Travel Logistics</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage your flights, accommodations, and transportation
            </p>
          </div>
          
          {!hideAddButton && (
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          )}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-gray-50 rounded-xl p-4 border-2 border-dashed border-gray-300">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newItem.type}
                  onChange={(e) => setNewItem({ ...newItem, type: e.target.value as LogisticsItem['type'] })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {logisticsTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Flight to Paris, Hotel Reservation"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={newItem.startDate}
                  onChange={(e) => setNewItem({ ...newItem, startDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={newItem.location}
                  onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="City, Airport, Address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmation #</label>
                <input
                  type="text"
                  value={newItem.confirmationNumber}
                  onChange={(e) => setNewItem({ ...newItem, confirmationNumber: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ABC123"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                disabled={!newItem.title.trim()}
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logistics Items */}
      <div className="space-y-4">
        {sortedLogistics.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <div className="mx-auto w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-3">
              <Plane className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">No logistics items added yet</p>
            <p className="text-gray-400 text-xs mt-1">
              Add flights, hotels, car rentals, and other travel arrangements
            </p>
          </div>
        ) : (
          sortedLogistics.map(item => (
            <LogisticsCard
              key={item.id}
              item={item}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))
        )}
      </div>

      {/* Email Integration Placeholder */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-blue-900">Email Integration (Coming Soon)</h3>
            <p className="text-sm text-blue-700">
              Forward your confirmation emails to automatically populate logistics
            </p>
          </div>
        </div>
        <div className="ml-11 text-xs text-blue-600">
          📧 Forward to: logistics@wanderplan.app (Feature in development)
        </div>
      </div>
    </div>
  )
}