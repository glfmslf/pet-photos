'use client'
import { Link2 } from 'lucide-react'
import { useState } from 'react'

export function ShareButton() {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 text-gray-400 hover:text-warm-500 transition"
    >
      <Link2 className="w-5 h-5" />
      <span className="text-sm">{copied ? '已复制！' : '分享'}</span>
    </button>
  )
}
