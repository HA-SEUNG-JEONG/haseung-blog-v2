"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// Fires the increment RPC once per browser session per post; admin sessions don't count.
export default function ViewCounter({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `viewed:${slug}`;
    if (sessionStorage.getItem(key)) return;
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) return;
      sessionStorage.setItem(key, "1");
      supabase.rpc("increment_view", { post_slug: slug });
    });
  }, [slug]);

  return null;
}
