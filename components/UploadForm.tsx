'use client'
import { createClient } from '@/lib/supabase/client'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import { Upload, X } from 'lucide-react'
import Image from 'next/image'

export function UploadForm({ onAuthRequired }: { onAuthRequired: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [petName, setPetName] = useState('')
  const [caption, setCaption] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  })

  function addTag() {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t)) setTags([...tags, t])
    setTagInput('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !petName.trim()) return
    setUploading(true)
    setError(null)

    const ext = file.name.split('.').pop()
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error: storageError } = await supabase.storage
      .from('photos')
      .upload(filename, file)

    if (storageError) {
      setError(storageError.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(filename)

    const res = await fetch('/api/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: publicUrl, caption, pet_name: petName, tags }),
    })

    if (!res.ok) {
      setError('上传失败，请重试')
      setUploading(false)
      return
    }

    const photo = await res.json()
    router.push(`/photo/${photo.id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg mx-auto">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
          isDragActive ? 'border-warm-500 bg-warm-50' : 'border-warm-200 hover:border-warm-400'
        }`}
      >
        <input {...getInputProps()} />
        {preview ? (
          <div className="relative">
            <Image
              src={preview}
              alt="preview"
              width={400}
              height={300}
              className="mx-auto rounded-xl object-contain max-h-64"
            />
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setFile(null); setPreview(null) }}
              className="absolute top-2 right-2 bg-white rounded-full p-1 shadow"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="w-10 h-10 text-warm-300 mx-auto" />
            <p className="text-warm-500 font-semibold">拖放照片到这里，或点击选择</p>
            <p className="text-xs text-gray-400">支持 JPG、PNG、GIF，最大 10MB</p>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-warm-700 mb-1">宠物名字 *</label>
        <input
          value={petName}
          onChange={e => setPetName(e.target.value)}
          placeholder="例如：小橘、旺财"
          required
          className="w-full border border-warm-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-warm-400"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-warm-700 mb-1">描述（可选）</label>
        <textarea
          value={caption}
          onChange={e => setCaption(e.target.value)}
          placeholder="分享一下这张照片的故事..."
          rows={3}
          className="w-full border border-warm-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-warm-400 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-warm-700 mb-1">标签</label>
        <div className="flex gap-2">
          <input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
            placeholder="猫、狗、兔子..."
            className="flex-1 border border-warm-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-warm-400"
          />
          <button
            type="button"
            onClick={addTag}
            className="bg-warm-100 text-warm-700 px-3 py-2 rounded-xl text-sm font-semibold hover:bg-warm-200"
          >
            添加
          </button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map(tag => (
              <span
                key={tag}
                className="flex items-center gap-1 bg-warm-100 text-warm-700 text-xs px-2 py-1 rounded-full"
              >
                #{tag}
                <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={uploading || !file || !petName.trim()}
        className="w-full bg-warm-500 hover:bg-warm-600 disabled:opacity-50 text-white font-bold py-3 rounded-2xl transition"
      >
        {uploading ? '上传中...' : '🐾 分享照片'}
      </button>
    </form>
  )
}
