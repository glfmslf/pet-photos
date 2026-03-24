import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LikeButton } from '@/components/LikeButton'
import { ShareButton } from '@/components/ShareButton'
import { CommentSection } from '@/components/CommentSection'
import { TagBadge } from '@/components/TagBadge'
import { formatDate } from '@/lib/utils'

export default async function PhotoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: photo, error } = await supabase
    .from('photos')
    .select('*, profiles!photos_user_id_fkey(username, avatar_url), photo_tags(tag)')
    .eq('id', id)
    .single()

  if (error) console.error('[photo page] supabase error:', error)
  if (!photo) notFound()

  const { count: likesCount } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('photo_id', id)

  const tags: string[] = (photo.photo_tags ?? []).map((t: any) => t.tag)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl overflow-hidden shadow-md">
        <div className="relative bg-warm-50">
          <Image
            src={photo.url}
            alt={photo.pet_name}
            width={800}
            height={600}
            className="w-full object-contain max-h-[500px]"
          />
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-2xl font-extrabold text-warm-700">{photo.pet_name}</h1>
              <p className="text-xs text-gray-400 mt-0.5">{formatDate(photo.created_at)}</p>
            </div>
            <div className="flex items-center gap-4">
              <LikeButton photoId={photo.id} initialCount={likesCount ?? 0} />
              <ShareButton />
            </div>
          </div>

          {photo.caption && (
            <p className="text-gray-600 text-sm mb-4">{photo.caption}</p>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map(tag => <TagBadge key={tag} tag={tag} />)}
            </div>
          )}

          {photo.profiles && (
            <Link
              href={`/profile/${photo.profiles.username}`}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-warm-600 transition"
            >
              <div className="w-7 h-7 rounded-full bg-warm-200 flex items-center justify-center text-xs">
                🐾
              </div>
              @{photo.profiles.username}
            </Link>
          )}

          <CommentSection photoId={photo.id} />
        </div>
      </div>
    </div>
  )
}
