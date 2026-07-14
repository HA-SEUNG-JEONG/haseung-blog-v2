import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  // strip ,() to protect PostgREST or() syntax; escape LIKE wildcards
  const query = (q ?? "").replace(/[,()]/g, "").trim();
  const pattern = query.replace(/[\\%_]/g, "\\$&");

  let posts: { id: string; slug: string; title: string; published_at: string | null }[] = [];
  if (query) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("posts")
      .select("id, slug, title, published_at")
      .eq("is_draft", false)
      .lte("published_at", new Date().toISOString())
      .or(`title.ilike.%${pattern}%,content_md.ilike.%${pattern}%`)
      .order("published_at", { ascending: false });
    posts = data ?? [];
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">
        {query ? `Results for “${query}”` : "Search"}
      </h1>
      <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
        {posts.map((post) => (
          <li key={post.id} className="py-4">
            <Link href={`/posts/${post.slug}`} className="font-semibold hover:underline">
              {post.title || "(untitled)"}
            </Link>
            <p className="text-sm text-neutral-500">{post.published_at?.slice(0, 10)}</p>
          </li>
        ))}
        {query && posts.length === 0 && (
          <li className="py-4 text-neutral-500">No results.</li>
        )}
      </ul>
    </div>
  );
}
