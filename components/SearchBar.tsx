'use client'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function SearchBar() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400 w-4 h-4" />
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="搜索宠物标签..."
        className="pl-9 pr-4 py-2 rounded-full bg-warm-100 border border-warm-200 text-sm focus:outline-none focus:ring-2 focus:ring-warm-400 w-48 md:w-64"
      />
    </form>
  )
}
