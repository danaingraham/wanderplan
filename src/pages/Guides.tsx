import { useState } from 'react'
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

// Delete Confirmation Modal Component
function DeleteConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  guideName 
}: { 
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  guideName: string 
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                <h3 className="text-base font-semibold leading-6 text-gray-900">
                  Delete Guide
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete "{guideName}"? This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
              onClick={onConfirm}
            >
              Delete
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function GuidesPage() {
  const my = useMyGuides()
  const saved = useSavedGuides()
  const navigate = useNavigate()
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; guideId: string | null; guideName: string }>({
    isOpen: false,
    guideId: null,
    guideName: ''
  })

  const handleCreateGuide = () => {
    navigate('/guides/new')
    // Track event
    if (typeof window !== 'undefined' && (window as any).track) {
      (window as any).track('guides_click_create')
    }
  }

  const handleOpenGuide = (id: string) => {
    navigate(`/guides/${id}`)
    // Track event
    if (typeof window !== 'undefined' && (window as any).track) {
      (window as any).track('guides_open_guide', { id })
    }
  }

  const handleDeleteClick = (id: string, title: string) => {
    setDeleteModal({ isOpen: true, guideId: id, guideName: title })
  }

  const handleDeleteConfirm = () => {
    if (deleteModal.guideId) {
      deleteGuide(deleteModal.guideId)
      setDeleteModal({ isOpen: false, guideId: null, guideName: '' })
      // Refresh the page to show updated list
      window.location.reload()
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, guideId: null, guideName: '' })
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
                onDelete={(id) => handleDeleteClick(id, g.title)}
                onOpen={handleOpenGuide}
              />
            ))}
          </div>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        guideName={deleteModal.guideName}
      />

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