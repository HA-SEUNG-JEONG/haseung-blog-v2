import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { GoogleAnalytics } from "@next/third-parties/google";
import Navbar from "@/components/Navbar";
import "highlight.js/styles/github-dark.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "haseung", template: "%s · haseung" },
  description: "haseung's dev blog",
};

// browser chrome matches the page background in both themes
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:z-10 focus:m-2 focus:rounded focus:bg-neutral-900 focus:px-3 focus:py-2 focus:text-white dark:focus:bg-neutral-100 dark:focus:text-black"
        >
          본문으로 건너뛰기
        </a>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Navbar />
          <main id="main" className="mx-auto w-full max-w-3xl flex-1 p-4">
            {children}
          </main>
          <footer className="border-t border-neutral-200 dark:border-neutral-800">
            <div className="mx-auto w-full max-w-3xl p-4 text-sm text-neutral-500">
              <a
                href="https://github.com/HA-SEUNG-JEONG"
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                GitHub
              </a>
            </div>
          </footer>
        </ThemeProvider>
        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  );
}
