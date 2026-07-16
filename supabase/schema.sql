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
-- anon sees only published, non-future posts. Enforced at the DB so a direct REST read
-- can't surface a scheduled post the app would otherwise hide. published_at is always set
-- on publish, so a live post is never hidden by the published_at <= now() clause.
create policy anon_read on posts for select
  using (is_draft = false and published_at <= now());
-- single author: only the admin's own JWT may write. Swap the email if the author changes.
create policy admin_all on posts for all
  using (auth.jwt() ->> 'email' = 'test12280413@gmail.com');

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

-- Tags: array column + GIN index for contains/overlaps queries. Single author, so
-- no join table / tag-management UI — a text[] on the post is enough.
alter table posts add column tags text[] not null default '{}';
create index idx_posts_tags on posts using gin (tags);

-- Optional cover image. Null => fall back to the first ![](...) image in content_md.
alter table posts add column thumbnail_url text;

-- Home list: server-side excerpt (no full content_md over the wire) + row cap.
-- stable, no security definer => RLS anon_read still applies.
-- Returns tags + char_count (reading time) and takes an offset (pagination).
-- thumbnail_url falls back to the first markdown image in the body when unset.
drop function if exists list_home_posts(int);
drop function if exists list_home_posts(int, int);
create function list_home_posts(lim int, off int default 0)
returns table (id uuid, slug text, title text, published_at timestamptz,
               view_count int, excerpt text, tags text[], char_count int, thumbnail_url text)
language sql stable set search_path = public as $$
  select id, slug, title, published_at, view_count,
         left(content_md, 300) as excerpt, tags, char_length(content_md) as char_count,
         coalesce(thumbnail_url, substring(content_md from '!\[[^\]]*\]\(([^)]+)\)')) as thumbnail_url
  from posts
  where is_draft = false and published_at <= now()
  order by published_at desc
  limit lim offset off;
$$;

-- Storage: create bucket "uploads" (public) in dashboard, then:
-- only the admin's JWT may upload, matching the posts admin_all policy.
create policy "auth write uploads" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'uploads' and auth.jwt() ->> 'email' = 'test12280413@gmail.com');

-- IMPORTANT manual steps (dashboard):
-- 1. Auth > Sign In / Up > disable "Allow new users to sign up"
-- 2. Create the single admin user manually (Auth > Users > Add user)
-- 3. Storage > New bucket "uploads", public

-- MIGRATION (existing databases): run the post_views table + record_view and
-- list_home_posts function blocks above in the SQL editor, then drop the old RPC:
--   drop function if exists increment_view(text);
--
-- To bring the anon_read + admin_all + storage policies above onto an existing DB,
-- run (email must match the admin's Supabase Auth account):
--   drop policy anon_read on posts;
--   create policy anon_read on posts for select
--     using (is_draft = false and published_at <= now());
--   drop policy admin_all on posts;
--   create policy admin_all on posts for all
--     using (auth.jwt() ->> 'email' = 'test12280413@gmail.com');
--   drop policy "auth write uploads" on storage.objects;
--   create policy "auth write uploads" on storage.objects
--     for insert to authenticated
--     with check (bucket_id = 'uploads' and auth.jwt() ->> 'email' = 'test12280413@gmail.com');
