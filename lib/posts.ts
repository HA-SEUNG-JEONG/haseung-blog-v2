import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/types";

// Deduped per request so the page and generateMetadata share one fetch.
// Slugs may be non-ASCII, so the URL param arrives percent-encoded.
// No is_draft filter: RLS (anon_read) already returns null on a draft for anon,
// and the admin needs the draft back to edit it. published_at is gated by isLive.
export const getPostBySlug = cache(async (slug: string): Promise<Post | null> => {
  let decoded: string;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    return null;
  }
  const supabase = await createClient();
  const { data } = await supabase.from("posts").select("*").eq("slug", decoded).maybeSingle();
  return data;
});

// Visible to the public: published and not future-dated.
export function isLive(post: Post) {
  return !post.is_draft && !!post.published_at && post.published_at <= new Date().toISOString();
}
