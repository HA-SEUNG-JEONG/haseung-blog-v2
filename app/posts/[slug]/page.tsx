import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Markdown from "@/components/Markdown";
import ViewCounter from "@/components/ViewCounter";
import Comments from "@/components/Comments";

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_draft", false)
    .single();

  if (!post) notFound();

  return (
    <article>
      <h1 className="text-3xl font-bold">{post.title}</h1>
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
