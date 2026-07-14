import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createPost, deletePost, publishPost, unpublishPost, signOut } from "./actions";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const showDrafts = tab === "drafts";

  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("id, slug, title, is_draft, published_at, view_count")
    .order("updated_at", { ascending: false });

  const drafts = (posts ?? []).filter((p) => p.is_draft);
  const published = (posts ?? []).filter((p) => !p.is_draft);
  const visible = showDrafts ? drafts : published;

  const tabCls = (active: boolean) =>
    active
      ? "border-b-2 border-neutral-900 pb-1 text-sm font-semibold dark:border-neutral-100"
      : "border-b-2 border-transparent pb-1 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100";

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-xl font-bold">Posts</h1>
        <form action={createPost} className="ml-auto">
          <button className="rounded bg-neutral-900 px-3 py-1.5 text-sm text-white dark:bg-neutral-100 dark:text-black">
            New post
          </button>
        </form>
        <form action={signOut}>
          <button className="text-sm text-neutral-500 hover:underline">Sign out</button>
        </form>
      </div>
      <div className="mb-4 flex gap-4 border-b border-neutral-200 dark:border-neutral-800">
        <Link href="/admin" className={tabCls(!showDrafts)}>
          Published ({published.length})
        </Link>
        <Link href="/admin?tab=drafts" className={tabCls(showDrafts)}>
          Drafts ({drafts.length})
        </Link>
      </div>
      <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
        {visible.map((post) => (
          <li key={post.id} className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <Link href={`/admin/edit/${post.id}`} className="font-semibold hover:underline">
                {post.title || "(untitled)"}
              </Link>
              <p className="text-sm text-neutral-500">
                {post.is_draft ? "draft" : `published ${post.published_at?.slice(0, 10)}`} ·{" "}
                {post.view_count} views
              </p>
            </div>
            <form action={(post.is_draft ? publishPost : unpublishPost).bind(null, post.id)}>
              <button className="text-sm hover:underline">
                {post.is_draft ? "Publish" : "Unpublish"}
              </button>
            </form>
            <form action={deletePost.bind(null, post.id)}>
              <button className="text-sm text-red-500 hover:underline">Delete</button>
            </form>
          </li>
        ))}
        {visible.length === 0 && (
          <li className="py-3 text-neutral-500">No {showDrafts ? "drafts" : "published posts"}.</li>
        )}
      </ul>
    </div>
  );
}
