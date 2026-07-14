import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";

// Single markdown pipeline shared by public post pages and the editor preview.
export default function Markdown({ children }: { children: string }) {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={{
          // ponytail: dimensions aren't stored on upload, so this only defers offscreen images —
          // CLS stays until width/height ride along with the uploaded URL.
          // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
          img: (props) => <img {...props} loading="lazy" decoding="async" className="h-auto max-w-full" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
