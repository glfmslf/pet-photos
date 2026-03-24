# 宠物照片分享网站 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pet photo sharing website with warm/cozy aesthetics, masonry grid layout, optional auth, and full social features (likes, comments, tags, search, profiles, follow, share).

**Architecture:** Next.js 15 App Router full-stack app backed by Supabase (PostgreSQL + Auth + Storage). Frontend uses Tailwind CSS with a warm orange/cream color palette. Photos are stored in Supabase Storage; metadata (likes, comments, follows, tags) live in PostgreSQL with Row Level Security.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Supabase (DB + Auth + Storage), `@supabase/ssr` for server-side auth, `react-masonry-css` for masonry layout, `react-dropzone` for upload UX.

---

## File Structure

```
pet-photos/
├── app/
│   ├── layout.tsx               # Root layout with Navbar + warm theme fonts
│   ├── page.tsx                 # Home — masonry photo feed
│   ├── globals.css              # Tailwind base + custom warm palette vars
│   ├── upload/
│   │   └── page.tsx             # Upload page (works anon + logged in)
│   ├── photo/
│   │   └── [id]/
│   │       └── page.tsx         # Photo detail: full image + likes/comments/share
│   ├── profile/
│   │   └── [username]/
│   │       └── page.tsx         # User profile with their photo grid + follow
│   ├── search/
│   │   └── page.tsx             # Search by tag or keyword
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts         # Supabase OAuth callback
│   └── api/
│       ├── photos/
│       │   └── route.ts         # POST /api/photos — save photo metadata
│       ├── likes/
│       │   └── route.ts         # POST/DELETE /api/likes
│       ├── comments/
│       │   └── route.ts         # GET/POST /api/comments
│       └── follow/
│           └── route.ts         # POST/DELETE /api/follow
├── components/
│   ├── Navbar.tsx               # Top nav: logo, search bar, upload btn, auth
│   ├── MasonryGrid.tsx          # react-masonry-css wrapper with PhotoCard
│   ├── PhotoCard.tsx            # Card: image + pet name + likes count + tag chips
│   ├── UploadForm.tsx           # Dropzone + caption + pet name + tag input
│   ├── AuthModal.tsx            # Supabase email/OAuth login modal
│   ├── LikeButton.tsx           # Heart toggle (prompts auth if anon)
│   ├── CommentSection.tsx       # Comments list + new comment form
│   ├── TagBadge.tsx             # Clickable tag chip
│   ├── ShareButton.tsx          # Copy link to clipboard
│   ├── FollowButton.tsx         # Follow/unfollow a user
│   └── SearchBar.tsx            # Tag/keyword search input
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Browser Supabase client
│   │   ├── server.ts            # Server Supabase client (cookies)
│   │   └── middleware.ts        # Session refresh middleware helper
│   └── utils.ts                 # cn(), formatDate(), truncate()
├── types/
│   └── index.ts                 # Photo, Profile, Comment, Tag types
├── middleware.ts                 # Next.js middleware for session refresh
├── supabase/
│   └── schema.sql               # Full DB schema with RLS policies
├── tailwind.config.ts           # Warm palette extension
├── .env.local.example           # Env var template
└── public/
    └── logo.svg                 # Paw print logo placeholder
```

---

### Task 1: Project Bootstrap

**Files:**
- Create: `package.json` (via npx)
- Create: `tailwind.config.ts`
- Create: `app/globals.css`
- Create: `.env.local.example`
- Create: `types/index.ts`
- Create: `lib/utils.ts`

- [ ] **Step 1: Scaffold Next.js project**

```bash
cd /Users/yuyou
npx create-next-app@latest pet-photos \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*" \
  --no-git
cd pet-photos
```

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr \
  react-masonry-css \
  react-dropzone \
  lucide-react \
  clsx \
  tailwind-merge
```

- [ ] **Step 3: Configure warm color palette in `tailwind.config.ts`**

Replace the `colors` extend block:

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        warm: {
          50:  '#fff8f4',
          100: '#ffe8d6',
          200: '#ffd4b8',
          300: '#ffbe94',
          400: '#ffa06b',
          500: '#ff7c3d',
          600: '#f05a1a',
          700: '#c44010',
          800: '#9a300b',
          900: '#7a2308',
        },
      },
      fontFamily: {
        sans: ['var(--font-nunito)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
export default config
```

