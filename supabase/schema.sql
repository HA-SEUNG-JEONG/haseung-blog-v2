-- Run once in Supabase SQL editor.

create table posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null default '',
  content_md text not null default '',
  is_draft boolean not null default true,
  published_at timestamptz,          -- author-settable => backdating
  comments_enabled boolean not null default true,
  view_count int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table posts enable row level security;
create policy anon_read on posts for select using (is_draft = false);
create policy admin_all on posts for all using (auth.role() = 'authenticated');

create index idx_posts_published on posts (published_at desc) where is_draft = false;

-- atomic view increment, callable by anon
create function increment_view(post_slug text) returns void
language sql security definer set search_path = public as
$$ update posts set view_count = view_count + 1 where slug = post_slug and is_draft = false; $$;

-- Storage: create bucket "uploads" (public) in dashboard, then:
create policy "auth write uploads" on storage.objects
  for insert to authenticated with check (bucket_id = 'uploads');

-- IMPORTANT manual steps (dashboard):
-- 1. Auth > Sign In / Up > disable "Allow new users to sign up"
-- 2. Create the single admin user manually (Auth > Users > Add user)
-- 3. Storage > New bucket "uploads", public

-- MIGRATION (existing databases): re-run in SQL editor to pin search_path:
--   create or replace function increment_view(post_slug text) returns void
--   language sql security definer set search_path = public as
--   $$ update posts set view_count = view_count + 1 where slug = post_slug and is_draft = false; $$;

-- Optional hardening: the app hides scheduled posts (published_at > now()),
-- but direct REST reads can still see them. To enforce at the DB:
--   drop policy anon_read on posts;
--   create policy anon_read on posts for select
--     using (is_draft = false and published_at <= now());
