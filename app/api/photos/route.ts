import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('photos')
    .select(`
      id, url, caption, pet_name, created_at, user_id,
      profiles!photos_user_id_fkey(username, avatar_url),
      photo_tags(tag)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const photos = await Promise.all((data ?? []).map(async (p: any) => {
    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('photo_id', p.id)
    return {
      id: p.id,
      url: p.url,
      caption: p.caption,
      pet_name: p.pet_name,
      created_at: p.created_at,
      user_id: p.user_id,
      profiles: p.profiles,
      tags: (p.photo_tags ?? []).map((t: any) => t.tag),
      likes_count: count ?? 0,
    }
  }))

  if (q) {
    const lower = q.toLowerCase()
    const filtered = photos.filter((p: any) =>
      p.pet_name.toLowerCase().includes(lower) ||
      p.caption?.toLowerCase().includes(lower) ||
      p.tags.some((t: string) => t.toLowerCase().includes(lower))
    )
    return NextResponse.json(filtered)
  }

  return NextResponse.json(photos)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  const { url, caption, pet_name, tags } = body

  const { data: { user } } = await supabase.auth.getUser()

  const { data: photo, error } = await supabase
    .from('photos')
    .insert({ url, caption, pet_name, user_id: user?.id ?? null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (tags && tags.length > 0) {
    await supabase.from('photo_tags').insert(
      tags.map((tag: string) => ({ photo_id: photo.id, tag: tag.trim().toLowerCase() }))
    )
  }

  return NextResponse.json(photo, { status: 201 })
}