- [ ] **Step 4: Update `app/globals.css`**

```css
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --font-nunito: 'Nunito', sans-serif;
}

body {
  @apply bg-warm-50 text-gray-800 font-sans;
}

/* Masonry override */
.my-masonry-grid {
  display: flex;
  margin-left: -16px;
  width: auto;
}
.my-masonry-grid_column {
  padding-left: 16px;
  background-clip: padding-box;
}
.my-masonry-grid_column > div {
  margin-bottom: 16px;
}
```

- [ ] **Step 5: Create `types/index.ts`**

```ts
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
```

- [ ] **Step 6: Create `lib/utils.ts`**

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + '…' : str
}
```

- [ ] **Step 7: Create `.env.local.example`**

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

- [ ] **Step 8: Verify dev server starts**

```bash
npm run dev
```
Expected: Server running at http://localhost:3000 with default Next.js page.

- [ ] **Step 9: Commit**

```bash
git init && git add -A && git commit -m "feat: bootstrap Next.js + Tailwind + warm theme"
```

---

### Task 2: Supabase Setup & Database Schema

**Files:**
- Create: `supabase/schema.sql`
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `middleware.ts`

- [ ] **Step 1: Create a Supabase project**

Go to https://supabase.com, create a new project. Copy the Project URL and anon key into `.env.local` (copy from `.env.local.example`).

- [ ] **Step 2: Create `supabase/schema.sql`**

```sql
-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Profiles (auto-created on signup via trigger)
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  bio text,
  created_at timestamptz default now()
);

-- Photos
create table photos (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete set null,
  url text not null,
  caption text,
  pet_name text not null,
  created_at timestamptz default now()
);

-- Tags (many photos can have many tags)
create table photo_tags (
  photo_id uuid references photos(id) on delete cascade,
  tag text not null,
  primary key (photo_id, tag)
);

