"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/clipboard";

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

function CodeBlock({ children, className }: { children: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const language = className?.replace("language-", "") || "text";

  const handleCopy = async () => {
    await copyToClipboard(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <div className="flex items-center justify-between bg-muted px-3 py-1 rounded-t-md border-b">
        <span className="text-xs text-muted-foreground">{language}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "已复制" : "复制"}
        </Button>
      </div>
      <pre className="rounded-t-none border-t-0">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

export function MarkdownViewer({ content, className }: MarkdownViewerProps) {
  return (
    <article className={`prose prose-slate dark:prose-invert max-w-none ${className || ""}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={{
          code({ className, children, ...props }) {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <CodeBlock className={className}>
                {String(children).replace(/\n$/, "")}
              </CodeBlock>
            );
          },
          a({ href, children }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            );
          },
          img({ src, alt }) {
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={alt || ""} className="rounded-lg max-w-full" loading="lazy" />
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}

interface TableOfContentsProps {
  headings: { id: string; text: string; level: number }[];
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-80px 0px -80% 0px" }
    );

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav className="space-y-1">
      <p className="text-sm font-semibold mb-2">目录</p>
      {headings.map((heading) => (
        <a
          key={heading.id}
          href={`#${heading.id}`}
          className={`block text-sm py-1 transition-colors ${
            heading.level > 2 ? "pl-4" : ""
          } ${
            activeId === heading.id
              ? "text-primary font-medium"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={(e) => {
            e.preventDefault();
            const element = document.getElementById(heading.id);
            if (element) {
              element.scrollIntoView({ behavior: "smooth" });
              setActiveId(heading.id);
            }
          }}
        >
          {heading.text}
        </a>
      ))}
    </nav>
  );
}
