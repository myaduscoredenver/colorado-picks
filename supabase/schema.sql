-- ============================================================
-- Colorado Family Picks — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- PROFILES (one per user, extends auth.users)
create table public.profiles (
  id           uuid references auth.users on delete cascade not null primary key,
  username     text unique not null,
  display_name text,
  created_at   timestamptz default now() not null,
  constraint username_length check (char_length(username) >= 3 and char_length(username) <= 30),
  constraint username_format check (username ~ '^[a-z0-9_]+$')
);

-- SPOTS
create table public.spots (
  id               uuid default gen_random_uuid() primary key,
  user_id          uuid references public.profiles(id) on delete cascade not null,
  name             text not null,
  category         text not null default 'Other',
  lat              double precision not null,
  lng              double precision not null,
  note             text,
  note_is_public   boolean default true not null,
  is_public        boolean default true not null,
  recommended_by   text,
  created_at       timestamptz default now() not null
);

-- ── Row Level Security ──────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.spots     enable row level security;

-- Profiles: anyone can read; only owner can write
create policy "Profiles viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Spots: public spots readable by all; private only by owner
create policy "Public spots viewable by everyone"
  on public.spots for select
  using (is_public = true or auth.uid() = user_id);

create policy "Users can insert own spots"
  on public.spots for insert
  with check (auth.uid() = user_id);

create policy "Users can update own spots"
  on public.spots for update
  using (auth.uid() = user_id);

create policy "Users can delete own spots"
  on public.spots for delete
  using (auth.uid() = user_id);
