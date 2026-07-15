import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate, stripMarkdown } from "@/lib/text";

type HomePost = {
  id: string;
  slug: string;
  title: string;
  published_at: string | null;
  view_count: number;
  excerpt: string;
};

export default async function Home() {
  const supabase = await createClient();
  // RPC returns a server-side left(content_md, 300) excerpt so the full body never
  // ships to the client, and caps the list at 30.
  const { data } = await supabase.rpc("list_home_posts", { lim: 30 });
  const posts = (data ?? []) as HomePost[];

  return (
    <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
      {(posts ?? []).map((post) => {
        const excerpt = stripMarkdown(post.excerpt ?? "", 120);
        return (
          <li key={post.id} className="py-4">
            <Link href={`/posts/${post.slug}`} className="text-lg font-semibold hover:underline">
              {post.title || "(제목 없음)"}
            </Link>
            <p className="text-sm text-neutral-500 tabular-nums">
              {formatDate(post.published_at)} · 조회 {post.view_count}
            </p>
            {excerpt && (
              <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{excerpt}</p>
            )}
          </li>
        );
      })}
      {(posts ?? []).length === 0 && (
        <li className="py-4 text-neutral-500">아직 글이 없습니다.</li>
      )}
    </ul>
  );
}
