'use client'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { AuthModal } from './AuthModal'
import { cn } from '@/lib/utils'

export function FollowButton({
  targetUserId,
  initialFollowing,
}: {
  targetUserId: string
  initialFollowing: boolean
}) {
  const [following, setFollowing] = useState(initialFollowing)
  const [showAuth, setShowAuth] = useState(false)
  const supabase = createClient()

  async function toggle() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setShowAuth(true); return }

    if (following) {
      await fetch('/api/follow', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ following_id: targetUserId }),
      })
    } else {
      await fetch('/api/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ following_id: targetUserId }),
      })
    }
    setFollowing(!following)
  }

  return (
    <>
      <button
        onClick={toggle}
        className={cn(
          'px-4 py-1.5 rounded-full text-sm font-semibold transition',
          following
            ? 'bg-warm-100 text-warm-700 hover:bg-red-100 hover:text-red-600'
            : 'bg-warm-500 text-white hover:bg-warm-600'
        )}
      >
        {following ? '已关注' : '+ 关注'}
      </button>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  )
}
