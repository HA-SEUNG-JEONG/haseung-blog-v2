import { createClient } from "@/lib/supabase/server";
import { stripMarkdown } from "@/lib/text";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("slug, title, published_at, content_md")
    .eq("is_draft", false)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(30);

  const items = (data ?? [])
    .map((post) => {
      const url = `${base}/posts/${encodeURIComponent(post.slug)}`;
      return `    <item>
      <title>${esc(post.title || "(제목 없음)")}</title>
      <link>${esc(url)}</link>
      <guid>${esc(url)}</guid>
      <pubDate>${post.published_at ? new Date(post.published_at).toUTCString() : ""}</pubDate>
      <description>${esc(stripMarkdown(post.content_md, 200))}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>haseung</title>
    <link>${esc(base)}</link>
    <description>haseung's dev blog</description>
    <language>ko</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