-- Likes
create table likes (
  photo_id uuid references photos(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (photo_id, user_id)
);

-- Comments
create table comments (
  id uuid default uuid_generate_v4() primary key,
  photo_id uuid references photos(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- Follows
create table follows (
  follower_id uuid references profiles(id) on delete cascade,
  following_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id)
);

-- Auto-create profile on user signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- RLS Policies
alter table profiles enable row level security;
alter table photos enable row level security;
alter table photo_tags enable row level security;
alter table likes enable row level security;
alter table comments enable row level security;
alter table follows enable row level security;

-- Photos: anyone can read, authenticated users can insert
create policy "photos_select" on photos for select using (true);
create policy "photos_insert" on photos for insert with check (true); -- anon allowed
create policy "photos_delete" on photos for delete using (auth.uid() = user_id);

-- Profiles: anyone can read
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- Likes: anyone can read, authenticated to write
create policy "likes_select" on likes for select using (true);
create policy "likes_insert" on likes for insert with check (auth.uid() = user_id);
create policy "likes_delete" on likes for delete using (auth.uid() = user_id);

-- Comments: anyone can read, authenticated to write
create policy "comments_select" on comments for select using (true);
create policy "comments_insert" on comments for insert with check (auth.uid() = user_id);
create policy "comments_delete" on comments for delete using (auth.uid() = user_id);

-- Follows: anyone can read, authenticated to write
create policy "follows_select" on follows for select using (true);
create policy "follows_insert" on follows for insert with check (auth.uid() = follower_id);
create policy "follows_delete" on follows for delete using (auth.uid() = follower_id);

-- Photo tags: public read
create policy "photo_tags_select" on photo_tags for select using (true);
create policy "photo_tags_insert" on photo_tags for insert with check (true);

-- Storage bucket for photos
insert into storage.buckets (id, name, public) values ('photos', 'photos', true);

create policy "photos_storage_select" on storage.objects for select using (bucket_id = 'photos');
create policy "photos_storage_insert" on storage.objects for insert with check (bucket_id = 'photos');
```

- [ ] **Step 3: Run schema in Supabase SQL Editor**

In the Supabase dashboard → SQL Editor → paste contents of `supabase/schema.sql` → Run.

Verify: Tables `profiles`, `photos`, `photo_tags`, `likes`, `comments`, `follows` exist.

- [ ] **Step 4: Create `lib/supabase/client.ts`**

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 5: Create `lib/supabase/server.ts`**

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 6: Create `middleware.ts`**

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()
  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 7: Create `app/auth/callback/route.ts`**

```ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}/`)
}
```

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: add Supabase schema + client setup"
```

---

### Task 3: Core Layout & Navigation

**Files:**
- Modify: `app/layout.tsx`
- Create: `components/Navbar.tsx`
- Create: `components/SearchBar.tsx`
- Create: `components/AuthModal.tsx`

- [ ] **Step 1: Create `components/SearchBar.tsx`**

```tsx
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
```

- [ ] **Step 2: Create `components/AuthModal.tsx`**

```tsx
'use client'
import { createClient } from '@/lib/supabase/client'
import { X } from 'lucide-react'
import { useState } from 'react'

interface AuthModalProps {
  onClose: () => void
}

export function AuthModal({ onClose }: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-warm-700">🐾 登录 / 注册</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        {sent ? (
          <p className="text-sm text-gray-600 text-center py-4">
            魔法链接已发送到 <strong>{email}</strong>，请查收邮件！
          </p>
        ) : (
          <form onSubmit={handleMagicLink} className="space-y-3">
            <p className="text-sm text-gray-500">登录后可点赞、评论、关注其他铲屎官 🐶</p>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="你的邮箱"
              required
              className="w-full border border-warm-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-warm-400"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-warm-500 hover:bg-warm-600 text-white rounded-xl py-2 text-sm font-semibold transition"
            >
              {loading ? '发送中...' : '发送魔法链接'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `components/Navbar.tsx`**

```tsx
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
```

- [ ] **Step 4: Update `app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/Navbar'

export const metadata: Metadata = {
  title: '毛毛相册 — 分享你的可爱宠物',
  description: '上传、浏览、分享宠物照片，结识更多爱宠人士',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  )
}
```

- [ ] **Step 5: Verify**

```bash
npm run dev
```
Expected: Warm navbar visible at http://localhost:3000, "毛毛相册" logo, search bar, upload button.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add Navbar, SearchBar, AuthModal"
```

---

### Task 4: Home Feed — Masonry Photo Grid

**Files:**
- Create: `components/TagBadge.tsx`
- Create: `components/PhotoCard.tsx`
- Create: `components/MasonryGrid.tsx`
- Create: `app/api/photos/route.ts`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create `components/TagBadge.tsx`**

```tsx
import Link from 'next/link'
import { cn } from '@/lib/utils'

const TAG_COLORS = [
  'bg-orange-100 text-orange-700',
  'bg-pink-100 text-pink-700',
  'bg-yellow-100 text-yellow-700',
  'bg-green-100 text-green-700',
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
]

function tagColor(tag: string) {
  let hash = 0
  for (const c of tag) hash = (hash * 31 + c.charCodeAt(0)) % TAG_COLORS.length
  return TAG_COLORS[hash]
}

export function TagBadge({ tag, className }: { tag: string; className?: string }) {
  return (
    <Link href={`/search?q=${encodeURIComponent(tag)}`}>
      <span className={cn('inline-block text-xs font-semibold px-2 py-0.5 rounded-full', tagColor(tag), className)}>
        #{tag}
      </span>
    </Link>
  )
}
```

- [ ] **Step 2: Create `components/PhotoCard.tsx`**

```tsx
import Image from 'next/image'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import type { Photo } from '@/types'
import { TagBadge } from './TagBadge'

export function PhotoCard({ photo }: { photo: Photo }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition group">
      <Link href={`/photo/${photo.id}`}>
        <div className="relative overflow-hidden">
          <Image
            src={photo.url}
            alt={photo.pet_name}
            width={400}
            height={300}
            className="w-full object-cover group-hover:scale-105 transition duration-300"
            style={{ height: 'auto' }}
          />
        </div>
      </Link>
      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="font-bold text-warm-700 text-sm">{photo.pet_name}</span>
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Heart className="w-3.5 h-3.5" /> {photo.likes_count ?? 0}
          </span>
        </div>
        {photo.caption && (
          <p className="text-xs text-gray-500 mb-2 line-clamp-2">{photo.caption}</p>
        )}
        {photo.tags && photo.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {photo.tags.slice(0, 3).map(tag => (
              <TagBadge key={tag} tag={tag} />
            ))}
          </div>
        )}
        {photo.profiles && (
          <Link href={`/profile/${photo.profiles.username}`} className="flex items-center gap-1.5 mt-2">
            <div className="w-5 h-5 rounded-full bg-warm-200 overflow-hidden">
              {photo.profiles.avatar_url && (
                <Image src={photo.profiles.avatar_url} alt="" width={20} height={20} />
              )}
            </div>
            <span className="text-xs text-gray-400">@{photo.profiles.username}</span>
          </Link>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `components/MasonryGrid.tsx`**

```tsx
import Masonry from 'react-masonry-css'
import { PhotoCard } from './PhotoCard'
import type { Photo } from '@/types'

const BREAKPOINTS = {
  default: 4,
  1100: 3,
  768: 2,
  480: 1,
}

export function MasonryGrid({ photos }: { photos: Photo[] }) {
  if (photos.length === 0) {
    return (
      <div className="text-center py-24 text-warm-300">
        <p className="text-5xl mb-4">🐾</p>
        <p className="text-lg font-semibold text-warm-500">还没有照片，来上传第一张吧！</p>
      </div>
    )
  }

  return (
    <Masonry breakpointCols={BREAKPOINTS} className="my-masonry-grid" columnClassName="my-masonry-grid_column">
      {photos.map(photo => (
        <PhotoCard key={photo.id} photo={photo} />
      ))}
    </Masonry>
  )
}
```

- [ ] **Step 4: Create `app/api/photos/route.ts`**

```ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tag = searchParams.get('tag')
  const q = searchParams.get('q')
  const username = searchParams.get('username')
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const offset = parseInt(searchParams.get('offset') ?? '0')

  const supabase = await createClient()

  let query = supabase
    .from('photos')
    .select(`
      id, url, caption, pet_name, created_at, user_id,
      profiles(username, avatar_url),
      photo_tags(tag),
      likes(count)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (username) {
    query = query.eq('profiles.username', username)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const photos = (data ?? []).map((p: any) => ({
    ...p,
    tags: (p.photo_tags ?? []).map((t: any) => t.tag),
    likes_count: p.likes?.[0]?.count ?? 0,
    profiles: p.profiles,
  }))

  // Filter by tag or keyword in memory (simple approach)
  const filtered = photos.filter((p: any) => {
    if (tag) return p.tags.includes(tag)
    if (q) {
      const lower = q.toLowerCase()
      return (
        p.pet_name.toLowerCase().includes(lower) ||
        p.caption?.toLowerCase().includes(lower) ||
        p.tags.some((t: string) => t.toLowerCase().includes(lower))
      )
    }
    return true
  })

  return NextResponse.json(filtered)
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
```

- [ ] **Step 5: Update `app/page.tsx`**

```tsx
import { MasonryGrid } from '@/components/MasonryGrid'
import type { Photo } from '@/types'

async function getPhotos(): Promise<Photo[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL ? '' : 'http://localhost:3000'}/api/photos`, {
    cache: 'no-store',
  })
  if (!res.ok) return []
  return res.json()
}

export default async function HomePage() {
  const photos = await getPhotos()

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-extrabold text-warm-700">🐾 毛毛相册</h1>
        <p className="text-warm-400 mt-1">分享你家最可爱的毛孩子</p>
      </div>
      <MasonryGrid photos={photos} />
    </div>
  )
}
```

- [ ] **Step 6: Verify masonry renders**

```bash
npm run dev
```
Open http://localhost:3000 — should see empty state or photos if any exist in Supabase.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: masonry home feed with PhotoCard and API route"
```

---

### Task 5: Photo Upload

**Files:**
- Create: `components/UploadForm.tsx`
- Create: `app/upload/page.tsx`

- [ ] **Step 1: Create `components/UploadForm.tsx`**

```tsx
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

    // Upload to Supabase Storage
    const ext = file.name.split('.').pop()
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { data: storageData, error: storageError } = await supabase.storage
      .from('photos')
      .upload(filename, file)

    if (storageError) { setError(storageError.message); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(filename)

    // Save metadata
    const res = await fetch('/api/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: publicUrl, caption, pet_name: petName, tags }),
    })

    if (!res.ok) { setError('上传失败，请重试'); setUploading(false); return }

    const photo = await res.json()
    router.push(`/photo/${photo.id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg mx-auto">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
          isDragActive ? 'border-warm-500 bg-warm-50' : 'border-warm-200 hover:border-warm-400'
        }`}
      >
        <input {...getInputProps()} />
        {preview ? (
          <div className="relative">
            <Image src={preview} alt="preview" width={400} height={300} className="mx-auto rounded-xl object-contain max-h-64" />
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

      {/* Pet name */}
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

      {/* Caption */}
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

      {/* Tags */}
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
          <button type="button" onClick={addTag} className="bg-warm-100 text-warm-700 px-3 py-2 rounded-xl text-sm font-semibold hover:bg-warm-200">
            添加
          </button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 bg-warm-100 text-warm-700 text-xs px-2 py-1 rounded-full">
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
```

- [ ] **Step 2: Create `app/upload/page.tsx`**

```tsx
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
```

- [ ] **Step 3: Verify upload works**

1. Go to http://localhost:3000/upload
2. Drop an image, fill in pet name, click "分享照片"
3. Should redirect to `/photo/<id>` (404 for now — that's ok)
4. Check Supabase Storage → `photos` bucket has the file
5. Check `photos` table has a new row

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: photo upload with Supabase Storage"
```

---

### Task 6: Photo Detail Page

**Files:**
- Create: `components/LikeButton.tsx`
- Create: `components/ShareButton.tsx`
- Create: `components/CommentSection.tsx`
- Create: `app/api/likes/route.ts`
- Create: `app/api/comments/route.ts`
- Create: `app/photo/[id]/page.tsx`

- [ ] **Step 1: Create `app/api/likes/route.ts`**

```ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { photo_id } = await request.json()
  const { error } = await supabase.from('likes').insert({ photo_id, user_id: user.id })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { photo_id } = await request.json()
  await supabase.from('likes').delete().match({ photo_id, user_id: user.id })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Create `app/api/comments/route.ts`**

```ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const photo_id = searchParams.get('photo_id')
  if (!photo_id) return NextResponse.json([])

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('comments')
    .select('*, profiles(username, avatar_url)')
    .eq('photo_id', photo_id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { photo_id, content } = await request.json()
  const { data, error } = await supabase
    .from('comments')
    .insert({ photo_id, user_id: user.id, content })
    .select('*, profiles(username, avatar_url)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
```

- [ ] **Step 3: Create `components/LikeButton.tsx`**

```tsx
'use client'
import { createClient } from '@/lib/supabase/client'
import { Heart } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AuthModal } from './AuthModal'
import { cn } from '@/lib/utils'

export function LikeButton({ photoId, initialCount }: { photoId: string; initialCount: number }) {
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(initialCount)
  const [showAuth, setShowAuth] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function checkLike() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('likes').select('photo_id').eq('photo_id', photoId).eq('user_id', user.id).single()
      setLiked(!!data)
    }
    checkLike()
  }, [photoId])

  async function toggle() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setShowAuth(true); return }

    if (liked) {
      await fetch('/api/likes', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ photo_id: photoId }) })
      setCount(c => c - 1)
    } else {
      await fetch('/api/likes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ photo_id: photoId }) })
      setCount(c => c + 1)
    }
    setLiked(!liked)
  }

  return (
    <>
      <button onClick={toggle} className="flex items-center gap-2 group">
        <Heart className={cn('w-6 h-6 transition', liked ? 'fill-red-500 text-red-500' : 'text-gray-400 group-hover:text-red-400')} />
        <span className="text-sm font-semibold text-gray-600">{count}</span>
      </button>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  )
}
```

- [ ] **Step 4: Create `components/ShareButton.tsx`**

```tsx
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
    <button onClick={handleCopy} className="flex items-center gap-2 text-gray-400 hover:text-warm-500 transition">
      <Link2 className="w-5 h-5" />
      <span className="text-sm">{copied ? '已复制！' : '分享'}</span>
    </button>
  )
}
```

- [ ] **Step 5: Create `components/CommentSection.tsx`**

```tsx
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
      .then(setComments)
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
            <div className="w-8 h-8 rounded-full bg-warm-200 shrink-0" />
            <div className="bg-warm-50 rounded-2xl px-4 py-2 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-warm-700">@{comment.profiles?.username ?? '匿名'}</span>
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
```

- [ ] **Step 6: Create `app/photo/[id]/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LikeButton } from '@/components/LikeButton'
import { ShareButton } from '@/components/ShareButton'
import { CommentSection } from '@/components/CommentSection'
import { TagBadge } from '@/components/TagBadge'
import { formatDate } from '@/lib/utils'

