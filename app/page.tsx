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
  thumbnail_url: string | null;
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
  const now = new Date().toISOString();
  const [{ data }, { count }, { data: popular }] = await Promise.all([
    supabase.rpc("list_home_posts", { lim: PAGE_SIZE, off }),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("is_draft", false)
      .lte("published_at", now),
    // Popular widget (page 1 only) — direct view_count sort, no RPC.
    page === 1
      ? supabase
          .from("posts")
          .select("id, slug, title, view_count")
          .eq("is_draft", false)
          .lte("published_at", now)
          .order("view_count", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: null }),
  ]);
  const posts = (data ?? []) as HomePost[];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const popularPosts = (popular ?? []) as Pick<HomePost, "id" | "slug" | "title" | "view_count">[];

  return (
    <div>
      <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
        {posts.map((post) => {
          const excerpt = stripMarkdown(post.excerpt ?? "", 120);
          return (
            <li key={post.id} className="flex gap-4 py-4">
              <div className="min-w-0 flex-1">
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
              </div>
              {post.thumbnail_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.thumbnail_url}
                  alt=""
                  loading="lazy"
                  className="h-16 w-24 shrink-0 rounded object-cover"
                />
              )}
            </li>
          );
        })}
        {posts.length === 0 && (
          <li className="py-4 text-neutral-500">아직 글이 없습니다.</li>
        )}
      </ul>

      {popularPosts.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-2 text-sm font-semibold text-neutral-500">인기 글</h2>
          <ol className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {popularPosts.map((post) => (
              <li key={post.id} className="flex items-baseline justify-between gap-4 py-2">
                <Link
                  href={`/posts/${post.slug}`}
                  className="min-w-0 truncate hover:underline"
                >
                  {post.title || "(제목 없음)"}
                </Link>
                <span className="shrink-0 text-sm text-neutral-500 tabular-nums">
                  조회 {post.view_count}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

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
