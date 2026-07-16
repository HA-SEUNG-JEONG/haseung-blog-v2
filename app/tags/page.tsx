import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "태그" };

export default async function TagsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("tags")
    .eq("is_draft", false)
    .lte("published_at", new Date().toISOString());

  // Small blog: aggregate tag counts in JS instead of an RPC/migration.
  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    for (const tag of (row.tags as string[] | null) ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  const tags = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">태그</h1>
      {tags.length === 0 ? (
        <p className="text-neutral-500">아직 태그가 없습니다.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map(([tag, count]) => (
            <Link
              key={tag}
              href={`/tags/${encodeURIComponent(tag)}`}
              className="rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-600 tabular-nums hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
            >
              #{tag} {count}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
