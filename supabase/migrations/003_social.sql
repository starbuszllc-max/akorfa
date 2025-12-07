-- Social features: posts, comments, reactions, user_events

create table if not exists posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  content text not null,
  layer text check (layer in ('environment','bio','internal','cultural','social','conscious','existential')) default 'social',
  post_type text check (post_type in ('post','article','question','achievement','challenge','insight')) default 'post',
  like_count integer default 0,
  comment_count integer default 0,
  view_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  content text not null,
  is_helpful boolean default false,
  created_at timestamptz default now()
);

create table if not exists reactions (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  reaction_type text check (reaction_type in ('like','love','insightful','helpful','celebrate')),
  created_at timestamptz default now(),
  unique (post_id, user_id, reaction_type)
);

create table if not exists user_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  event_type text not null,
  points_earned integer not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Simple RLS policies for posts (MVP)
alter table if exists public.posts enable row level security;
create policy "posts_select_public" on public.posts for select using (true);
create policy "posts_insert_authenticated" on public.posts for insert with check (auth.role() = 'authenticated' and (new.user_id = auth.uid() or new.user_id is null));
create policy "reactions_insert_authenticated" on public.reactions for insert with check (auth.role() = 'authenticated' and (new.user_id = auth.uid() or new.user_id is null));


-- Note: run these migrations via Supabase CLI or SQL editor
