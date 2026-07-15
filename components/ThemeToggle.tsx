"use client";

import { useTheme } from "next-themes";

// Icon visibility is pure CSS (`dark:` variant), so server and client render
// identical DOM — no mounted-state dance, no hydration mismatch.
export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      aria-label="테마 전환"
      className="w-8 text-lg"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <span className="dark:hidden">🌙</span>
      <span className="hidden dark:inline">☀️</span>
    </button>
  );
}
