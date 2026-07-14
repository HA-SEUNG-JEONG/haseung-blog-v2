import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/types";

// Deduped per request so the page and generateMetadata share one fetch.
// Slugs may be non-ASCII, so the URL param arrives percent-encoded.
export const getPublishedPost = cache(async (slug: string): Promise<Post | null> => {
  let decoded: string;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    return null;
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", decoded)
    .eq("is_draft", false)
    .lte("published_at", new Date().toISOString())
    .single();
  return data;
});
