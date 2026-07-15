"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { updatePost } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";
import ConfirmDialog from "./ConfirmDialog";
import Markdown from "./Markdown";
import type { Post } from "@/lib/types";

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

// the editor owns this URL: slug renames and the preview toggle both rewrite it in place
function editUrl(slug: string, preview: boolean) {
  return `/posts/${encodeURIComponent(slug)}?edit=1${preview ? "&preview=1" : ""}`;
}

export default function Editor({
  post,
  initialPreview = false,
}: {
  post: Post;
  initialPreview?: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [slugError, setSlugError] = useState("");
  const [tags, setTags] = useState(post.tags?.join(", ") ?? "");
  const [content, setContent] = useState(post.content_md);
  const [isDraft, setIsDraft] = useState(post.is_draft);
  const [publishedAt, setPublishedAt] = useState(toLocalInput(post.published_at));
  const [commentsEnabled, setCommentsEnabled] = useState(post.comments_enabled);
  const [status, setStatus] = useState("");
  const [askPublish, setAskPublish] = useState(false);
  const [preview, setPreview] = useState(initialPreview);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const slugRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const save = useCallback(
    async (patch: Parameters<typeof updatePost>[1]) => {
      setStatus("저장 중…");
      const error = await updatePost(post.id, patch);
      setStatus(
        error ? `오류: ${error.message}` : `저장됨 ${new Date().toLocaleTimeString("ko-KR")}`
      );
      // slug errors belong next to the slug field, not in the status pill
      if (error?.field === "slug") {
        setSlugError(error.message);
        slugRef.current?.focus();
      } else if (!error) {
        setSlugError("");
      }
      return !error;
    },
    [post.id]
  );

  // --- autosave: title/content only, 1.5s after last keystroke ---
  // slug stays out: it is the route key, and autosaving a half-typed slug would
  // strand this URL. It is committed on blur instead (see flush).
  const latest = useRef({ title, content, slug });
  useEffect(() => {
    latest.current = { title, content, slug };
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
      save({ title: latest.current.title, content_md: latest.current.content });
    }, 1500);
    return () => clearTimeout(t);
  }, [title, content, save]);

  // Commit everything pending in one write. The slug rides along so a rename can
  // never land without the text that was typed next to it.
  const savedSlug = useRef(post.slug);
  const flush = useCallback(async () => {
    dirty.current = false;
    const next = slug.trim();
    const renaming = next !== savedSlug.current;
    const previous = savedSlug.current;

    // Swap the URL *before* the write, not after: updatePost revalidates, Next refetches
    // whatever URL is current, and the old slug is gone by then — that refetch 404s.
    // history.replaceState (not router.replace) so the editor is never remounted mid-edit.
    if (renaming) {
      savedSlug.current = next;
      window.history.replaceState({}, "", editUrl(next, preview));
    }

    const ok = await save({
      title,
      content_md: content,
      ...(renaming ? { slug: next } : {}),
    });

    if (renaming && !ok) {
      // slug taken or invalid — put the URL back on the row that still exists
      savedSlug.current = previous;
      window.history.replaceState({}, "", editUrl(previous, preview));
    } else if (renaming) {
      setSlug(next);
    }
    return ok;
  }, [save, slug, title, content, preview]);

  // warn before closing the tab with unsaved changes. dirty covers title/content;
  // slug is separate (it autosaves on blur, not on keystroke), so an uncommitted
  // rename with no blur must be caught explicitly or it would leave silently.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty.current || latest.current.slug.trim() !== savedSlug.current)
        e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // flush pending edits on unmount — best effort. A slug typed but never blurred
  // rides along so it isn't lost (if the write fails, same outcome as before).
  useEffect(
    () => () => {
      const slugChanged = latest.current.slug.trim() !== savedSlug.current;
      if (dirty.current || slugChanged)
        updatePost(post.id, {
          title: latest.current.title,
          content_md: latest.current.content,
          ...(slugChanged ? { slug: latest.current.slug.trim() } : {}),
        });
    },
    [post.id]
  );

  function togglePreview() {
    const next = !preview;
    setPreview(next);
    window.history.replaceState({}, "", editUrl(savedSlug.current, next));
  }

  // Programmatic edits go through execCommand("insertText") so they join the
  // textarea's native undo/redo stack — ⌘Z / ⌘⇧Z / ⌘Y then cover every toolbar
  // action for free. Plain setContent would wipe that history on each edit.
  // `sel` optionally repositions the caret after the insert.
  function replaceRange(
    start: number,
    end: number,
    text: string,
    sel?: [number, number]
  ) {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.focus();
    ta.setSelectionRange(start, end);
    // fires a native input event → React's onChange updates `content`
    document.execCommand("insertText", false, text);
    if (sel) requestAnimationFrame(() => ta.setSelectionRange(sel[0], sel[1]));
  }

  // --- paste/drop upload to Supabase Storage ---
  function insertAtCursor(text: string) {
    const ta = textareaRef.current;
    if (ta && document.activeElement === ta) {
      document.execCommand("insertText", false, text); // undoable, keeps caret
    } else {
      setContent((prev) =>
        ta ? prev.slice(0, ta.selectionStart) + text + prev.slice(ta.selectionEnd) : `${prev}\n${text}`
      );
    }
  }

  // --- toolbar helpers ---
  function wrapSelection(before: string, after: string, placeholder: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const { selectionStart: start, selectionEnd: end } = ta;
    const selected = content.slice(start, end) || placeholder;
    replaceRange(start, end, before + selected + after, [
      start + before.length,
      start + before.length + selected.length,
    ]);
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
    replaceRange(blockStart, blockEnd, replaced, [blockStart, blockStart + replaced.length]);
  }

  // ⌘Z / ⌘⇧Z / ⌘Y (undo/redo) fall through to the browser — every edit above is on
  // its native stack, so they need no handling here.
  function handleShortcut(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!(e.metaKey || e.ctrlKey)) return;
    const key = e.key.toLowerCase();
    if (key === "b") wrapSelection("**", "**", "굵게");
    else if (key === "i") wrapSelection("*", "*", "기울임");
    else if (key === "k") wrapSelection("[", "](url)", "텍스트");
    else if (key === "e") wrapSelection("`", "`", "code");
    else if (key === "s") flush(); // explicit save on top of autosave
    else return;
    e.preventDefault();
  }

  async function uploadFiles(files: Iterable<File>) {
    const supabase = createClient();
    for (const file of files) {
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) continue;
      setStatus("업로드 중…");
      const ext = file.name.split(".").pop() || "bin";
      const path = `${post.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("uploads").upload(path, file);
      if (error) {
        setStatus(`업로드 오류: ${error.message}`);
        continue;
      }
      const { data } = supabase.storage.from("uploads").getPublicUrl(path);
      insertAtCursor(
        file.type.startsWith("video/")
          ? `<video controls src="${data.publicUrl}"></video>`
          : `![](${data.publicUrl})`
      );
      setStatus("업로드 완료");
    }
  }

  // leave edit mode: flush pending edits, then land on the post itself (which is the preview now)
  async function done() {
    await flush();
    router.push(`/posts/${encodeURIComponent(savedSlug.current)}`);
  }

  // --- publish controls ---
  function publish() {
    if (!slug.trim()) {
      setSlugError("slug을 입력해 주세요.");
      slugRef.current?.focus();
      return;
    }
    if (slug.startsWith("draft-")) {
      setAskPublish(true); // slug is still the auto-generated one — confirm first
      return;
    }
    doPublish();
  }

  async function doPublish() {
    setAskPublish(false);
    if (!(await flush())) return; // slug/title/content land first, then the publish flags
    const iso = publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString();
    if (!publishedAt) setPublishedAt(toLocalInput(iso));
    const ok = await save({ is_draft: false, published_at: iso });
    if (ok) {
      setIsDraft(false);
      router.refresh();
    }
  }

  async function unpublish() {
    const ok = await save({ is_draft: true });
    if (ok) {
      setIsDraft(true);
      router.refresh();
    }
  }

  // text-base on mobile: anything under 16px makes iOS Safari zoom on focus
  const inputCls =
    "rounded border border-neutral-300 bg-transparent px-2 py-1 text-base sm:text-sm dark:border-neutral-700";
  const toolBtnCls =
    "inline-flex h-7 min-w-7 items-center justify-center rounded px-1.5 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100";

  const toolbar: { label: React.ReactNode; title: string; run: () => void }[] = [
    { label: <strong>B</strong>, title: "굵게 (⌘B)", run: () => wrapSelection("**", "**", "굵게") },
    { label: <em>I</em>, title: "기울임 (⌘I)", run: () => wrapSelection("*", "*", "기울임") },
    { label: <s>S</s>, title: "취소선", run: () => wrapSelection("~~", "~~", "취소선") },
    { label: "H2", title: "제목 2", run: () => prefixLines("## ") },
    { label: "H3", title: "제목 3", run: () => prefixLines("### ") },
    { label: "🔗", title: "링크 (⌘K)", run: () => wrapSelection("[", "](url)", "텍스트") },
    { label: "`code`", title: "인라인 코드 (⌘E)", run: () => wrapSelection("`", "`", "code") },
    { label: "```", title: "코드 블록", run: () => wrapSelection("```\n", "\n```", "code") },
    { label: ">", title: "인용", run: () => prefixLines("> ") },
    { label: "•", title: "목록", run: () => prefixLines("- ") },
  ];

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-3">
        <button onClick={done} className="text-sm text-neutral-500 hover:underline">
          ← 완료
        </button>
        <span
          role="status"
          aria-live="polite"
          className={`ml-auto text-xs ${
            status
              ? "rounded-full bg-neutral-100 px-2.5 py-0.5 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
              : ""
          }`}
        >
          {status}
        </span>
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목"
        aria-label="제목"
        className="border-b border-neutral-200 bg-transparent px-1 py-2 text-2xl font-bold focus:border-neutral-400 focus:outline-none dark:border-neutral-800 dark:focus:border-neutral-600"
      />
      <div>
        <input
          ref={slugRef}
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          onBlur={flush}
          placeholder="slug"
          aria-label="slug"
          aria-invalid={!!slugError}
          aria-describedby={slugError ? "slug-error" : undefined}
          spellCheck={false}
          className={`${inputCls} w-full font-mono ${slugError ? "border-red-500 dark:border-red-500" : ""}`}
        />
        {slugError && (
          <p id="slug-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
            {slugError}
          </p>
        )}
      </div>
      <input
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        onBlur={() =>
          save({ tags: tags.split(",").map((t) => t.trim()).filter(Boolean) })
        }
        placeholder="태그 (콤마로 구분)"
        aria-label="태그"
        className={`${inputCls} w-full`}
      />

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <label className="flex items-center gap-2">
          발행 시각
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
          댓글
        </label>
        {isDraft ? (
          <button
            onClick={publish}
            className="rounded bg-neutral-900 px-3 py-1 text-white dark:bg-neutral-100 dark:text-black"
          >
            발행
          </button>
        ) : (
          <button onClick={unpublish} className="rounded border px-3 py-1">
            발행 취소
          </button>
        )}
        <span className="text-neutral-500">{isDraft ? "초안" : "발행됨"}</span>
      </div>

      <div className="flex min-h-[60vh] flex-1 flex-col overflow-hidden rounded-lg border border-neutral-300 dark:border-neutral-700">
          <div
            className="flex flex-wrap items-center gap-1 border-b border-neutral-200 px-2 py-1.5 dark:border-neutral-800"
            onMouseDown={(e) => e.preventDefault()}
          >
            <span className="mr-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
              Markdown
            </span>
            {toolbar.map((t) => (
              <button
                key={t.title}
                type="button"
                title={t.title}
                aria-label={t.title}
                onClick={t.run}
                className={toolBtnCls}
              >
                {t.label}
              </button>
            ))}
            <button
              type="button"
              title="이미지·비디오 업로드"
              aria-label="이미지·비디오 업로드"
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
            <button
              type="button"
              title="미리보기"
              aria-label="미리보기"
              onClick={togglePreview}
              aria-pressed={preview}
              className={`${toolBtnCls} ml-auto ${
                preview ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100" : ""
              }`}
            >
              미리보기
            </button>
          </div>
          <div className="flex flex-1 overflow-hidden">
            {/* under sm the preview replaces the textarea — two half-width panes at 375px are unusable */}
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
              placeholder="마크다운으로 작성하세요… (이미지·비디오는 붙여넣기/드롭)"
              className={`resize-none bg-transparent p-3 font-mono text-base focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-neutral-400 sm:text-sm ${
                preview ? "hidden sm:block sm:w-1/2" : "w-full"
              }`}
            />
            {preview && (
              <div className="w-full overflow-y-auto border-neutral-200 p-3 sm:w-1/2 sm:border-l dark:border-neutral-800">
                <Markdown>{content}</Markdown>
              </div>
            )}
          </div>
      </div>

      <ConfirmDialog
        open={askPublish}
        message={"slug가 자동 생성값(draft-…) 그대로입니다.\n이대로 발행할까요?"}
        confirmLabel="발행"
        onCancel={() => setAskPublish(false)}
        onConfirm={doPublish}
      />
    </div>
  );
}
