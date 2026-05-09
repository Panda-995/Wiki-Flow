"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/clipboard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, User, Eye, ArrowRight, Clock, Share2, Bookmark, BookOpen, List, Gauge, FolderTree, Tags } from "lucide-react";
import { CommentSection } from "@/components/comment-section";
import { MarkdownViewer } from "@/components/markdown/markdown-viewer";

interface PostData {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  status: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  author: { name: string };
  category?: { name: string; color?: string; slug?: string };
  tags: { name: string; slug?: string }[];
  viewCount?: number;
}

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export default function PostPage({ params }: PostPageProps) {
  const [slug, setSlug] = useState<string>("");
  const [post, setPost] = useState<PostData | null>(null);
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);
  const [readingProgress, setReadingProgress] = useState(0);
  const [activeHeading, setActiveHeading] = useState("");
  const [copied, setCopied] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const articleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    params.then(p => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    const handleScroll = () => {
      if (!articleRef.current) return;

      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const progress = (scrollTop / (documentHeight - windowHeight)) * 100;
      setReadingProgress(Math.min(100, Math.max(0, progress)));

      const headingElements = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
      let currentHeading = "";

      headingElements.forEach((heading) => {
        const rect = heading.getBoundingClientRect();
        if (rect.top < windowHeight * 0.3) {
          currentHeading = heading.id;
        }
      });

      setActiveHeading(currentHeading);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [post]);

  const fetchPost = useCallback(async () => {
    try {
      const res = await fetch(`/api/posts/${slug}`);
      if (!res.ok) {
        notFound();
        return;
      }
      const data = await res.json();
      setPost(data.post);

      setTimeout(() => {
        const headingElements = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
        const extractedHeadings: { id: string; text: string; level: number }[] = [];
        
        headingElements.forEach((heading, index) => {
          if (!heading.id) {
            heading.id = `heading-${index}`;
          }
          extractedHeadings.push({
            id: heading.id,
            text: heading.textContent || "",
            level: parseInt(heading.tagName.substring(1)),
          });
        });

        setHeadings(extractedHeadings);
      }, 100);
    } catch (error) {
      console.error("Failed to fetch post:", error);
      notFound();
    }
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    fetchPost();
  }, [slug, fetchPost]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const copyLink = () => {
    copyToClipboard(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sharePost = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.excerpt,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      copyLink();
    }
    setShowShareTooltip(true);
    setTimeout(() => setShowShareTooltip(false), 2000);
  };

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-muted">
        <div 
          className="h-full bg-primary transition-all duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex items-center justify-between h-16 px-4 md:px-6">
              <div className="flex items-center gap-4">
                <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-lg font-bold hidden sm:block">WikiFlow</span>
                </Link>
                <div className="hidden md:block h-6 w-px bg-border"></div>
                <h1 className="text-lg font-semibold hidden md:block">文章详情</h1>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={sharePost} className="gap-2 relative">
                  <Share2 className="h-4 w-4" />
                  <span className="hidden sm:inline">分享</span>
                  {showShareTooltip && (
                    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded whitespace-nowrap">
                      {copied ? "已复制链接" : "链接已复制"}
                    </span>
                  )}
                </Button>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Bookmark className="h-4 w-4" />
                  <span className="hidden sm:inline">收藏</span>
                </Button>
              </div>
            </div>
        </header>

        <main className="container mx-auto px-4 md:px-6 py-8">
          <article className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 max-w-7xl mx-auto">
            <div ref={articleRef}>
              <header className="mb-8 space-y-6">
                <div className="flex flex-wrap items-center gap-2">
                  {post.category && post.category.color && (
                    <Link href={`/category/${post.category.slug}`}>
                      <Badge
                        style={{
                          backgroundColor: post.category.color + "20",
                          color: post.category.color,
                          borderColor: post.category.color
                        }}
                        className="hover:opacity-80 transition-opacity"
                      >
                        {post.category.name}
                      </Badge>
                    </Link>
                  )}
                  {post.tags.map((tag) => (
                    <Link key={tag.slug} href={`/tag/${tag.slug}`}>
                      <Badge variant="secondary" className="hover:bg-secondary/80 transition-colors">
                        {tag.name}
                      </Badge>
                    </Link>
                  ))}
                </div>

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                  {post.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{post.author.name || "未知作者"}</span>
                  </div>
                  {post.publishedAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(post.publishedAt).toLocaleDateString("zh-CN")}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span>{post.viewCount} 次阅读</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>约 {Math.ceil(post.content.length / 500)} 分钟</span>
                  </div>
                </div>

                {post.excerpt && (
                  <p className="text-lg text-muted-foreground leading-relaxed border-l-4 border-primary/30 pl-4">
                    {post.excerpt}
                  </p>
                )}
              </header>

              <MarkdownViewer content={post.content} className="prose-lg" />

              <div className="mt-16 pt-8 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={sharePost} className="gap-2">
                      <Share2 className="h-4 w-4" />
                      分享文章
                    </Button>
                  </div>
                  <Link href="/posts">
                    <Button variant="ghost" className="gap-2">
                      查看更多文章
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              <CommentSection postId={post.id} />
            </div>

            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardContent className="py-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm flex items-center gap-1.5">
                        <List className="h-3.5 w-3.5 text-muted-foreground" />
                        目录
                      </h3>
                      {headings.length > 0 ? (
                        <nav className="space-y-1">
                          {headings.map((heading) => (
                            <button
                              key={heading.id}
                              onClick={() => scrollToHeading(heading.id)}
                              className={`block w-full text-left text-sm py-1 px-2 rounded transition-all ${
                                activeHeading === heading.id
                                  ? "text-primary bg-primary/10 font-medium"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
                              }`}
                              style={{ paddingLeft: `${(heading.level - 1) * 12 + 8}px` }}
                            >
                              {heading.text}
                            </button>
                          ))}
                        </nav>
                      ) : (
                        <p className="text-sm text-muted-foreground">暂无目录</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardContent className="py-4 space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm flex items-center gap-1.5">
                        <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                        阅读进度
                      </h3>
                      <Progress value={readingProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground text-center">
                        {Math.round(readingProgress)}% 已读
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {post.category && (
                  <Card className="border-0 shadow-lg">
                    <CardContent className="py-4 space-y-3">
                      <h3 className="font-semibold text-sm flex items-center gap-1.5">
                        <FolderTree className="h-3.5 w-3.5 text-muted-foreground" />
                        所属分类
                      </h3>
                      <Link 
                        href={`/category/${post.category.slug}`}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: post.category.color || "#888" }}
                        />
                        <span className="text-sm">{post.category.name}</span>
                        <ArrowRight className="h-3 w-3 ml-auto text-muted-foreground" />
                      </Link>
                    </CardContent>
                  </Card>
                )}

                {post.tags.length > 0 && (
                  <Card className="border-0 shadow-lg">
                    <CardContent className="py-4 space-y-3">
                      <h3 className="font-semibold text-sm flex items-center gap-1.5">
                        <Tags className="h-3.5 w-3.5 text-muted-foreground" />
                        相关标签
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                          <Link key={tag.slug} href={`/tag/${tag.slug}`}>
                            <Badge variant="secondary" className="hover:bg-secondary/80 transition-colors">
                              {tag.name}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </aside>
          </article>
        </main>

        <div className="fixed bottom-6 right-6 lg:hidden z-50">
          <Button size="icon" className="rounded-full shadow-xl" onClick={sharePost}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
