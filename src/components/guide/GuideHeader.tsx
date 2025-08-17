import React from 'react'
import type { GuideMetadata } from '../../types/guide'

interface GuideHeaderProps {
  metadata: GuideMetadata
}

const GuideHeader: React.FC<GuideHeaderProps> = ({ metadata }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {metadata.author.profilePicture ? (
            <img
              src={metadata.author.profilePicture}
              alt={metadata.author.name}
              className="w-12 h-12 rounded-full"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-gray-600 font-semibold text-lg">
                {metadata.author.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="font-semibold text-lg">{metadata.author.name}</p>
            <p className="text-sm text-gray-500">
              Traveled in {new Date(0, metadata.travelDate.month - 1).toLocaleString('default', { month: 'long' })} {metadata.travelDate.year}
            </p>
          </div>
        </div>
        
        {metadata.isPublished && (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
            Published
          </span>
        )}
      </div>
    </div>
  )
}

export default GuideHeader