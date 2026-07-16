import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostBySlug, isLive } from "@/lib/posts";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, stripMarkdown, readingMinutes, firstImage } from "@/lib/text";
import Markdown from "@/components/Markdown";
import Editor from "@/components/Editor";
import PostAdminBar from "@/components/PostAdminBar";
import ViewCounter from "@/components/ViewCounter";
import Comments from "@/components/Comments";
import Toc from "@/components/Toc";
import TagChips from "@/components/TagChips";
import ReadingProgress from "@/components/ReadingProgress";
import ShareButton from "@/components/ShareButton";
import PostFooterNav from "@/components/PostFooterNav";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ edit?: string; preview?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound(); // before streaming starts, so the response is a real 404
  const title = post.title || "(제목 없음)";
  const description = stripMarkdown(post.content_md, 160);
  const thumb = post.thumbnail_url ?? firstImage(post.content_md);
  return {
    title,
    description,
    // No explicit images when there's no thumbnail → the opengraph-image.tsx route
    // (a per-post generated card) is picked up automatically instead.
    openGraph: { title, description, type: "article", ...(thumb ? { images: [thumb] } : {}) },
    // a draft or a future-dated post is only reachable by the author — keep it out of search
    ...(isLive(post) ? {} : { robots: { index: false, follow: false } }),
  };
}

export default async function PostPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { edit, preview } = await searchParams;
  const [post, user] = await Promise.all([getPostBySlug(slug), getCurrentUser()]);

  if (!post) notFound();
  const live = isLive(post);
  if (!user && !live) notFound(); // RLS already hides drafts; this also hides future-dated posts

  if (user && edit === "1") return <Editor post={post} initialPreview={preview === "1"} />;

  const thumb = post.thumbnail_url ?? firstImage(post.content_md);

  return (
    <article>
      {live && <ReadingProgress />}
      {user && <PostAdminBar post={post} />}
      {live && thumb && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumb}
          alt=""
          className="mb-6 h-auto max-h-96 w-full rounded-lg object-cover"
        />
      )}
      <h1 className="text-3xl font-bold">{post.title || "(제목 없음)"}</h1>
      <div className="mt-2 mb-8 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-500 tabular-nums">
        {live ? (
          <>
            <span>
              {formatDate(post.published_at)} · 조회 {post.view_count} ·{" "}
              {readingMinutes(post.content_md.length)}분
            </span>
            <ShareButton title={post.title || "(제목 없음)"} />
          </>
        ) : post.is_draft ? (
          <span>초안 — 다른 사람에게 보이지 않습니다</span>
        ) : (
          <span>{formatDate(post.published_at)} 발행 예정 — 아직 보이지 않습니다</span>
        )}
      </div>
      <TagChips tags={post.tags} />
      <Toc content={post.content_md} />
      <Markdown>{post.content_md}</Markdown>
      {live && <ViewCounter slug={post.slug} />}
      {live && <PostFooterNav post={post} />}
      {live && post.comments_enabled && (
        <div className="mt-12">
          <Comments />
        </div>
      )}
    </article>
  );
}
