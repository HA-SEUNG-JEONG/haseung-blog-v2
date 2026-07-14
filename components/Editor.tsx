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

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-sm text-neutral-500 hover:underline">
          ← Posts
        </Link>
        <span className="ml-auto text-sm text-neutral-500">{status}</span>
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className={`${inputCls} text-lg font-semibold`}
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
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
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
          className="h-full min-h-[60vh] w-full resize-none rounded border border-neutral-300 bg-transparent p-3 font-mono text-sm dark:border-neutral-700"
        />
        <div className="h-full min-h-[60vh] overflow-auto rounded border border-neutral-200 p-3 dark:border-neutral-800">
          <Markdown>{content}</Markdown>
        </div>
      </div>
    </div>
  );
}
