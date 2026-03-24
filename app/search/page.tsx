import { MasonryGrid } from '@/components/MasonryGrid'
import { createClient } from '@/lib/supabase/server'
import type { Photo } from '@/types'

interface Props {
  searchParams: Promise<{ q?: string }>
}

async function searchPhotos(q: string): Promise<Photo[]> {
  try {
    const supabase = await createClient()
    const lower = q.toLowerCase()

    const { data, error } = await supabase
      .from('photos')
      .select('*, profiles!photos_user_id_fkey(username, avatar_url), photo_tags(tag)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error || !data) return []

    const filtered = data.filter((p: any) =>
      p.pet_name?.toLowerCase().includes(lower) ||
      p.caption?.toLowerCase().includes(lower) ||
      (p.photo_tags ?? []).some((t: any) => t.tag.toLowerCase().includes(lower))
    )

    return filtered.map((p: any) => ({
      id: p.id,
      url: p.url,
      caption: p.caption,
      pet_name: p.pet_name,
      created_at: p.created_at,
      user_id: p.user_id,
      profiles: p.profiles,
      tags: (p.photo_tags ?? []).map((t: any) => t.tag),
      likes_count: 0,
    }))
  } catch {
    return []
  }
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams
  const photos = q ? await searchPhotos(q) : []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-warm-700">
          {q ? `搜索"${q}"的结果` : '搜索'}
        </h1>
        {q && (
          <p className="text-warm-400 text-sm mt-1">共找到 {photos.length} 张照片</p>
        )}
      </div>
      {q ? (
        <MasonryGrid photos={photos} />
      ) : (
        <p className="text-center text-warm-300 py-16 text-lg">
          在上方输入关键词或标签开始搜索 🔍
        </p>
      )}
    </div>
  )
}
