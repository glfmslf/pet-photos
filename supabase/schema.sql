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

-- Photos: anyone can read, anyone can insert (anon upload allowed)
create policy "photos_select" on photos for select using (true);
create policy "photos_insert" on photos for insert with check (true);
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

-- Photo tags: public read and insert
create policy "photo_tags_select" on photo_tags for select using (true);
create policy "photo_tags_insert" on photo_tags for insert with check (true);

-- Storage bucket for photos (run this separately if bucket doesn't exist)
-- insert into storage.buckets (id, name, public) values ('photos', 'photos', true);

-- Storage policies (run after creating bucket)
-- create policy "photos_storage_select" on storage.objects for select using (bucket_id = 'photos');
-- create policy "photos_storage_insert" on storage.objects for insert with check (bucket_id = 'photos');
