-- SUPABASE DATABASE SETUP SCHEMA
-- Copy and paste this script into your Supabase SQL Editor and run it.
-- This script creates the tables and configures Row Level Security (RLS).

-- 1. Profiles / User Statistics Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  streak integer default 0,
  completion_history jsonb default '{}'::jsonb,
  last_active_date text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;
create policy "Users can view and edit their own profiles" on public.profiles
  for all using (auth.uid() = id);

-- 2. Sessions (Habit Rituals) Table
create table if not exists public.sessions (
  id bigint primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  icon text,
  color text,
  steps jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.sessions enable row level security;
create policy "Users can modify their own sessions" on public.sessions
  for all using (auth.uid() = user_id);

-- 3. Tasks Table
create table if not exists public.tasks (
  id bigint primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  cat text default 'other',
  done boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.tasks enable row level security;
create policy "Users can modify their own tasks" on public.tasks
  for all using (auth.uid() = user_id);

-- 4. Goals Table (Weekly, Monthly, Static)
create table if not exists public.goals (
  id bigint primary key,
  user_id uuid references auth.users on delete cascade not null,
  type text not null, -- 'weekly', 'monthly', 'static'
  name text not null,
  emoji text default '🎯',
  note text default '',
  cat text default 'other',
  target integer default 0,
  current integer default 0,
  progress integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.goals enable row level security;
create policy "Users can modify their own goals" on public.goals
  for all using (auth.uid() = user_id);

-- 5. Journals Table
create table if not exists public.journals (
  id bigint primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text,
  content text, -- Stored as stringified JSON blocks
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.journals enable row level security;
create policy "Users can modify their own journals" on public.journals
  for all using (auth.uid() = user_id);

-- 6. Workout Routines Table
create table if not exists public.workout_routines (
  id bigint primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  exercises jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.workout_routines enable row level security;
create policy "Users can modify their own workout routines" on public.workout_routines
  for all using (auth.uid() = user_id);

-- 7. Workout Logs (Gym history) Table
create table if not exists public.workout_logs (
  id bigint primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null, -- e.g., 'Upper Body A'
  duration integer default 0, -- Duration in seconds
  exercises jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.workout_logs enable row level security;
create policy "Users can modify their own workout logs" on public.workout_logs
  for all using (auth.uid() = user_id);
