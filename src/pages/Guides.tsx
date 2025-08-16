import { useState } from 'react'
import { BookOpenText, Bookmark } from 'lucide-react'

export function Guides() {
  const [activeTab, setActiveTab] = useState<'authored' | 'saved'>('authored')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Sub-tabs */}
      <div className="flex gap-2 mb-6 border-b border-black/10">
        <button
          onClick={() => setActiveTab('authored')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'authored' 
              ? 'text-[#333333] border-b-2 border-[#FFC300]' 
              : 'text-[#333333]/60 hover:text-[#333333]'
          }`}
        >
          <BookOpenText className="inline-block w-4 h-4 mr-2" />
          My Guides
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'saved' 
              ? 'text-[#333333] border-b-2 border-[#FFC300]' 
              : 'text-[#333333]/60 hover:text-[#333333]'
          }`}
        >
          <Bookmark className="inline-block w-4 h-4 mr-2" />
          Saved Guides
        </button>
      </div>

      {/* Content */}
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="bg-[#FFC300]/10 rounded-full w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center mx-auto mb-6">
            {activeTab === 'authored' ? (
              <BookOpenText className="h-8 w-8 sm:h-12 sm:w-12 text-[#FFC300]" />
            ) : (
              <Bookmark className="h-8 w-8 sm:h-12 sm:w-12 text-[#FFC300]" />
            )}
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-[#333333] mb-2">
            {activeTab === 'authored' ? 'No guides created yet' : 'No saved guides'}
          </h3>
          <p className="text-[#333333]/60 text-sm sm:text-base px-4">
            {activeTab === 'authored' 
              ? 'Share your travel expertise by creating your first guide.'
              : 'Save guides from the community to reference later.'}
          </p>
        </div>
      </div>
    </div>
  )
}