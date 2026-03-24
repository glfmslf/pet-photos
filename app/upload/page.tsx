'use client'
import { UploadForm } from '@/components/UploadForm'
import { AuthModal } from '@/components/AuthModal'
import { useState } from 'react'

export default function UploadPage() {
  const [showAuth, setShowAuth] = useState(false)

  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-warm-700">上传照片</h1>
        <p className="text-warm-400 mt-1">让大家认识你的毛孩子吧 🐶🐱</p>
      </div>
      <UploadForm onAuthRequired={() => setShowAuth(true)} />
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}
