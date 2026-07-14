import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("slug, updated_at")
    .eq("is_draft", false)
    .lte("published_at", new Date().toISOString());

  return [
    { url: base, lastModified: new Date() },
    ...(posts ?? []).map((post) => ({
      url: `${base}/posts/${encodeURIComponent(post.slug)}`,
      lastModified: post.updated_at ? new Date(post.updated_at) : undefined,
    })),
  ];
}
