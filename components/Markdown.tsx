import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import rehypeHighlight from "rehype-highlight";
import CodeBlock from "./CodeBlock";

// defaultSchema (GitHub's) drops <video>, which the editor inserts for uploaded clips —
// allow it back with its safe attributes. Nothing else needs extending: rehypeSlug (ids)
// and rehypeHighlight (hljs classes) run *after* sanitize, so their output isn't stripped.
const schema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "video", "source"],
  attributes: {
    ...defaultSchema.attributes,
    video: ["controls", "src", "width", "height", "poster", "loop", "muted", "playsInline"],
    source: ["src", "type"],
  },
};

// Single markdown pipeline shared by public post pages and the editor preview.
export default function Markdown({ children }: { children: string }) {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        // rehypeRaw parses embedded HTML, then rehypeSanitize strips anything unsafe (admin
        // authors, but defense-in-depth). Slug/highlight run after so their ids/classes survive.
        rehypePlugins={[rehypeRaw, [rehypeSanitize, schema], rehypeSlug, rehypeHighlight]}
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
