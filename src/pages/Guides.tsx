import { useNavigate } from 'react-router-dom'
import { useMyGuides, useSavedGuides, toggleSaveGuide, shareGuide, deleteGuide } from '../hooks/useGuides'
import GuideCard from '../components/GuideCard'
import EmptyState from '../components/EmptyState'

function SkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="aspect-[4/3] w-full bg-gray-200 animate-pulse" />
          <div className="p-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
          </div>
          <div className="px-3 pb-3">
            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

function InlineError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="border border-red-200 rounded-2xl p-4 bg-red-50">
      <p className="text-sm text-red-600">Failed to load guides. Please try again.</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 text-sm text-red-600 underline hover:text-red-700"
        >
          Retry
        </button>
      )}
    </div>
  )
}

export default function GuidesPage() {
  const my = useMyGuides()
  const saved = useSavedGuides()
  const navigate = useNavigate()

  const handleCreateGuide = () => {
    navigate('/guides/new')
    // Track event
    if (typeof window !== 'undefined' && (window as any).track) {
      (window as any).track('guides_click_create')
    }
  }

  const handleOpenGuide = (id: string) => {
    navigate(`/trip/${id}`)
    // Track event
    if (typeof window !== 'undefined' && (window as any).track) {
      (window as any).track('guides_open_guide', { id })
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold">Guides</h1>
      <p className="mt-1 text-sm text-gray-500">Create and collect travel guides.</p>

      {/* My Guides */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium">My Guides</h2>
          {(my.data?.length ?? 0) > 0 && (
            <button
              onClick={handleCreateGuide}
              className="rounded-xl bg-red-500 px-3 py-2 text-sm text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              + Create Guide
            </button>
          )}
        </div>

        {my.isLoading ? (
          <SkeletonGrid />
        ) : my.error ? (
          <InlineError onRetry={() => my.refetch?.()} />
        ) : (my.data?.length ?? 0) === 0 ? (
          <EmptyState
            title="No guides yet"
            body="Create your first guide to get started."
            primaryAction={{ label: 'Create Guide', onClick: handleCreateGuide }}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {my.data!.map(g => (
              <GuideCard
                key={g.id}
                guide={g}
                onEdit={(id) => navigate(`/guides/${id}/edit`)}
                onShare={(id) => shareGuide(id)}
                onDelete={(id) => deleteGuide(id)}
                onOpen={handleOpenGuide}
              />
            ))}
          </div>
        )}
      </section>

      {/* Saved Guides */}
      <section className="mt-10 pt-8 border-t">
        <h2 className="mb-3 text-lg font-medium">Saved Guides</h2>

        {saved.isLoading ? (
          <SkeletonGrid />
        ) : saved.error ? (
          <InlineError onRetry={() => saved.refetch?.()} />
        ) : (saved.data?.length ?? 0) === 0 ? (
          <EmptyState
            title="No saved guides yet"
            body="When you save guides from others, they'll appear here."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {saved.data!.map(g => (
              <GuideCard
                key={g.id}
                guide={g}
                onToggleSave={(id, next) => toggleSaveGuide(id, next)}
                onOpen={handleOpenGuide}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

// Also export with named export for backward compatibility
export function Guides() {
  return <GuidesPage />
}