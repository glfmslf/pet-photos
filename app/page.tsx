import { MasonryGrid } from '@/components/MasonryGrid'
import { createClient } from '@/lib/supabase/server'
import type { Photo } from '@/types'

async function getPhotos(): Promise<Photo[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('photos')
      .select('*, profiles!photos_user_id_fkey(username, avatar_url), photo_tags(tag)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error || !data) return []

    return await Promise.all(data.map(async (p: any) => {
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('photo_id', p.id)
      return {
        id: p.id,
        url: p.url,
        caption: p.caption,
        pet_name: p.pet_name,
        created_at: p.created_at,
        user_id: p.user_id,
        profiles: p.profiles,
        tags: (p.photo_tags ?? []).map((t: any) => t.tag),
        likes_count: count ?? 0,
      }
    }))
  } catch {
    return []
  }
}

export default async function HomePage() {
  const photos = await getPhotos()

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-extrabold text-warm-700">🐾 毛毛相册</h1>
        <p className="text-warm-400 mt-1">分享你家最可爱的毛孩子</p>
      </div>
      <MasonryGrid photos={photos} />
    </div>
  )
}
