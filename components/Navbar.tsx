'use client'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AuthModal } from './AuthModal'
import { SearchBar } from './SearchBar'
import type { User } from '@supabase/supabase-js'
import { Upload, LogOut, User as UserIcon } from 'lucide-react'

export function Navbar() {
  const [user, setUser] = useState<User | null>(null)
  const [showAuth, setShowAuth] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-warm-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 font-extrabold text-warm-600 text-xl shrink-0">
            🐾 <span>毛毛相册</span>
          </Link>

          <SearchBar />

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/upload"
              className="flex items-center gap-1.5 bg-warm-500 hover:bg-warm-600 text-white text-sm font-semibold px-3 py-1.5 rounded-full transition"
            >
              <Upload className="w-4 h-4" /> 上传
            </Link>

            {user ? (
              <div className="flex items-center gap-1">
                <Link href={`/profile/${user.email?.split('@')[0]}`}>
                  <UserIcon className="w-5 h-5 text-warm-500 hover:text-warm-700" />
                </Link>
                <button onClick={handleSignOut} title="退出">
                  <LogOut className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="text-sm text-warm-600 hover:text-warm-800 font-semibold"
              >
                登录
              </button>
            )}
          </div>
        </div>
      </nav>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  )
}
