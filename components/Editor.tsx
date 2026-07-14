"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { updatePost } from "@/app/admin/actions";
import { createClient } from "@/lib/supabase/client";
import Markdown from "@/components/Markdown";
import type { Post } from "@/lib/types";

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function Editor({ post }: { post: Post }) {
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [content, setContent] = useState(post.content_md);
  const [isDraft, setIsDraft] = useState(post.is_draft);
  const [publishedAt, setPublishedAt] = useState(toLocalInput(post.published_at));
  const [commentsEnabled, setCommentsEnabled] = useState(post.comments_enabled);
  const [status, setStatus] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const save = useCallback(
    async (patch: Parameters<typeof updatePost>[1]) => {
      setStatus("saving…");
      const error = await updatePost(post.id, patch);
      setStatus(error ? `error: ${error}` : `saved ${new Date().toLocaleTimeString()}`);
      return !error;
    },
    [post.id]
  );

  // --- autosave: content fields only, 1.5s after last keystroke ---
  const latest = useRef({ title, slug, content });
  useEffect(() => {
    latest.current = { title, slug, content };
  });
  const dirty = useRef(false);
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    dirty.current = true;
    const t = setTimeout(() => {
      dirty.current = false;
      save({
        title: latest.current.title,
        slug: latest.current.slug,
        content_md: latest.current.content,
      });
    }, 1500);
    return () => clearTimeout(t);
  }, [title, slug, content, save]);

  // flush pending autosave on unmount
  useEffect(
    () => () => {
      if (dirty.current)
        updatePost(post.id, {
          title: latest.current.title,
          slug: latest.current.slug,
          content_md: latest.current.content,
        });
    },
    [post.id]
  );

  // --- paste/drop upload to Supabase Storage ---
  function insertAtCursor(text: string) {
    const ta = textareaRef.current;
    setContent((prev) =>
      ta ? prev.slice(0, ta.selectionStart) + text + prev.slice(ta.selectionEnd) : `${prev}\n${text}`
    );
  }

  // --- toolbar helpers ---
  function applyEdit(next: string, selStart: number, selEnd: number) {
    setContent(next);
    requestAnimationFrame(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      ta.focus();
      ta.setSelectionRange(selStart, selEnd);
    });
  }

  function wrapSelection(before: string, after: string, placeholder: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const { selectionStart: start, selectionEnd: end } = ta;
    const selected = content.slice(start, end) || placeholder;
    const next = content.slice(0, start) + before + selected + after + content.slice(end);
    applyEdit(next, start + before.length, start + before.length + selected.length);
  }

  function prefixLines(prefix: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const { selectionStart: start, selectionEnd: end } = ta;
    const blockStart = content.lastIndexOf("\n", start - 1) + 1;
    const blockEndIdx = content.indexOf("\n", end);
    const blockEnd = blockEndIdx === -1 ? content.length : blockEndIdx;
    const lines = content.slice(blockStart, blockEnd).split("\n");
    const allPrefixed = lines.every((l) => l.startsWith(prefix));
    const replaced = lines
      .map((l) => (allPrefixed ? l.slice(prefix.length) : prefix + l))
      .join("\n");
    const next = content.slice(0, blockStart) + replaced + content.slice(blockEnd);
    applyEdit(next, blockStart, blockStart + replaced.length);
  }

  function handleShortcut(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!(e.metaKey || e.ctrlKey)) return;
    const key = e.key.toLowerCase();
    if (key === "b") wrapSelection("**", "**", "bold");
    else if (key === "i") wrapSelection("*", "*", "italic");
    else if (key === "k") wrapSelection("[", "](url)", "text");
    else return;
    e.preventDefault();
  }

  async function uploadFiles(files: Iterable<File>) {
    const supabase = createClient();
    for (const file of files) {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) continue;
      setStatus("uploading…");
      const ext = file.name.split(".").pop() || "bin";
      const path = `${post.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("uploads").upload(path, file);
      if (error) {
        setStatus(`upload error: ${error.message}`);
        continue;
      }
      const { data } = supabase.storage.from("uploads").getPublicUrl(path);
      insertAtCursor(
        file.type.startsWith("video/")
          ? `<video controls src="${data.publicUrl}"></video>`
          : `![](${data.publicUrl})`
      );
      setStatus("uploaded");
    }
  }

  // --- publish controls ---
  async function publish() {
    const iso = publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString();
    if (!publishedAt) setPublishedAt(toLocalInput(iso));
    const ok = await save({
      is_draft: false,
      published_at: iso,
      title,
      slug,
      content_md: content,
    });
    if (ok) setIsDraft(false);
  }

  async function unpublish() {
    const ok = await save({ is_draft: true });
    if (ok) setIsDraft(true);
  }

  const inputCls =
    "rounded border border-neutral-300 bg-transparent px-2 py-1 text-sm dark:border-neutral-700";
  const toolBtnCls =
    "rounded px-1.5 py-0.5 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100";

  const toolbar: { label: React.ReactNode; title: string; run: () => void }[] = [
    { label: <strong>B</strong>, title: "Bold (⌘B)", run: () => wrapSelection("**", "**", "bold") },
    { label: <em>I</em>, title: "Italic (⌘I)", run: () => wrapSelection("*", "*", "italic") },
    { label: <s>S</s>, title: "Strikethrough", run: () => wrapSelection("~~", "~~", "strike") },
    { label: "H2", title: "Heading 2", run: () => prefixLines("## ") },
    { label: "H3", title: "Heading 3", run: () => prefixLines("### ") },
    { label: "🔗", title: "Link (⌘K)", run: () => wrapSelection("[", "](url)", "text") },
    { label: "`code`", title: "Inline code", run: () => wrapSelection("`", "`", "code") },
    { label: "```", title: "Code block", run: () => wrapSelection("```\n", "\n```", "code") },
    { label: ">", title: "Quote", run: () => prefixLines("> ") },
    { label: "•", title: "List", run: () => prefixLines("- ") },
  ];

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-sm text-neutral-500 hover:underline">
          ← Posts
        </Link>
        {status && (
          <span className="ml-auto rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
            {status}
          </span>
        )}
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="border-b border-neutral-200 bg-transparent px-1 py-2 text-2xl font-bold focus:border-neutral-400 focus:outline-none dark:border-neutral-800 dark:focus:border-neutral-600"
      />
      <input
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        placeholder="slug"
        className={`${inputCls} font-mono`}
      />

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <label className="flex items-center gap-2">
          published at
          <input
            type="datetime-local"
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
            onBlur={() => {
              if (!isDraft && publishedAt)
                save({ published_at: new Date(publishedAt).toISOString() });
            }}
            className={inputCls}
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={commentsEnabled}
            onChange={(e) => {
              setCommentsEnabled(e.target.checked);
              save({ comments_enabled: e.target.checked });
            }}
          />
          comments
        </label>
        {isDraft ? (
          <button
            onClick={publish}
            className="rounded bg-neutral-900 px-3 py-1 text-white dark:bg-neutral-100 dark:text-black"
          >
            Publish
          </button>
        ) : (
          <button onClick={unpublish} className="rounded border px-3 py-1">
            Unpublish
          </button>
        )}
        <span className="text-neutral-500">{isDraft ? "draft" : "published"}</span>
      </div>

      <div className="grid min-h-[60vh] flex-1 grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex min-h-[60vh] flex-col overflow-hidden rounded-lg border border-neutral-300 dark:border-neutral-700">
          <div
            className="flex flex-wrap items-center gap-1 border-b border-neutral-200 px-2 py-1.5 dark:border-neutral-800"
            onMouseDown={(e) => e.preventDefault()}
          >
            <span className="mr-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
              Markdown
            </span>
            {toolbar.map((t) => (
              <button key={t.title} type="button" title={t.title} onClick={t.run} className={toolBtnCls}>
                {t.label}
              </button>
            ))}
            <button
              type="button"
              title="Upload image/video"
              onClick={() => fileInputRef.current?.click()}
              className={toolBtnCls}
            >
              🖼
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) uploadFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleShortcut}
            onPaste={(e) => {
              if (e.clipboardData.files.length) {
                e.preventDefault();
                uploadFiles(e.clipboardData.files);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              uploadFiles(e.dataTransfer.files);
            }}
            onDragOver={(e) => e.preventDefault()}
            placeholder="Write markdown… (paste or drop images/videos)"
            className="w-full flex-1 resize-none bg-transparent p-3 font-mono text-sm focus:outline-none"
          />
        </div>
        <div className="flex min-h-[60vh] flex-col overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="border-b border-neutral-200 px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
            Preview
          </div>
          <div className="flex-1 overflow-auto p-3">
            <Markdown>{content}</Markdown>
          </div>
        </div>
      </div>
    </div>
  );
}
