import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedPost } from "@/lib/posts";
import { stripMarkdown } from "@/lib/text";
import Markdown from "@/components/Markdown";
import ViewCounter from "@/components/ViewCounter";
import Comments from "@/components/Comments";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPost(slug);
  if (!post) notFound(); // before streaming starts, so the response is a real 404
  const title = post.title || "(untitled)";
  const description = stripMarkdown(post.content_md, 160);
  return {
    title,
    description,
    openGraph: { title, description, type: "article" },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPublishedPost(slug);

  if (!post) notFound();

  return (
    <article>
      <h1 className="text-3xl font-bold">{post.title || "(untitled)"}</h1>
      <p className="mt-2 mb-8 text-sm text-neutral-500">
        {post.published_at?.slice(0, 10)} · {post.view_count} views
      </p>
      <Markdown>{post.content_md}</Markdown>
      <ViewCounter slug={post.slug} />
      {post.comments_enabled && (
        <div className="mt-12">
          <Comments />
        </div>
      )}
    </article>
  );
}
