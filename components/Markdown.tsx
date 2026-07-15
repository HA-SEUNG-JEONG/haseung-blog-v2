import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeHighlight from "rehype-highlight";
import CodeBlock from "./CodeBlock";

// Single markdown pipeline shared by public post pages and the editor preview.
export default function Markdown({ children }: { children: string }) {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        // rehypeSlug before rehypeHighlight so headings get github-slugger ids (TOC anchors).
        rehypePlugins={[rehypeRaw, rehypeSlug, rehypeHighlight]}
        components={{
          // ponytail: dimensions aren't stored on upload, so this only defers offscreen images —
          // CLS stays until width/height ride along with the uploaded URL.
          // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
          img: (props) => <img {...props} loading="lazy" decoding="async" className="h-auto max-w-full" />,
          // client wrapper adds a copy button; the rest of the pipeline stays server-rendered
          pre: CodeBlock,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
