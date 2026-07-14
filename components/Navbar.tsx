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
      <div className="mx-auto flex w-full max-w-3xl items-center gap-4 p-4">
        <Link href="/" className="font-bold">
          haseung
        </Link>
        <form action="/search" className="ml-auto">
          <Suspense>
            <SearchInput />
          </Suspense>
        </form>
        {user && (
          <>
            <form action={createPost}>
              <button className={linkCls}>New post</button>
            </form>
            <form action={signOut}>
              <button className={linkCls}>Sign out</button>
            </form>
          </>
        )}
        <ThemeToggle />
      </div>
    </nav>
  );
}
