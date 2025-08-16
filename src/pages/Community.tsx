import { Users2 } from 'lucide-react'

export function Community() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="bg-[#4ECDC4]/10 rounded-full w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center mx-auto mb-6">
            <Users2 className="h-8 w-8 sm:h-12 sm:w-12 text-[#4ECDC4]" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-[#333333] mb-2">
            Community Coming Soon
          </h3>
          <p className="text-[#333333]/60 text-sm sm:text-base px-4">
            Connect with fellow travelers, share experiences, and discover new destinations together.
          </p>
        </div>
      </div>
    </div>
  )
}