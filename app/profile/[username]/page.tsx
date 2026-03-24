import { createClient } from '@/lib/supabase/server'
import { MasonryGrid } from '@/components/MasonryGrid'
import { FollowButton } from '@/components/FollowButton'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import type { Photo } from '@/types'

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  const { data: photosRaw } = await supabase
    .from('photos')
    .select('*, photo_tags(tag)')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  const photos: Photo[] = await Promise.all((photosRaw ?? []).map(async (p: any) => {
    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('photo_id', p.id)
    return {
      ...p,
      tags: (p.photo_tags ?? []).map((t: any) => t.tag),
      likes_count: count ?? 0,
    }
  }))

  const { count: followersCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', profile.id)

  const { count: followingCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', profile.id)

  let isFollowing = false
  if (user && user.id !== profile.id) {
    const { data: followRow } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', user.id)
      .eq('following_id', profile.id)
      .single()
    isFollowing = !!followRow
  }

  const isOwn = user?.id === profile.id

  return (
    <div>
      <div className="bg-white rounded-3xl p-6 mb-6 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-warm-200 shrink-0 overflow-hidden flex items-center justify-center text-4xl">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.username}
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          ) : '🐾'}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl font-extrabold text-warm-700">@{profile.username}</h1>
          {profile.bio && (
            <p className="text-gray-500 text-sm mt-1">{profile.bio}</p>
          )}
          <div className="flex gap-4 mt-2 justify-center sm:justify-start text-sm text-gray-500">
            <span>
              <strong className="text-warm-700">{photos.length}</strong> 张照片
            </span>
            <span>
              <strong className="text-warm-700">{followersCount ?? 0}</strong> 粉丝
            </span>
            <span>
              <strong className="text-warm-700">{followingCount ?? 0}</strong> 关注
            </span>
          </div>
        </div>
        {!isOwn && user && (
          <FollowButton targetUserId={profile.id} initialFollowing={isFollowing} />
        )}
      </div>

      <MasonryGrid photos={photos} />
    </div>
  )
}
