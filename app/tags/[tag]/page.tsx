import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/text";
import TagChips from "@/components/TagChips";

type Props = { params: Promise<{ tag: string }> };

function decode(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  return { title: `#${decode(tag)} 글` };
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const decoded = decode(tag);

  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("id, slug, title, published_at, tags")
    .eq("is_draft", false)
    .lte("published_at", new Date().toISOString())
    .contains("tags", [decoded])
    .order("published_at", { ascending: false });
  const posts = data ?? [];

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">#{decoded} 글</h1>
      <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
        {posts.map((post) => (
          <li key={post.id} className="py-4">
            <Link href={`/posts/${post.slug}`} className="font-semibold hover:underline">
              {post.title || "(제목 없음)"}
            </Link>
            <p className="text-sm text-neutral-500 tabular-nums">
              {formatDate(post.published_at)}
            </p>
            <TagChips tags={post.tags} />
          </li>
        ))}
        {posts.length === 0 && (
          <li className="py-4 text-neutral-500">이 태그의 글이 없습니다.</li>
        )}
      </ul>
    </div>
  );
}
