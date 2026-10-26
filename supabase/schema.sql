-- FR. PAU 25 RSVP database schema
-- Run this in Supabase SQL Editor before deploying the Edge Function.
create extension if not exists pgcrypto;

create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(trim(full_name)) between 2 and 120),
  phone text not null check (char_length(trim(phone)) between 5 and 30),
  email text,
  affiliation text,
  attendance text not null check (attendance in ('attending','declined')),
  seats integer not null default 0 check (seats between 0 and 10),
  guest_names text not null default '',
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rsvp_seat_consistency check (
    (attendance = 'attending' and seats between 1 and 10)
    or (attendance = 'declined' and seats = 0)
  )
);

create index if not exists rsvps_created_at_idx on public.rsvps (created_at desc);
create index if not exists rsvps_name_idx on public.rsvps (lower(full_name));
alter table public.rsvps enable row level security;

-- Admin accounts are explicitly allow-listed here.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;

-- A signed-in user can check their own admin status. No public guest reads.
drop policy if exists "Admins can read own admin record" on public.admin_users;
create policy "Admins can read own admin record"
on public.admin_users for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Admins can read RSVP records" on public.rsvps;
create policy "Admins can read RSVP records"
on public.rsvps for select to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));

drop policy if exists "Admins can update RSVP records" on public.rsvps;
create policy "Admins can update RSVP records"
on public.rsvps for update to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())))
with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));

drop policy if exists "Admins can delete RSVP records" on public.rsvps;
create policy "Admins can delete RSVP records"
on public.rsvps for delete to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));

-- Intentionally no anon SELECT/INSERT/UPDATE/DELETE policies on rsvps.
-- Public submissions are handled by the validated submit-rsvp Edge Function.
-- After creating your Supabase Auth user, add it as an administrator using:
-- insert into public.admin_users (user_id) values ('YOUR_AUTH_USER_UUID');
