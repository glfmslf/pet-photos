'use client'
import { createClient } from '@/lib/supabase/client'
import { Heart } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AuthModal } from './AuthModal'
import { cn } from '@/lib/utils'

export function LikeButton({ photoId, initialCount }: { photoId: string; initialCount: number }) {
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(initialCount)
  const [showAuth, setShowAuth] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function checkLike() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('likes')
        .select('photo_id')
        .eq('photo_id', photoId)
        .eq('user_id', user.id)
        .single()
      setLiked(!!data)
    }
    checkLike()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoId])

  async function toggle() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setShowAuth(true); return }

    if (liked) {
      await fetch('/api/likes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_id: photoId }),
      })
      setCount(c => c - 1)
    } else {
      await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_id: photoId }),
      })
      setCount(c => c + 1)
    }
    setLiked(!liked)
  }

  return (
    <>
      <button onClick={toggle} className="flex items-center gap-2 group">
        <Heart
          className={cn(
            'w-6 h-6 transition',
            liked ? 'fill-red-500 text-red-500' : 'text-gray-400 group-hover:text-red-400'
          )}
        />
        <span className="text-sm font-semibold text-gray-600">{count}</span>
      </button>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  )
}
