import matter from "gray-matter";
import slugify_lib from "slugify";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";

export const slugify = (text: string) =>
  slugify_lib(text, {
    lower: true,
    strict: true,
    trim: true,
  });

export interface ParsedMarkdown {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  tags?: string[];
  category?: string;
  author?: string;
  date?: string;
  status?: "draft" | "published" | "archived";
  meta?: {
    aliases?: string[];
    canonical?: string;
    robots?: string;
  };
}

export function parseMarkdown(content: string): ParsedMarkdown {
  const { data, content: body } = matter(content);

  return {
    title: data.title || "Untitled",
    slug: data.slug || slugify(data.title || "untitled"),
    content: body,
    excerpt: data.excerpt || data.description || extractExcerpt(body),
    coverImage: data.coverImage || data.cover || data.image,
    tags: data.tags || data.tag?.split(",").map((t: string) => t.trim()) || [],
    category: data.category,
    author: data.author,
    date: data.date,
    status: data.status || "draft",
    meta: {
      aliases: data.aliases || [],
      canonical: data.canonical,
      robots: data.robots,
    },
  };
}

export function extractExcerpt(content: string, maxLength = 160): string {
  const plainText = content
    .replace(/#+\s/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n+/g, " ")
    .trim();

  if (plainText.length <= maxLength) return plainText;
  return plainText.slice(0, maxLength).replace(/\s+\S*$/, "") + "...";
}

export function extractHeadings(content: string): { id: string; text: string; level: number }[] {
  const headings: { id: string; text: string; level: number }[] = [];
  const lines = content.split("\n");

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = slugify(text);
      headings.push({ id, text, level });
    }
  }

  return headings;
}

export async function renderMarkdown(content: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeHighlight, { detect: true })
    .use(rehypeKatex)
    .use(rehypeStringify)
    .process(content);

  return String(result);
}

export function generatePostSlug(title: string): string {
  return slugify(title);
}
