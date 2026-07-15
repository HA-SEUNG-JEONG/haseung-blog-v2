// Fixed locale + timezone so server and client render the same string (no hydration mismatch).
const dateFmt = new Intl.DateTimeFormat("ko-KR", { dateStyle: "long", timeZone: "Asia/Seoul" });

export function formatDate(iso: string | null): string {
  return iso ? dateFmt.format(new Date(iso)) : "";
}

// Rough markdown/HTML stripper for excerpts and meta descriptions.
export function stripMarkdown(md: string, maxLen: number): string {
  const text = md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/[`*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > maxLen ? `${text.slice(0, maxLen - 1).trimEnd()}…` : text;
}

// Reading time from character count (~500 Korean chars/min), floor of 1 minute.
export function readingMinutes(chars: number): number {
  return Math.max(1, Math.round(chars / 500));
}
// demo: readingMinutes(0) === 1, readingMinutes(1500) === 3
