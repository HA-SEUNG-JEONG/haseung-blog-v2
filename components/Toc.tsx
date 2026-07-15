import GithubSlugger from "github-slugger";

// Builds a collapsible table of contents from ## / ### headings. Slugs are generated
// with github-slugger in document order so ids match rehype-slug's output exactly.
// Server component — no client JS, just anchor links.
export default function Toc({ content }: { content: string }) {
  const slugger = new GithubSlugger();
  // drop fenced code blocks so a `#` inside code isn't mistaken for a heading
  const src = content.replace(/```[\s\S]*?```/g, "");
  const items: { level: number; text: string; id: string }[] = [];
  for (const line of src.split("\n")) {
    const m = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!m) continue;
    const level = m[1].length;
    const text = m[2].replace(/[`*_~]/g, "").trim();
    const id = slugger.slug(text); // advance the slugger for every heading to stay in sync
    if (level === 2 || level === 3) items.push({ level, text, id });
  }

  if (items.length < 2) return null;

  return (
    <details className="my-6 rounded border border-neutral-200 dark:border-neutral-800">
      <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
        목차
      </summary>
      <ul className="px-3 pb-3 text-sm">
        {items.map((item, i) => (
          <li key={i} className={item.level === 3 ? "ml-4" : ""}>
            <a
              href={`#${item.id}`}
              className="block py-0.5 text-neutral-500 hover:text-neutral-900 hover:underline dark:hover:text-neutral-100"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}
