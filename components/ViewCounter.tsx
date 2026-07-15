"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// Counts a view once per browser session per post. sessionStorage is a first-pass
// guard to avoid needless requests; the real dedupe (IP+day) and admin skip live in
// /api/view, so this can't be bypassed by clearing sessionStorage.
export default function ViewCounter({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `viewed:${slug}`;
    if (sessionStorage.getItem(key)) return;
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) return;
      sessionStorage.setItem(key, "1");
      fetch("/api/view", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug }),
      });
    });
  }, [slug]);

  return null;
}
