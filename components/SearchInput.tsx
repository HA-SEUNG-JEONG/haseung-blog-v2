"use client";

import { useSearchParams } from "next/navigation";

export default function SearchInput() {
  const q = useSearchParams().get("q") ?? "";
  return (
    <input
      key={q}
      type="search"
      name="q"
      defaultValue={q}
      placeholder="Search…"
      aria-label="Search posts"
      className="w-28 min-w-0 rounded border border-neutral-300 bg-transparent px-2 py-1 text-sm sm:w-auto dark:border-neutral-700"
    />
  );
}
