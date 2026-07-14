import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostBySlug, isLive } from "@/lib/posts";
import { getCurrentUser } from "@/lib/auth";
import { stripMarkdown } from "@/lib/text";
import Markdown from "@/components/Markdown";
import Editor from "@/components/Editor";
import PostAdminBar from "@/components/PostAdminBar";
import ViewCounter from "@/components/ViewCounter";
import Comments from "@/components/Comments";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ edit?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound(); // before streaming starts, so the response is a real 404
  const title = post.title || "(untitled)";
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
  const { edit } = await searchParams;
  const [post, user] = await Promise.all([getPostBySlug(slug), getCurrentUser()]);

  if (!post) notFound();
  const live = isLive(post);
  if (!user && !live) notFound(); // RLS already hides drafts; this also hides future-dated posts

  if (user && edit === "1") return <Editor post={post} />;

  return (
    <article>
      {user && <PostAdminBar post={post} />}
      <h1 className="text-3xl font-bold">{post.title || "(untitled)"}</h1>
      <p className="mt-2 mb-8 text-sm text-neutral-500">
        {live
          ? `${post.published_at?.slice(0, 10)} · ${post.view_count} views`
          : post.is_draft
            ? "draft — not visible to anyone else"
            : `scheduled for ${post.published_at?.slice(0, 10)} — not visible yet`}
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
