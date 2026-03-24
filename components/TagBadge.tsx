import Link from 'next/link'
import { cn } from '@/lib/utils'

const TAG_COLORS = [
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
  'bg-yellow-100 text-yellow-700',
  'bg-green-100 text-green-700',
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
]

function tagColor(tag: string) {
  let hash = 0
  for (const c of tag) hash = (hash * 31 + c.charCodeAt(0)) % TAG_COLORS.length
  return TAG_COLORS[Math.abs(hash)]
}

export function TagBadge({ tag, className }: { tag: string; className?: string }) {
  return (
    <Link href={`/search?q=${encodeURIComponent(tag)}`}>
      <span className={cn('inline-block text-xs font-semibold px-2 py-0.5 rounded-full', tagColor(tag), className)}>
        #{tag}
      </span>
    </Link>
  )
}
