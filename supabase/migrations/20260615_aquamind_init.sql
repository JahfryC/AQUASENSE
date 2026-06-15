-- AquaMind initial schema
-- Run this in: https://supabase.com/dashboard/project/zsvqyhzzavmlqxxoaezc/sql/new

create extension if not exists "uuid-ossp";

create table if not exists aquamind_data (
  id           uuid default uuid_generate_v4() primary key,
  user_id      uuid references auth.users(id) on delete cascade not null unique,
  data         jsonb not null default '{}',
  updated_at   timestamptz default now() not null
);

alter table aquamind_data enable row level security;

create policy "users own their data"
  on aquamind_data for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
