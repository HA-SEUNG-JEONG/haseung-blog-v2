import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostBySlug, isLive } from "@/lib/posts";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, stripMarkdown } from "@/lib/text";
import Markdown from "@/components/Markdown";
import Editor from "@/components/Editor";
import PostAdminBar from "@/components/PostAdminBar";
import ViewCounter from "@/components/ViewCounter";
import Comments from "@/components/Comments";

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
  return {
    title,
    description,
    openGraph: { title, description, type: "article" },
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

  return (
    <article>
      {user && <PostAdminBar post={post} />}
      <h1 className="text-3xl font-bold">{post.title || "(제목 없음)"}</h1>
      <p className="mt-2 mb-8 text-sm text-neutral-500 tabular-nums">
        {live
          ? `${formatDate(post.published_at)} · 조회 ${post.view_count}`
          : post.is_draft
            ? "초안 — 다른 사람에게 보이지 않습니다"
            : `${formatDate(post.published_at)} 발행 예정 — 아직 보이지 않습니다`}
      </p>
      <Markdown>{post.content_md}</Markdown>
      {live && <ViewCounter slug={post.slug} />}
      {live && post.comments_enabled && (
        <div className="mt-12">
          <Comments />
        </div>
      )}
    </article>
  );
}
