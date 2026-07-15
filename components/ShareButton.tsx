"use client";

import { useState } from "react";

// Native share where available, clipboard fallback otherwise.
export default function ShareButton({ title }: { title: string }) {
  const [msg, setMsg] = useState("");

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled the share sheet — nothing to do
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setMsg("링크 복사됨");
      setTimeout(() => setMsg(""), 2000);
    } catch {
      setMsg("복사 실패");
      setTimeout(() => setMsg(""), 2000);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={share}
        className="text-neutral-500 hover:text-neutral-900 hover:underline dark:hover:text-neutral-100"
      >
        공유
      </button>
      <span role="status" aria-live="polite" className="text-xs text-neutral-400">
        {msg}
      </span>
    </span>
  );
}
