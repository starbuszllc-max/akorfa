-- Initial Akorfa schema (profiles, posts, comments, reactions, assessments, challenges)
-- Minimal version for MVP

-- Enable pgcrypto extension (for gen_random_uuid)
create extension if not exists pgcrypto;

-- Profiles table (extends auth.users)
create table if not exists profiles (
  id uuid primary key,
  username text unique not null,
  full_name text,
  avatar_url text,
  bio text,
  akorfa_score decimal default 0,
  layer_scores jsonb default '{}'::jsonb,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Assessments (simple storage for MVP)
create table if not exists assessments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  layer_scores jsonb not null,
  overall_score decimal not null,
  insights text,
  recommendations jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);
