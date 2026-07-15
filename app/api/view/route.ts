import { createHash } from "crypto";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Records a page view server-side. The client (ViewCounter) can't touch view_count
// directly — record_view (security definer) is the only path, and this route is the
// only caller. IP is read here and never sent to the DB: it's hashed into an opaque
// per-day identifier so record_view can dedupe repeat views without storing the IP.
// Set VIEW_HASH_SECRET in the environment to salt the hash (optional; without it the
// hash is still opaque, just unsalted).
export async function POST(req: Request) {
  const { slug } = await req.json().catch(() => ({}));
  if (!slug || typeof slug !== "string") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const supabase = await createClient();
  // admin views don't count — authoritative check, not just the client-side guard
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) return NextResponse.json({ ok: true, skipped: "admin" });

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const day = new Date().toISOString().slice(0, 10); // UTC, matches DB current_date
  const secret = process.env.VIEW_HASH_SECRET ?? "";
  const viewerHash = createHash("sha256").update(`${ip}|${day}|${secret}`).digest("hex");

  await supabase.rpc("record_view", { post_slug: slug, viewer_hash: viewerHash });
  return NextResponse.json({ ok: true });
}
