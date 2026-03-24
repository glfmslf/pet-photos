import { MasonryGrid } from '@/components/MasonryGrid'
import type { Photo } from '@/types'

async function getPhotos(): Promise<Photo[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/photos`, { cache: 'no-store' })
    if (!res.ok) return []
    return res.json()
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
