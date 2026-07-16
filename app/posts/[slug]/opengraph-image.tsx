import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getPostBySlug, isLive } from "@/lib/posts";
import { formatDate } from "@/lib/text";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "haseung";

// Per-post social card. Runs on the Node runtime so it can read the bundled font.
// satori (next/og) has no CJK glyphs by default — Korean titles render as tofu
// unless we inject a Korean face, so Pretendard is loaded from app/_fonts.
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  // Drafts/future posts (or a missing slug) fall back to a generic branded card.
  const live = post && isLive(post);
  const title = live ? post.title || "(제목 없음)" : "haseung";
  const date = live ? formatDate(post.published_at) : "haseung's dev blog";

  const font = await readFile(join(process.cwd(), "app/_fonts/Pretendard-Bold.otf"));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "linear-gradient(135deg, #0a0a0a 0%, #262626 100%)",
          color: "#fafafa",
          fontFamily: "Pretendard",
        }}
      >
        <div style={{ fontSize: 32, color: "#a3a3a3" }}>haseung</div>
        <div style={{ fontSize: 68, lineHeight: 1.2, display: "flex" }}>{title}</div>
        <div style={{ fontSize: 30, color: "#a3a3a3" }}>{date}</div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Pretendard", data: font, weight: 700, style: "normal" }],
    },
  );
}
