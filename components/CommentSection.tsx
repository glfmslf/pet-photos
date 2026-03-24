'use client'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import type { Comment } from '@/types'
import { formatDate } from '@/lib/utils'
import { AuthModal } from './AuthModal'

export function CommentSection({ photoId }: { photoId: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [showAuth, setShowAuth] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetch(`/api/comments?photo_id=${photoId}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setComments(data)
      })
  }, [photoId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setShowAuth(true); return }
    if (!text.trim()) return
    setLoading(true)
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo_id: photoId, content: text }),
    })
    const newComment = await res.json()
    setComments(prev => [...prev, newComment])
    setText('')
    setLoading(false)
  }

  return (
    <div className="mt-6">
      <h3 className="font-bold text-warm-700 mb-4">评论 ({comments.length})</h3>
      <div className="space-y-3 mb-4">
        {comments.map(comment => (
          <div key={comment.id} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-warm-200 shrink-0 flex items-center justify-center text-sm">
              🐾
            </div>
            <div className="bg-warm-50 rounded-2xl px-4 py-2 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-warm-700">
                  @{comment.profiles?.username ?? '匿名'}
                </span>
                <span className="text-xs text-gray-400">{formatDate(comment.created_at)}</span>
              </div>
              <p className="text-sm text-gray-700">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="说点什么..."
          className="flex-1 border border-warm-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-warm-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-warm-500 hover:bg-warm-600 text-white text-sm font-semibold px-4 py-2 rounded-full transition"
        >
          发送
        </button>
      </form>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}