export default async function PhotoPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: photo } = await supabase
    .from('photos')
    .select('*, profiles(username, avatar_url), photo_tags(tag), likes(count)')
    .eq('id', params.id)
    .single()

  if (!photo) notFound()

  const tags: string[] = (photo.photo_tags ?? []).map((t: any) => t.tag)
  const likesCount: number = photo.likes?.[0]?.count ?? 0

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl overflow-hidden shadow-md">
        <div className="relative">
          <Image
            src={photo.url}
            alt={photo.pet_name}
            width={800}
            height={600}
            className="w-full object-contain max-h-[500px] bg-warm-50"
          />
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-2xl font-extrabold text-warm-700">{photo.pet_name}</h1>
              <p className="text-xs text-gray-400 mt-0.5">{formatDate(photo.created_at)}</p>
            </div>
            <div className="flex items-center gap-4">
              <LikeButton photoId={photo.id} initialCount={likesCount} />
              <ShareButton />
            </div>
          </div>
          {photo.caption && <p className="text-gray-600 text-sm mb-4">{photo.caption}</p>}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map(tag => <TagBadge key={tag} tag={tag} />)}
            </div>
          )}
          {photo.profiles && (
            <Link href={`/profile/${photo.profiles.username}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-warm-600">
              <div className="w-7 h-7 rounded-full bg-warm-200" />
              @{photo.profiles.username}
            </Link>
          )}
          <CommentSection photoId={photo.id} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Verify photo detail**

Upload a photo, then click on it from the home feed. Should see the full photo, like button, share button, comment section.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: photo detail page with likes, comments, share"
```

---

### Task 7: Search Page

**Files:**
- Create: `app/search/page.tsx`

- [ ] **Step 1: Create `app/search/page.tsx`**

```tsx
import { MasonryGrid } from '@/components/MasonryGrid'
import type { Photo } from '@/types'

interface Props {
  searchParams: { q?: string }
}

async function searchPhotos(q: string): Promise<Photo[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL ? '' : 'http://localhost:3000'}/api/photos?q=${encodeURIComponent(q)}`,
    { cache: 'no-store' }
  )
  if (!res.ok) return []
  return res.json()
}

export default async function SearchPage({ searchParams }: Props) {
  const q = searchParams.q ?? ''
  const photos = q ? await searchPhotos(q) : []

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-warm-700">
          {q ? `搜索"${q}"的结果` : '搜索'}
        </h1>
        {q && <p className="text-warm-400 text-sm mt-1">共找到 {photos.length} 张照片</p>}
      </div>
      {q ? <MasonryGrid photos={photos} /> : (
        <p className="text-center text-warm-300 py-16 text-lg">在上方输入关键词或标签开始搜索 🔍</p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify search**

Upload a photo with tag "猫", then search for "猫" — should appear in results.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: search page by keyword and tag"
```

---

### Task 8: User Profile & Follow

**Files:**
- Create: `components/FollowButton.tsx`
- Create: `app/api/follow/route.ts`
- Create: `app/profile/[username]/page.tsx`

- [ ] **Step 1: Create `app/api/follow/route.ts`**

```ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { following_id } = await request.json()
  const { error } = await supabase.from('follows').insert({ follower_id: user.id, following_id })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { following_id } = await request.json()
  await supabase.from('follows').delete().match({ follower_id: user.id, following_id })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Create `components/FollowButton.tsx`**

```tsx
'use client'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { AuthModal } from './AuthModal'
import { cn } from '@/lib/utils'

export function FollowButton({ targetUserId, initialFollowing }: { targetUserId: string; initialFollowing: boolean }) {
  const [following, setFollowing] = useState(initialFollowing)
  const [showAuth, setShowAuth] = useState(false)
  const supabase = createClient()

  async function toggle() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setShowAuth(true); return }
    if (following) {
      await fetch('/api/follow', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ following_id: targetUserId }) })
    } else {
      await fetch('/api/follow', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ following_id: targetUserId }) })
    }
    setFollowing(!following)
  }

  return (
    <>
      <button
        onClick={toggle}
        className={cn(
          'px-4 py-1.5 rounded-full text-sm font-semibold transition',
          following
            ? 'bg-warm-100 text-warm-700 hover:bg-red-100 hover:text-red-600'
            : 'bg-warm-500 text-white hover:bg-warm-600'
        )}
      >
        {following ? '已关注' : '+ 关注'}
      </button>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  )
}
```

- [ ] **Step 3: Create `app/profile/[username]/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { MasonryGrid } from '@/components/MasonryGrid'
import { FollowButton } from '@/components/FollowButton'
import { notFound } from 'next/navigation'
import type { Photo } from '@/types'

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', params.username)
    .single()

  if (!profile) notFound()

  // Get their photos
  const { data: photosRaw } = await supabase
    .from('photos')
    .select('*, photo_tags(tag), likes(count)')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  const photos: Photo[] = (photosRaw ?? []).map((p: any) => ({
    ...p,
    tags: (p.photo_tags ?? []).map((t: any) => t.tag),
    likes_count: p.likes?.[0]?.count ?? 0,
  }))

  // Follower counts
  const { count: followersCount } = await supabase
    .from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id)
  const { count: followingCount } = await supabase
    .from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id)

  // Is current user following?
  let isFollowing = false
  if (user && user.id !== profile.id) {
    const { data: followRow } = await supabase.from('follows')
      .select('follower_id').eq('follower_id', user.id).eq('following_id', profile.id).single()
    isFollowing = !!followRow
  }

  const isOwn = user?.id === profile.id

  return (
    <div>
      {/* Profile header */}
      <div className="bg-white rounded-3xl p-6 mb-6 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-warm-200 shrink-0 overflow-hidden flex items-center justify-content text-4xl">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : '🐾'}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl font-extrabold text-warm-700">@{profile.username}</h1>
          {profile.bio && <p className="text-gray-500 text-sm mt-1">{profile.bio}</p>}
          <div className="flex gap-4 mt-2 justify-center sm:justify-start text-sm text-gray-500">
            <span><strong className="text-warm-700">{photos.length}</strong> 张照片</span>
            <span><strong className="text-warm-700">{followersCount ?? 0}</strong> 粉丝</span>
            <span><strong className="text-warm-700">{followingCount ?? 0}</strong> 关注</span>
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
```

- [ ] **Step 4: Verify profile page**

Go to `/profile/<your-username>` — should see photo count, follower counts, masonry grid of their photos.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: user profile page with follow/unfollow"
```

---

### Task 9: Final Polish & Deployment

**Files:**
- Modify: `next.config.ts` (add Supabase image domain)
- Create: `README.md`

- [ ] **Step 1: Update `next.config.ts` for image domains**

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
```

- [ ] **Step 2: Run build to catch errors**

```bash
npm run build
```
Expected: Build succeeds with no errors. Fix any TypeScript errors found.

- [ ] **Step 3: Deploy to Vercel**

```bash
npx vercel
```
Follow prompts. Add env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in Vercel dashboard → Project → Settings → Environment Variables.

- [ ] **Step 4: Final commit**

```bash
git add -A && git commit -m "feat: production config and deployment"
```

---

## Summary

| Task | Feature | Status |
|------|---------|--------|
| 1 | Project bootstrap (Next.js + Tailwind + warm theme) | ☐ |
| 2 | Supabase schema + DB setup | ☐ |
| 3 | Navbar + Auth modal | ☐ |
| 4 | Home masonry feed | ☐ |
| 5 | Photo upload (anonymous + logged in) | ☐ |
| 6 | Photo detail (likes, comments, share) | ☐ |
| 7 | Search page | ☐ |
| 8 | User profiles + follow | ☐ |
| 9 | Build check + Vercel deploy | ☐ |
