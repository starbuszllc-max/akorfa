-- Create trigger to populate profiles table when a new auth user is created
-- This function assumes Supabase auth is in use (auth.users)

create or replace function public.handle_new_auth_user()
returns trigger as $$
begin
  -- insert a profile row when a new user is created by auth
  insert into public.profiles(id, username, full_name, created_at)
  values (new.id, new.email, new.raw_user_meta->>'full_name', now())
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger on auth.users; depending on Supabase deployment this may need to be
-- created in the auth schema or via the Supabase dashboard. Keep here for reference.
-- Note: Some Supabase setups require using `auth` schema to add triggers; adjust as needed.
-- create trigger on auth.users after insert
-- execute procedure public.handle_new_auth_user();

-- Enable Row Level Security and add simple policies for MVP
alter table if exists public.profiles enable row level security;
alter table if exists public.assessments enable row level security;

-- Profiles: allow public select, allow authenticated users to insert/update their own profile
create policy "public_profiles_select" on public.profiles
  for select using (true);

create policy "profiles_insert_authenticated" on public.profiles
  for insert with check (auth.role() = 'authenticated' and new.id = auth.uid());

create policy "profiles_update_owner" on public.profiles
  for update using (auth.role() = 'authenticated' and id = auth.uid());

-- Assessments: allow authenticated users to insert assessments where user_id = auth.uid()
create policy "assessments_insert_authenticated" on public.assessments
  for insert with check (auth.role() = 'authenticated' and (new.user_id = auth.uid() or new.user_id is null));

create policy "assessments_select_public" on public.assessments
  for select using (true);
