import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/text";

type Props = { searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  return { title: query ? `“${query}” 검색 결과` : "검색" };
}

export default async function SearchPage({ searchParams }: Props) {
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
      .order("published_at", { ascending: false })
      .limit(50);
    posts = data ?? [];
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">{query ? `“${query}” 검색 결과` : "검색"}</h1>
      <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
        {posts.map((post) => (
          <li key={post.id} className="py-4">
            <Link href={`/posts/${post.slug}`} className="font-semibold hover:underline">
              {post.title || "(제목 없음)"}
            </Link>
            <p className="text-sm text-neutral-500 tabular-nums">{formatDate(post.published_at)}</p>
          </li>
        ))}
        {query && posts.length === 0 && (
          <li className="py-4 text-neutral-500">검색 결과가 없습니다.</li>
        )}
      </ul>
    </div>
  );
}
