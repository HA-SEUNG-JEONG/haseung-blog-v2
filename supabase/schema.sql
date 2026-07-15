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

-- One row per (post, viewer, day) => a repeat view the same day is a no-op.
-- viewer_hash is sha256(ip + day + secret) computed server-side (see app/api/view);
-- the raw IP never reaches the DB. RLS on, no anon insert policy: the only way in
-- is record_view (security definer), so clients can't forge rows or bump counts directly.
create table post_views (
  slug text not null,
  viewer_hash text not null,
  day date not null,
  primary key (slug, viewer_hash, day)
);
alter table post_views enable row level security;

-- Records a view and bumps view_count only when the (slug, viewer, day) row is new.
create function record_view(post_slug text, viewer_hash text) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into post_views (slug, viewer_hash, day)
  values (post_slug, viewer_hash, current_date)
  on conflict do nothing;
  if found then
    update posts set view_count = view_count + 1
    where slug = post_slug and is_draft = false;
  end if;
end;
$$;

-- Storage: create bucket "uploads" (public) in dashboard, then:
create policy "auth write uploads" on storage.objects
  for insert to authenticated with check (bucket_id = 'uploads');

-- IMPORTANT manual steps (dashboard):
-- 1. Auth > Sign In / Up > disable "Allow new users to sign up"
-- 2. Create the single admin user manually (Auth > Users > Add user)
-- 3. Storage > New bucket "uploads", public

-- MIGRATION (existing databases): run the post_views table + record_view and
-- list_home_posts function blocks above in the SQL editor, then drop the old RPC:
--   drop function if exists increment_view(text);

-- Optional hardening: the app hides scheduled posts (published_at > now()),
-- but direct REST reads can still see them. To enforce at the DB:
--   drop policy anon_read on posts;
--   create policy anon_read on posts for select
--     using (is_draft = false and published_at <= now());
