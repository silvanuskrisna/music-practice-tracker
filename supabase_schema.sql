-- Music Practice Tracker - Supabase schema
-- Single-user version: no Supabase Auth and no RLS.
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  weekly_target_seconds integer not null default 300 check (weekly_target_seconds > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  practice_date date not null default current_date,
  instrument text not null check (instrument in ('Gitar', 'Piano', 'Drum')),
  category text not null check (category in ('Teknik Dasar', 'Repertoire', 'Teori')),
  material text not null check (length(trim(material)) > 0),
  song_title text,
  notes text,
  duration_seconds integer not null check (duration_seconds > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint repertoire_song_title_required check (
    category <> 'Repertoire'
    or (song_title is not null and length(trim(song_title)) > 0)
  )
);

create index if not exists practice_sessions_student_date_idx
  on public.practice_sessions(student_id, practice_date desc);

alter table public.students disable row level security;
alter table public.practice_sessions disable row level security;

grant usage on schema public to anon;
grant select, insert, update, delete on public.students to anon;
grant select, insert, update, delete on public.practice_sessions to anon;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_students_updated_at on public.students;
create trigger set_students_updated_at
before update on public.students
for each row
execute function public.set_updated_at();

drop trigger if exists set_practice_sessions_updated_at on public.practice_sessions;
create trigger set_practice_sessions_updated_at
before update on public.practice_sessions
for each row
execute function public.set_updated_at();

create or replace view public.weekly_student_totals as
select
  ps.student_id,
  date_trunc('week', ps.practice_date)::date as week_start,
  sum(ps.duration_seconds)::integer as total_duration_seconds,
  count(*)::integer as session_count
from public.practice_sessions ps
group by ps.student_id, date_trunc('week', ps.practice_date)::date;

grant select on public.weekly_student_totals to anon;
