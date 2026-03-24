'use client'
import { createClient } from '@/lib/supabase/client'
import { X } from 'lucide-react'
import { useState } from 'react'

interface AuthModalProps {
  onClose: () => void
}

export function AuthModal({ onClose }: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        if (error.message.includes('Email not confirmed')) {
          setError('邮箱未验证，请到 Supabase 控制台 Authentication → Users 确认账号')
        } else if (error.message.includes('Invalid login credentials')) {
          setError('邮箱或密码错误，或账号不存在')
        } else {
          setError(error.message)
        }
        setLoading(false)
        return
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) { setError(error.message); setLoading(false); return }
    }

    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-warm-700">🐾 {mode === 'login' ? '登录' : '注册'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-sm text-gray-500">登录后可点赞、评论、关注其他铲屎官 🐶</p>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="邮箱"
            required
            className="w-full border border-warm-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-warm-400"
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="密码"
            required
            minLength={6}
            className="w-full border border-warm-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-warm-400"
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-warm-500 hover:bg-warm-600 text-white rounded-xl py-2 text-sm font-semibold transition"
          >
            {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
          </button>
          <p className="text-center text-xs text-gray-400">
            {mode === 'login' ? '没有账号？' : '已有账号？'}
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null) }}
              className="text-warm-500 font-semibold ml-1"
            >
              {mode === 'login' ? '立即注册' : '去登录'}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
