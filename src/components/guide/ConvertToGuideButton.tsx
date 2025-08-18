import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Loader2 } from 'lucide-react'
import { TripGuideService } from '../../services/tripGuideService'
import { useUser } from '../../contexts/UserContext'
import type { Trip } from '../../types'

interface ConvertToGuideButtonProps {
  trip: Trip
  className?: string
  autoOpen?: boolean
  onClose?: () => void
}

const ConvertToGuideButton: React.FC<ConvertToGuideButtonProps> = ({ trip, className = '', autoOpen = false, onClose }) => {
  const navigate = useNavigate()
  const { user } = useUser()
  const [converting, setConverting] = useState(false)
  const [showModal, setShowModal] = useState(autoOpen)
  
  // Handle autoOpen effect
  React.useEffect(() => {
    if (autoOpen) {
      setShowModal(true)
    }
  }, [autoOpen])
  
  // Handle close
  const handleClose = () => {
    setShowModal(false)
    if (onClose) {
      onClose()
    }
  }
  
  // Additional info for the guide
  const [additionalInfo, setAdditionalInfo] = useState({
    highlights: [''],
    packingTips: [''],
    localTips: [''],
    bestTimeToVisit: '',
    avoidThese: [''],
    tags: ['']
  })

  const guideService = new TripGuideService()

  const handleConvert = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    setShowModal(true)
  }

  const performConversion = async () => {
    try {
      setConverting(true)
      
      // Filter out empty strings from arrays
      const cleanedInfo = {
        highlights: additionalInfo.highlights.filter(h => h.trim()),
        packingTips: additionalInfo.packingTips.filter(t => t.trim()),
        localTips: additionalInfo.localTips.filter(t => t.trim()),
        bestTimeToVisit: additionalInfo.bestTimeToVisit.trim(),
        avoidThese: additionalInfo.avoidThese.filter(a => a.trim()),
        tags: additionalInfo.tags.filter(t => t.trim())
      }

      const guide = await guideService.createFromItinerary(
        trip.id,
        user!.id,
        cleanedInfo
      )
      
      // Navigate to the guide editor
      navigate(`/guides/${guide.id}/edit`)
    } catch (err) {
      console.error('Error converting to guide:', err)
      alert('Failed to convert trip to guide')
    } finally {
      setConverting(false)
      handleClose()
    }
  }

  const updateArrayField = (field: keyof typeof additionalInfo, index: number, value: string) => {
    const array = additionalInfo[field] as string[]
    const newArray = [...array]
    newArray[index] = value
    setAdditionalInfo({
      ...additionalInfo,
      [field]: newArray
    })
  }

  const addArrayField = (field: keyof typeof additionalInfo) => {
    const array = additionalInfo[field] as string[]
    setAdditionalInfo({
      ...additionalInfo,
      [field]: [...array, '']
    })
  }

  const removeArrayField = (field: keyof typeof additionalInfo, index: number) => {
    const array = additionalInfo[field] as string[]
    setAdditionalInfo({
      ...additionalInfo,
      [field]: array.filter((_, i) => i !== index)
    })
  }

  return (
    <>
      <button
        onClick={handleConvert}
        disabled={converting}
        className={`flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 ${className}`}
      >
        {converting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <BookOpen className="w-4 h-4" />
        )}
        <span>Create Travel Guide</span>
      </button>

      {/* Conversion Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto z-[10000]">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Convert Trip to Travel Guide</h2>
              <p className="text-gray-600 mb-6">
                Add some additional information to make your trip into a helpful guide for other travelers.
              </p>

              <div className="space-y-6">
                {/* Highlights */}
                <div>
                  <label className="block text-sm font-medium mb-2">Trip Highlights</label>
                  {additionalInfo.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={highlight}
                        onChange={(e) => updateArrayField('highlights', index, e.target.value)}
                        placeholder="e.g., Amazing sunset views from the Eiffel Tower"
                        className="flex-1 px-3 py-2 border rounded-lg"
                      />
                      {additionalInfo.highlights.length > 1 && (
                        <button
                          onClick={() => removeArrayField('highlights', index)}
                          className="text-red-600 hover:bg-red-50 p-1 rounded"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addArrayField('highlights')}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add another highlight
                  </button>
                </div>

                {/* Packing Tips */}
                <div>
                  <label className="block text-sm font-medium mb-2">Packing Tips</label>
                  {additionalInfo.packingTips.map((tip, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={tip}
                        onChange={(e) => updateArrayField('packingTips', index, e.target.value)}
                        placeholder="e.g., Bring comfortable walking shoes"
                        className="flex-1 px-3 py-2 border rounded-lg"
                      />
                      {additionalInfo.packingTips.length > 1 && (
                        <button
                          onClick={() => removeArrayField('packingTips', index)}
                          className="text-red-600 hover:bg-red-50 p-1 rounded"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addArrayField('packingTips')}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add another packing tip
                  </button>
                </div>

                {/* Local Tips */}
                <div>
                  <label className="block text-sm font-medium mb-2">Local Tips</label>
                  {additionalInfo.localTips.map((tip, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={tip}
                        onChange={(e) => updateArrayField('localTips', index, e.target.value)}
                        placeholder="e.g., Always carry cash for small vendors"
                        className="flex-1 px-3 py-2 border rounded-lg"
                      />
                      {additionalInfo.localTips.length > 1 && (
                        <button
                          onClick={() => removeArrayField('localTips', index)}
                          className="text-red-600 hover:bg-red-50 p-1 rounded"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addArrayField('localTips')}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add another local tip
                  </button>
                </div>

                {/* Best Time to Visit */}
                <div>
                  <label className="block text-sm font-medium mb-2">Best Time to Visit</label>
                  <input
                    type="text"
                    value={additionalInfo.bestTimeToVisit}
                    onChange={(e) => setAdditionalInfo({
                      ...additionalInfo,
                      bestTimeToVisit: e.target.value
                    })}
                    placeholder="e.g., Spring (March-May) for perfect weather"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                {/* Things to Avoid */}
                <div>
                  <label className="block text-sm font-medium mb-2">Things to Avoid</label>
                  {additionalInfo.avoidThese.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => updateArrayField('avoidThese', index, e.target.value)}
                        placeholder="e.g., Tourist trap restaurants near major attractions"
                        className="flex-1 px-3 py-2 border rounded-lg"
                      />
                      {additionalInfo.avoidThese.length > 1 && (
                        <button
                          onClick={() => removeArrayField('avoidThese', index)}
                          className="text-red-600 hover:bg-red-50 p-1 rounded"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addArrayField('avoidThese')}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add another thing to avoid
                  </button>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium mb-2">Tags</label>
                  {additionalInfo.tags.map((tag, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={tag}
                        onChange={(e) => updateArrayField('tags', index, e.target.value)}
                        placeholder="e.g., foodie, budget-travel, photography"
                        className="flex-1 px-3 py-2 border rounded-lg"
                      />
                      {additionalInfo.tags.length > 1 && (
                        <button
                          onClick={() => removeArrayField('tags', index)}
                          className="text-red-600 hover:bg-red-50 p-1 rounded"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addArrayField('tags')}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add another tag
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 mt-8">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={performConversion}
                  disabled={converting}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {converting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Converting...</span>
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-4 h-4" />
                      <span>Create Guide</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ConvertToGuideButton