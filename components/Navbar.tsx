import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  return (
    <nav className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto flex w-full max-w-3xl items-center gap-4 p-4">
        <Link href="/" className="font-bold">
          haseung
        </Link>
        <form action="/search" className="ml-auto">
          <input
            type="search"
            name="q"
            placeholder="Search…"
            className="rounded border border-neutral-300 bg-transparent px-2 py-1 text-sm dark:border-neutral-700"
          />
        </form>
        <ThemeToggle />
      </div>
    </nav>
  );
}
