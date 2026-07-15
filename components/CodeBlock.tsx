"use client";

import { useRef, useState, type ComponentPropsWithoutRef } from "react";

// Wraps markdown <pre> blocks with a copy button. Reads the rendered code via ref
// so it stays server-rendered except for this one client leaf.
export default function CodeBlock({ children, ...props }: ComponentPropsWithoutRef<"pre">) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  async function copy() {
    const text = ref.current?.textContent ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked (insecure context / permissions) — leave the button idle
    }
  }

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "복사됨" : "코드 복사"}
        className="absolute right-2 top-2 z-10 rounded border border-neutral-600 bg-neutral-800 px-2 py-1 text-xs text-neutral-200 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 hover:bg-neutral-700"
      >
        {copied ? "복사됨" : "복사"}
      </button>
      <pre ref={ref} {...props}>
        {children}
      </pre>
    </div>
  );
}
