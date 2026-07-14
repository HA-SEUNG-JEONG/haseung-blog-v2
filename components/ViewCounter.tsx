"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// Fires the increment RPC once per browser session per post.
export default function ViewCounter({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `viewed:${slug}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    createClient().rpc("increment_view", { post_slug: slug });
  }, [slug]);

  return null;
}
