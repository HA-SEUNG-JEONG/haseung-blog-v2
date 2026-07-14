import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { stripMarkdown } from "@/lib/text";

export default async function Home() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("id, slug, title, published_at, view_count, content_md")
    .eq("is_draft", false)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });

  return (
    <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
      {(posts ?? []).map((post) => {
        const excerpt = stripMarkdown(post.content_md, 120);
        return (
          <li key={post.id} className="py-4">
            <Link href={`/posts/${post.slug}`} className="text-lg font-semibold hover:underline">
              {post.title || "(untitled)"}
            </Link>
            <p className="text-sm text-neutral-500">
              {post.published_at?.slice(0, 10)} · {post.view_count} views
            </p>
            {excerpt && (
              <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{excerpt}</p>
            )}
          </li>
        );
      })}
      {(posts ?? []).length === 0 && (
        <li className="py-4 text-neutral-500">No posts yet.</li>
      )}
    </ul>
  );
}
