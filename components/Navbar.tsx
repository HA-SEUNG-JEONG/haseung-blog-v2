import { Suspense } from "react";
import Link from "next/link";
import SearchInput from "./SearchInput";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
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
        <ThemeToggle />
      </div>
    </nav>
  );
}
