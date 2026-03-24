export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  bio: string | null
  created_at: string
  _count?: { photos: number; followers: number; following: number }
}

export interface Photo {
  id: string
  user_id: string | null
  url: string
  caption: string | null
  pet_name: string
  created_at: string
  profiles?: Pick<Profile, 'username' | 'avatar_url'>
  tags?: string[]
  likes_count?: number
  comments_count?: number
  liked_by_user?: boolean
}

export interface Comment {
  id: string
  photo_id: string
  user_id: string
  content: string
  created_at: string
  profiles?: Pick<Profile, 'username' | 'avatar_url'>
}
