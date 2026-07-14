import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Markdown from "@/components/Markdown";

// Auth-protected by the /admin proxy matcher; renders drafts too.
export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase.from("posts").select("*").eq("id", id).single();

  if (!post) notFound();

  return (
    <article>
      <p className="mb-6 rounded bg-amber-100 px-3 py-1.5 text-sm text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
        Preview{post.is_draft ? " (draft)" : ""} — reload after editing
      </p>
      <h1 className="text-3xl font-bold">{post.title || "(untitled)"}</h1>
      <p className="mt-2 mb-8 text-sm text-neutral-500">
        {post.published_at?.slice(0, 10) ?? "unpublished"}
      </p>
      <Markdown>{post.content_md}</Markdown>
    </article>
  );
}
