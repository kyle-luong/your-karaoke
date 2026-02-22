-- Schema matching PRD Section 11
-- Run: supabase db reset or paste into Supabase SQL editor

create extension if not exists "uuid-ossp";

create table songs (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  artist text not null,
  genre text,
  duration_seconds integer not null,
  audio_url text not null,
  lyrics_raw text not null,
  lrc_data jsonb not null default '[]',
  thumbnail_url text,
  is_explicit boolean not null default true,
  child_safe boolean not null default false,
  created_at timestamptz not null default now()
);

create table projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  song_id uuid not null references songs(id),
  created_at timestamptz not null default now()
);

create table versions (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id),
  type text not null check (type in ('original', 'parody')),
  lyrics_text text not null,
  lrc_data jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table reports (
  id uuid primary key default uuid_generate_v4(),
  version_id uuid not null references versions(id),
  summary_text text not null,
  narration_audio_url text,
  transformation_metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table parties (
  id uuid primary key default uuid_generate_v4(),
  host_user_id uuid not null,
  version_id uuid not null references versions(id),
  invite_code text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table party_state (
  id uuid primary key default uuid_generate_v4(),
  party_id uuid not null unique references parties(id),
  is_playing boolean not null default false,
  playback_position_ms integer not null default 0,
  updated_at timestamptz not null default now()
);

-- Enable realtime on party_state for broadcast
alter publication supabase_realtime add table party_state;

-- RLS policies (permissive for hackathon — tighten post-MVP)
alter table songs enable row level security;
create policy "Songs are publicly readable" on songs for select using (true);

alter table projects enable row level security;
create policy "Projects are publicly readable" on projects for select using (true);
create policy "Anyone can insert projects" on projects for insert with check (true);

alter table versions enable row level security;
create policy "Versions are publicly readable" on versions for select using (true);
create policy "Anyone can insert versions" on versions for insert with check (true);

alter table reports enable row level security;
create policy "Reports are publicly readable" on reports for select using (true);
create policy "Anyone can insert reports" on reports for insert with check (true);

alter table parties enable row level security;
create policy "Parties are publicly readable" on parties for select using (true);
create policy "Anyone can insert parties" on parties for insert with check (true);

alter table party_state enable row level security;
create policy "Party state is publicly readable" on party_state for select using (true);
create policy "Anyone can insert party state" on party_state for insert with check (true);
create policy "Anyone can update party state" on party_state for update using (true);
