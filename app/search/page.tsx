import { MasonryGrid } from '@/components/MasonryGrid'
import type { Photo } from '@/types'

interface Props {
  searchParams: Promise<{ q?: string }>
}

async function searchPhotos(q: string): Promise<Photo[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const res = await fetch(
      `${baseUrl}/api/photos?q=${encodeURIComponent(q)}`,
      { cache: 'no-store' }
    )
    if (!res.ok) return []
    return res.json()
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
