import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate, stripMarkdown, readingMinutes } from "@/lib/text";
import TagChips from "@/components/TagChips";

type HomePost = {
  id: string;
  slug: string;
  title: string;
  published_at: string | null;
  view_count: number;
  excerpt: string;
  tags: string[];
  char_count: number;
};

const PAGE_SIZE = 10;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const off = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();
  // RPC returns a server-side left(content_md, 300) excerpt so the full body never
  // ships to the client, plus tags + char_count for reading time.
  const [{ data }, { count }] = await Promise.all([
    supabase.rpc("list_home_posts", { lim: PAGE_SIZE, off }),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("is_draft", false)
      .lte("published_at", new Date().toISOString()),
  ]);
  const posts = (data ?? []) as HomePost[];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <div>
      <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
        {posts.map((post) => {
          const excerpt = stripMarkdown(post.excerpt ?? "", 120);
          return (
            <li key={post.id} className="py-4">
              <Link
                href={`/posts/${post.slug}`}
                className="text-lg font-semibold hover:underline"
              >
                {post.title || "(제목 없음)"}
              </Link>
              <p className="text-sm text-neutral-500 tabular-nums">
                {formatDate(post.published_at)} · 조회 {post.view_count} ·{" "}
                {readingMinutes(post.char_count)}분
              </p>
              <TagChips tags={post.tags} />
              {excerpt && (
                <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{excerpt}</p>
              )}
            </li>
          );
        })}
        {posts.length === 0 && (
          <li className="py-4 text-neutral-500">아직 글이 없습니다.</li>
        )}
      </ul>

      {totalPages > 1 && (
        <nav
          aria-label="페이지"
          className="mt-6 flex items-center justify-center gap-1 text-sm tabular-nums"
        >
          {page > 1 && (
            <Link href={`/?page=${page - 1}`} className="px-2 py-1 text-neutral-500 hover:underline">
              이전
            </Link>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={`/?page=${n}`}
              aria-current={n === page ? "page" : undefined}
              className={`rounded px-2 py-1 ${
                n === page
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-black"
                  : "text-neutral-500 hover:underline"
              }`}
            >
              {n}
            </Link>
          ))}
          {page < totalPages && (
            <Link href={`/?page=${page + 1}`} className="px-2 py-1 text-neutral-500 hover:underline">
              다음
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
