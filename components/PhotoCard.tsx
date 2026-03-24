import Image from 'next/image'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import type { Photo } from '@/types'
import { TagBadge } from './TagBadge'

export function PhotoCard({ photo }: { photo: Photo }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition group">
      <Link href={`/photo/${photo.id}`}>
        <div className="relative overflow-hidden">
          <Image
            src={photo.url}
            alt={photo.pet_name}
            width={400}
            height={300}
            className="w-full object-cover group-hover:scale-105 transition duration-300"
            style={{ height: 'auto' }}
          />
        </div>
      </Link>
      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="font-bold text-warm-700 text-sm">{photo.pet_name}</span>
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Heart className="w-3.5 h-3.5" /> {photo.likes_count ?? 0}
          </span>
        </div>
        {photo.caption && (
          <p className="text-xs text-gray-500 mb-2 line-clamp-2">{photo.caption}</p>
        )}
        {photo.tags && photo.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {photo.tags.slice(0, 3).map(tag => (
              <TagBadge key={tag} tag={tag} />
            ))}
          </div>
        )}
        {photo.profiles && (
          <Link href={`/profile/${photo.profiles.username}`} className="flex items-center gap-1.5 mt-2">
            <div className="w-5 h-5 rounded-full bg-warm-200 overflow-hidden flex items-center justify-center text-xs">
              {photo.profiles.avatar_url ? (
                <Image src={photo.profiles.avatar_url} alt="" width={20} height={20} />
              ) : '🐾'}
            </div>
            <span className="text-xs text-gray-400">@{photo.profiles.username}</span>
          </Link>
        )}
      </div>
    </div>
  )
}
