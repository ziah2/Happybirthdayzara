-- ============================================================================
-- OAUSTECH Student Hub — Supabase schema, RLS, storage, triggers
-- Run this in the Supabase SQL editor (or `supabase db push`). Idempotent-ish:
-- safe to re-run; drops policies before recreating.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('student', 'contributor', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type request_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type note_category as enum ('lecture_note', 'past_question', 'assignment', 'powerpoint');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Reference tables
-- ---------------------------------------------------------------------------
create table if not exists public.faculties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  abbreviation text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  faculty_id uuid not null references public.faculties(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (faculty_id, name)
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments(id) on delete cascade,
  level int not null check (level in (100, 200, 300, 400, 500)),
  semester text not null,
  course_code text not null,
  course_title text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Profiles (mirrors auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null,
  matric_number text,
  faculty_id uuid references public.faculties(id),
  department_id uuid references public.departments(id),
  level int check (level in (100, 200, 300, 400, 500)),
  role user_role not null default 'student',
  email_verified boolean not null default false,
  position text,
  banned boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Contributor requests
-- ---------------------------------------------------------------------------
create table if not exists public.contributor_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  full_name text not null,
  matric_number text not null,
  faculty_id uuid not null references public.faculties(id),
  department_id uuid not null references public.departments(id),
  level int not null check (level in (100, 200, 300, 400, 500)),
  reason text not null,
  upload_types text not null,
  id_card_url text,
  portfolio_url text,
  status request_status not null default 'pending',
  rejection_reason text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Content
-- ---------------------------------------------------------------------------
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  uploaded_by uuid not null references public.users(id) on delete cascade,
  title text not null,
  file_url text not null,
  file_type text not null,
  category note_category not null default 'lecture_note',
  downloads int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.note_ratings (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  unique (note_id, user_id)
);

create table if not exists public.note_reports (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  body text not null,
  category text not null default 'General',
  likes int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.news_comments (
  id uuid primary key default gen_random_uuid(),
  news_id uuid not null references public.news(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.news_likes (
  id uuid primary key default gen_random_uuid(),
  news_id uuid not null references public.news(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (news_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Chat (one room per department)
-- ---------------------------------------------------------------------------
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null unique references public.departments(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  body text,
  image_url text,
  reply_to_id uuid references public.messages(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  note_id uuid not null references public.notes(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, note_id)
);

create table if not exists public.downloads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  note_id uuid not null references public.notes(id) on delete cascade,
  downloaded_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Helper functions (security definer so they can read public.users under RLS)
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.users where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_verified()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.users where id = auth.uid() and email_verified = true and banned = false);
$$;

create or replace function public.can_publish()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'contributor' and email_verified = true and banned = false
  );
$$;

-- ---------------------------------------------------------------------------
-- Auth triggers
-- ---------------------------------------------------------------------------
-- Create a profile row whenever an auth user is created. Google logins arrive
-- pre-verified (email_confirmed_at set); email signups start unverified.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, full_name, matric_number, faculty_id, department_id, level, role, email_verified)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    nullif(new.raw_user_meta_data->>'matric_number', ''),
    (nullif(new.raw_user_meta_data->>'faculty_id', ''))::uuid,
    (nullif(new.raw_user_meta_data->>'department_id', ''))::uuid,
    (nullif(new.raw_user_meta_data->>'level', ''))::int,
    'student',
    new.email_confirmed_at is not null
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep profile.email_verified in sync when the email gets confirmed.
create or replace function public.handle_user_confirmed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email_confirmed_at is not null and (old.email_confirmed_at is null) then
    update public.users set email_verified = true where id = new.id;
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed
  after update on auth.users
  for each row execute function public.handle_user_confirmed();

-- Prevent a user from escalating their own role / lifting their own ban.
-- Only the service role (used by admin server actions) bypasses this.
create or replace function public.guard_profile_privileges()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.role() = 'service_role' or public.is_admin() then
    return new;
  end if;
  if new.role is distinct from old.role then
    raise exception 'You cannot change your own role.';
  end if;
  if new.banned is distinct from old.banned then
    raise exception 'You cannot change ban status.';
  end if;
  return new;
end $$;

drop trigger if exists guard_profile_privileges_trg on public.users;
create trigger guard_profile_privileges_trg
  before update on public.users
  for each row execute function public.guard_profile_privileges();

-- Maintain news.likes counter from news_likes.
create or replace function public.sync_news_likes()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.news n
  set likes = (select count(*) from public.news_likes where news_id = coalesce(new.news_id, old.news_id))
  where n.id = coalesce(new.news_id, old.news_id);
  return null;
end $$;

drop trigger if exists sync_news_likes_trg on public.news_likes;
create trigger sync_news_likes_trg
  after insert or delete on public.news_likes
  for each row execute function public.sync_news_likes();

-- Atomic download-counter increment (avoids read-modify-write races).
create or replace function public.increment_note_downloads(p_note_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.notes set downloads = downloads + 1 where id = p_note_id;
$$;
grant execute on function public.increment_note_downloads(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS on every table
-- ---------------------------------------------------------------------------
alter table public.faculties enable row level security;
alter table public.departments enable row level security;
alter table public.courses enable row level security;
alter table public.users enable row level security;
alter table public.contributor_requests enable row level security;
alter table public.notes enable row level security;
alter table public.note_ratings enable row level security;
alter table public.note_reports enable row level security;
alter table public.news enable row level security;
alter table public.news_comments enable row level security;
alter table public.news_likes enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.bookmarks enable row level security;
alter table public.downloads enable row level security;

-- ---------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------

-- Reference data: everyone authenticated can read; only admin writes.
drop policy if exists faculties_read on public.faculties;
create policy faculties_read on public.faculties for select using (true);
drop policy if exists faculties_admin on public.faculties;
create policy faculties_admin on public.faculties for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists departments_read on public.departments;
create policy departments_read on public.departments for select using (true);
drop policy if exists departments_admin on public.departments;
create policy departments_admin on public.departments for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists courses_read on public.courses;
create policy courses_read on public.courses for select using (true);
drop policy if exists courses_admin on public.courses;
create policy courses_admin on public.courses for all using (public.is_admin()) with check (public.is_admin());

-- Users: read all profiles (needed for author names); write only own row.
drop policy if exists users_read on public.users;
create policy users_read on public.users for select using (true);
drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());
drop policy if exists users_admin_all on public.users;
create policy users_admin_all on public.users for all using (public.is_admin()) with check (public.is_admin());

-- Contributor requests: student creates own; admin manages all.
drop policy if exists cr_insert_own on public.contributor_requests;
create policy cr_insert_own on public.contributor_requests for insert
  with check (user_id = auth.uid() and public.is_verified());
drop policy if exists cr_read on public.contributor_requests;
create policy cr_read on public.contributor_requests for select
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists cr_admin on public.contributor_requests;
create policy cr_admin on public.contributor_requests for all
  using (public.is_admin()) with check (public.is_admin());

-- Notes: everyone reads; only approved contributors insert own; edit/delete own; admin all.
drop policy if exists notes_read on public.notes;
create policy notes_read on public.notes for select using (true);
drop policy if exists notes_insert on public.notes;
create policy notes_insert on public.notes for insert
  with check (uploaded_by = auth.uid() and public.can_publish());
drop policy if exists notes_update_own on public.notes;
create policy notes_update_own on public.notes for update
  using (uploaded_by = auth.uid() or public.is_admin())
  with check (uploaded_by = auth.uid() or public.is_admin());
drop policy if exists notes_delete_own on public.notes;
create policy notes_delete_own on public.notes for delete
  using (uploaded_by = auth.uid() or public.is_admin());

-- Ratings / reports: verified users write own; everyone reads ratings.
drop policy if exists ratings_read on public.note_ratings;
create policy ratings_read on public.note_ratings for select using (true);
drop policy if exists ratings_write on public.note_ratings;
create policy ratings_write on public.note_ratings for all
  using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_verified());

drop policy if exists reports_insert on public.note_reports;
create policy reports_insert on public.note_reports for insert
  with check (user_id = auth.uid() and public.is_verified());
drop policy if exists reports_read on public.note_reports;
create policy reports_read on public.note_reports for select
  using (user_id = auth.uid() or public.is_admin());

-- News: everyone reads; approved contributors publish + edit/delete own; admin all.
drop policy if exists news_read on public.news;
create policy news_read on public.news for select using (true);
drop policy if exists news_insert on public.news;
create policy news_insert on public.news for insert
  with check (author_id = auth.uid() and public.can_publish());
drop policy if exists news_update_own on public.news;
create policy news_update_own on public.news for update
  using (author_id = auth.uid() or public.is_admin())
  with check (author_id = auth.uid() or public.is_admin());
drop policy if exists news_delete_own on public.news;
create policy news_delete_own on public.news for delete
  using (author_id = auth.uid() or public.is_admin());

drop policy if exists comments_read on public.news_comments;
create policy comments_read on public.news_comments for select using (true);
drop policy if exists comments_write on public.news_comments;
create policy comments_write on public.news_comments for insert
  with check (user_id = auth.uid() and public.is_verified());
drop policy if exists comments_delete on public.news_comments;
create policy comments_delete on public.news_comments for delete
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists likes_read on public.news_likes;
create policy likes_read on public.news_likes for select using (true);
drop policy if exists likes_write on public.news_likes;
create policy likes_write on public.news_likes for all
  using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_verified());

-- Chats: everyone reads room list; admin manages.
drop policy if exists chats_read on public.chats;
create policy chats_read on public.chats for select using (true);
drop policy if exists chats_admin on public.chats;
create policy chats_admin on public.chats for all using (public.is_admin()) with check (public.is_admin());

-- Messages: verified users read + send in their own department's room.
drop policy if exists messages_read on public.messages;
create policy messages_read on public.messages for select using (public.is_verified());
drop policy if exists messages_send on public.messages;
create policy messages_send on public.messages for insert
  with check (
    sender_id = auth.uid()
    and public.is_verified()
    and exists (
      select 1
      from public.chats c
      join public.users u on u.id = auth.uid()
      where c.id = chat_id and c.department_id = u.department_id
    )
  );
drop policy if exists messages_delete on public.messages;
create policy messages_delete on public.messages for delete
  using (sender_id = auth.uid() or public.is_admin());

-- Notifications: user reads/updates own.
drop policy if exists notif_read on public.notifications;
create policy notif_read on public.notifications for select using (user_id = auth.uid());
drop policy if exists notif_update on public.notifications;
create policy notif_update on public.notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists notif_admin on public.notifications;
create policy notif_admin on public.notifications for all using (public.is_admin()) with check (public.is_admin());

-- Bookmarks / downloads: user manages own.
drop policy if exists bookmarks_own on public.bookmarks;
create policy bookmarks_own on public.bookmarks for all
  using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_verified());

drop policy if exists downloads_own on public.downloads;
create policy downloads_own on public.downloads for all
  using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_verified());

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Storage buckets + policies
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('notes', 'notes', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('chat-images', 'chat-images', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('id-cards', 'id-cards', false) on conflict (id) do nothing;

-- Public read for note + chat assets; only approved contributors upload notes.
drop policy if exists notes_bucket_read on storage.objects;
create policy notes_bucket_read on storage.objects for select
  using (bucket_id in ('notes', 'chat-images'));
drop policy if exists notes_bucket_write on storage.objects;
create policy notes_bucket_write on storage.objects for insert to authenticated
  with check (
    (bucket_id = 'notes' and public.can_publish())
    or (bucket_id = 'chat-images' and public.is_verified())
    or (bucket_id = 'id-cards' and public.is_verified())
  );
-- ID cards: owner or admin can read.
drop policy if exists idcards_read on storage.objects;
create policy idcards_read on storage.objects for select to authenticated
  using (bucket_id = 'id-cards' and (owner = auth.uid() or public.is_admin()));
