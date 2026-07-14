import Link from "next/link";
import { publishPost, unpublishPost, deletePost } from "@/app/actions";
import ConfirmButton from "./ConfirmButton";
import type { Post } from "@/lib/types";

const btn =
  "rounded border border-neutral-300 px-2.5 py-1 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800";

export default function PostAdminBar({ post }: { post: Post }) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-2 dark:border-neutral-800 dark:bg-neutral-900">
      <span className="px-1 text-xs font-medium uppercase tracking-wide text-neutral-500">
        {post.is_draft ? "draft" : "published"}
      </span>
      <Link href={`/posts/${encodeURIComponent(post.slug)}?edit=1`} className={`${btn} ml-auto`}>
        Edit
      </Link>
      <form action={(post.is_draft ? publishPost : unpublishPost).bind(null, post.id)}>
        <button className={btn}>{post.is_draft ? "Publish" : "Unpublish"}</button>
      </form>
      <form action={deletePost.bind(null, post.id)}>
        <ConfirmButton
          message={`"${post.title || "(untitled)"}" 정말 삭제할까요?\n되돌릴 수 없습니다.`}
          confirmLabel="삭제"
          danger
          className={`${btn} text-red-600 dark:text-red-400`}
        >
          Delete
        </ConfirmButton>
      </form>
    </div>
  );
}
