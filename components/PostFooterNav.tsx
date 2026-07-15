import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/types";

type Row = { id: string; slug: string; title: string };

// Related posts (shared tags) + previous/next by publish date. All queries are
// live-only (RLS anon_read + published_at gate).
export default async function PostFooterNav({ post }: { post: Post }) {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const [related, prev, next] = await Promise.all([
    post.tags?.length
      ? supabase
          .from("posts")
          .select("id, slug, title")
          .eq("is_draft", false)
          .lte("published_at", now)
          .overlaps("tags", post.tags)
          .neq("id", post.id)
          .order("published_at", { ascending: false })
          .limit(3)
      : Promise.resolve({ data: [] as Row[] }),
    supabase
      .from("posts")
      .select("id, slug, title")
      .eq("is_draft", false)
      .lte("published_at", now)
      .lt("published_at", post.published_at ?? now)
      .order("published_at", { ascending: false })
      .limit(1),
    supabase
      .from("posts")
      .select("id, slug, title")
      .eq("is_draft", false)
      .lte("published_at", now)
      .gt("published_at", post.published_at ?? now)
      .order("published_at", { ascending: true })
      .limit(1),
  ]);

  const relatedPosts = (related.data ?? []) as Row[];
  const prevPost = (prev.data ?? [])[0] as Row | undefined;
  const nextPost = (next.data ?? [])[0] as Row | undefined;

  if (!relatedPosts.length && !prevPost && !nextPost) return null;

  return (
    <nav className="mt-12 border-t border-neutral-200 pt-6 dark:border-neutral-800">
      {relatedPosts.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-neutral-500">관련 글</h2>
          <ul className="space-y-1">
            {relatedPosts.map((p) => (
              <li key={p.id}>
                <Link href={`/posts/${p.slug}`} className="text-sm hover:underline">
                  {p.title || "(제목 없음)"}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="flex justify-between gap-4 text-sm">
        <span className="min-w-0">
          {prevPost && (
            <Link href={`/posts/${prevPost.slug}`} className="hover:underline">
              ← {prevPost.title || "(제목 없음)"}
            </Link>
          )}
        </span>
        <span className="min-w-0 text-right">
          {nextPost && (
            <Link href={`/posts/${nextPost.slug}`} className="hover:underline">
              {nextPost.title || "(제목 없음)"} →
            </Link>
          )}
        </span>
      </div>
    </nav>
  );
}
