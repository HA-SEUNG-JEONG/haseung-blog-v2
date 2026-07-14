import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("id, slug, title, published_at, view_count")
    .eq("is_draft", false)
    .order("published_at", { ascending: false });

  return (
    <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
      {(posts ?? []).map((post) => (
        <li key={post.id} className="py-4">
          <Link href={`/posts/${post.slug}`} className="text-lg font-semibold hover:underline">
            {post.title || "(untitled)"}
          </Link>
          <p className="text-sm text-neutral-500">
            {post.published_at?.slice(0, 10)} · {post.view_count} views
          </p>
        </li>
      ))}
      {(posts ?? []).length === 0 && (
        <li className="py-4 text-neutral-500">No posts yet.</li>
      )}
    </ul>
  );
}
