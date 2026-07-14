# haseung-blog-v2

Personal blog. Next.js (App Router, TS, Tailwind v4) + Supabase + Vercel.

## Features

- Markdown posts (GFM, raw HTML → `<video>`, code highlight) with image/video paste-drop upload
- Admin editor with live preview + 1.5s autosave
- Drafts, backdatable `published_at`, per-post comment toggle
- View counts (once per browser session), ILIKE search, dark/light toggle, GA4, Giscus comments

## Setup (once)

1. **Supabase**: create project → run `supabase/schema.sql` in SQL editor →
   Auth: disable "Allow new users to sign up" → create the single admin user manually →
   Storage: create bucket `uploads` (public).
2. **GA4** (optional): create property, copy measurement ID.
3. **Giscus** (optional): public GitHub repo with Discussions → configure at giscus.app → copy ids.
4. `cp .env.example .env.local` and fill values.
5. Vercel: import repo, set the same env vars.

## Run

```bash
npm install
npm run dev
```

Admin at `/admin` (redirects to `/admin/login`).

## Structure

- `app/` — public pages (`/`, `/posts/[slug]`, `/search`) + `admin/` (list, editor, login, server actions)
- `components/` — `Markdown` (shared render pipeline, public page = editor preview), `Editor`, navbar/theme/views/comments
- `lib/supabase/` — browser/server/proxy clients (`@supabase/ssr`)
- `proxy.ts` — session refresh + `/admin` auth guard
- `supabase/schema.sql` — table, RLS, `increment_view` RPC, storage policy

Security model: RLS trusts any authenticated user; signups disabled in Supabase = single-admin allowlist.
