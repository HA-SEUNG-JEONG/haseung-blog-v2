import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/text";

export const metadata: Metadata = { title: "아카이브" };

type Row = { id: string; slug: string; title: string; published_at: string | null };

export default async function ArchivePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("id, slug, title, published_at")
    .eq("is_draft", false)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });
  const posts = (data ?? []) as Row[];

  // group by year (already sorted newest-first, so years and posts stay ordered)
  const byYear = new Map<string, Row[]>();
  for (const post of posts) {
    const year = post.published_at?.slice(0, 4) ?? "미분류";
    (byYear.get(year) ?? byYear.set(year, []).get(year)!).push(post);
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">아카이브</h1>
      {posts.length === 0 && <p className="text-neutral-500">아직 글이 없습니다.</p>}
      {[...byYear.entries()].map(([year, rows]) => (
        <section key={year} className="mb-8">
          <h2 className="mb-2 text-lg font-semibold tabular-nums">{year}</h2>
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {rows.map((post) => (
              <li key={post.id} className="flex flex-wrap justify-between gap-x-4 py-2">
                <Link href={`/posts/${post.slug}`} className="hover:underline">
                  {post.title || "(제목 없음)"}
                </Link>
                <span className="text-sm text-neutral-500 tabular-nums">
                  {formatDate(post.published_at)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
