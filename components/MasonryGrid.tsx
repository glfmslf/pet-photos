'use client'
import Masonry from 'react-masonry-css'
import { PhotoCard } from './PhotoCard'
import type { Photo } from '@/types'

const BREAKPOINTS = {
  default: 4,
  1100: 3,
  768: 2,
  480: 1,
}

export function MasonryGrid({ photos }: { photos: Photo[] }) {
  if (photos.length === 0) {
    return (
      <div className="text-center py-24 text-warm-300">
        <p className="text-5xl mb-4">🐾</p>
        <p className="text-lg font-semibold text-warm-500">还没有照片，来上传第一张吧！</p>
      </div>
    )
  }

  return (
    <Masonry
      breakpointCols={BREAKPOINTS}
      className="my-masonry-grid"
      columnClassName="my-masonry-grid_column"
    >
      {photos.map(photo => (
        <div key={photo.id}>
          <PhotoCard photo={photo} />
        </div>
      ))}
    </Masonry>
  )
}
