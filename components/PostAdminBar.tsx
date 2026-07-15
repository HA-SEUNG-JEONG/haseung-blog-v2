import Link from "next/link";
import { publishPost, unpublishPost, deletePost } from "@/app/actions";
import ConfirmButton from "./ConfirmButton";
import SubmitButton from "./SubmitButton";
import type { Post } from "@/lib/types";

const btn =
  "rounded border border-neutral-300 px-2.5 py-1 text-sm hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800";

export default function PostAdminBar({ post }: { post: Post }) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-2 dark:border-neutral-800 dark:bg-neutral-900">
      <span className="px-1 text-xs font-medium tracking-wide text-neutral-500">
        {post.is_draft ? "초안" : "발행됨"}
      </span>
      <Link
        href={`/posts/${encodeURIComponent(post.slug)}?edit=1`}
        className="ml-auto rounded bg-neutral-900 px-3 py-1 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-neutral-100 dark:text-black dark:hover:bg-neutral-300"
      >
        수정
      </Link>
      <form action={(post.is_draft ? publishPost : unpublishPost).bind(null, post.id)}>
        <SubmitButton className={btn}>{post.is_draft ? "발행" : "발행 취소"}</SubmitButton>
      </form>
      <form action={deletePost.bind(null, post.id)}>
        <ConfirmButton
          message={`"${post.title || "(제목 없음)"}" 정말 삭제할까요?\n되돌릴 수 없습니다.`}
          confirmLabel="삭제"
          danger
          className={`${btn} text-red-600 dark:text-red-400`}
        >
          삭제
        </ConfirmButton>
      </form>
    </div>
  );
}
