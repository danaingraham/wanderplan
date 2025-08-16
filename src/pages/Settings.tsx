import { ChevronRight } from 'lucide-react'

export function Settings() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold text-[#333333] mb-6">Settings</h1>
      
      <div className="bg-white rounded-lg shadow-sm border border-black/5">
        <button className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between border-b border-black/5">
          <span className="text-[#333333]">Notifications</span>
          <ChevronRight className="h-5 w-5 text-[#333333]/30" />
        </button>
        
        <button className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between border-b border-black/5">
          <span className="text-[#333333]">Privacy</span>
          <ChevronRight className="h-5 w-5 text-[#333333]/30" />
        </button>
        
        <button className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between border-b border-black/5">
          <span className="text-[#333333]">Account</span>
          <ChevronRight className="h-5 w-5 text-[#333333]/30" />
        </button>
        
        <button className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between border-b border-black/5">
          <span className="text-[#333333]">About</span>
          <ChevronRight className="h-5 w-5 text-[#333333]/30" />
        </button>
        
        <button className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between">
          <span className="text-[#333333]">Help & Support</span>
          <ChevronRight className="h-5 w-5 text-[#333333]/30" />
        </button>
      </div>
    </div>
  )
}