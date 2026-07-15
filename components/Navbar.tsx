import { Suspense } from "react";
import Link from "next/link";
import { createPost, signOut } from "@/app/actions";
import { getCurrentUser } from "@/lib/auth";
import SearchInput from "./SearchInput";
import ThemeToggle from "./ThemeToggle";

const linkCls = "whitespace-nowrap text-sm text-neutral-500 hover:underline";

export default async function Navbar() {
  const user = await getCurrentUser();

  return (
    <nav className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center gap-x-4 gap-y-2 p-4">
        <Link href="/" className="font-bold">
          haseung
        </Link>
        <Link href="/archive" className={linkCls}>
          아카이브
        </Link>
        <a href="/feed.xml" className={linkCls}>
          RSS
        </a>
        <form action="/search" className="ml-auto">
          <Suspense>
            <SearchInput />
          </Suspense>
        </form>
        {user && (
          <>
            <form action={createPost}>
              <button className={linkCls}>새 글</button>
            </form>
            <form action={signOut}>
              <button className={linkCls}>로그아웃</button>
            </form>
          </>
        )}
        <ThemeToggle />
      </div>
    </nav>
  );
}
