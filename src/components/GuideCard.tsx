import { useState, useEffect } from 'react'
import { User } from 'lucide-react'
import { getDestinationImage, getDestinationGradient } from '../services/destinationImageService'

export interface Guide {
  id: string;
  title: string;
  coverImageUrl?: string;
  destination?: string;
  updatedAt: string; // ISO
  author: { id: string; name: string; avatarUrl?: string };
  isMine: boolean;   // true if created by current user
  isSaved: boolean;  // true if user has saved it
}

interface GuideCardProps {
  guide: Guide;
  onEdit?: (id: string) => void;
  onShare?: (id: string) => void;
  onDelete?: (id: string) => void;
  onToggleSave?: (id: string, next: boolean) => void;
  onOpen: (id: string) => void;
}

export default function GuideCard({
  guide,
  onEdit,
  onShare,
  onDelete,
  onToggleSave,
  onOpen,
}: GuideCardProps) {
  const [destinationImage, setDestinationImage] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(false)
  
  useEffect(() => {
    // Only fetch image if no cover image and destination exists
    if (!guide.coverImageUrl && guide.destination) {
      setImageLoading(true)
      getDestinationImage(guide.destination)
        .then(imageUrl => {
          if (imageUrl) {
            setDestinationImage(imageUrl)
          }
        })
        .finally(() => {
          setImageLoading(false)
        })
    }
  }, [guide.destination, guide.coverImageUrl])
  return (
    <div className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
      <button
        onClick={() => onOpen(guide.id)}
        className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
        aria-label={`Open guide ${guide.title}`}
      >
        <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100">
          {guide.coverImageUrl ? (
            <img
              src={guide.coverImageUrl}
              alt=""
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          ) : destinationImage ? (
            <img
              src={destinationImage}
              alt={guide.destination || ''}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          ) : (
            <div className={`h-full w-full bg-gradient-to-br ${getDestinationGradient(guide.destination)} ${imageLoading ? 'animate-pulse' : ''}`} />
          )}
        </div>
        <div className="p-3">
          <div className="text-sm font-medium line-clamp-2">{guide.title}</div>
          <div className="mt-1 text-xs text-gray-500">
            {guide.destination ?? ''}{guide.destination ? ' • ' : ''}Updated {new Date(guide.updatedAt).toLocaleDateString()}
          </div>
        </div>
      </button>

      <div className="flex items-center justify-between px-3 pb-3">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {guide.author.avatarUrl ? (
            <img src={guide.author.avatarUrl} className="h-5 w-5 rounded-full" alt="" />
          ) : (
            <div className="h-5 w-5 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="h-3 w-3 text-gray-500" />
            </div>
          )}
          <span>{guide.author.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {guide.isMine ? (
            <>
              {onEdit && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(guide.id);
                  }} 
                  className="text-xs text-gray-600 hover:text-gray-900 underline"
                >
                  Edit
                </button>
              )}
              {onShare && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare(guide.id);
                  }} 
                  className="text-xs text-gray-600 hover:text-gray-900 underline"
                >
                  Share
                </button>
              )}
              {onDelete && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(guide.id);
                  }} 
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Delete
                </button>
              )}
            </>
          ) : (
            onToggleSave && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSave(guide.id, !guide.isSaved);
                }}
                className="text-xs text-gray-600 hover:text-gray-900 underline"
              >
                {guide.isSaved ? 'Unsave' : 'Save'}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// Also export as named export for backward compatibility with Trip type
export const LegacyGuideCard = function({ guide }: { guide: any }) {
  // Convert Trip to Guide format
  const convertedGuide: Guide = {
    id: guide.id,
    title: guide.title || 'Untitled Guide',
    coverImageUrl: guide.cover_image,
    destination: guide.destination,
    updatedAt: guide.updated_at || guide.updated_date || new Date().toISOString(),
    author: {
      id: guide.created_by || 'unknown',
      name: 'Travel Guide',
      avatarUrl: undefined
    },
    isMine: false,
    isSaved: false
  };

  return (
    <GuideCard
      guide={convertedGuide}
      onOpen={(id) => window.location.href = `/trip/${id}`}
    />
  );
}

// Export named export GuideCard pointing to LegacyGuideCard for backward compatibility
export { LegacyGuideCard as GuideCard };