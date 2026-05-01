import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import { Calendar, User } from "lucide-react";

interface TagPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: TagPageProps) {
  const { slug } = await params;
  const tag = await prisma.tag.findUnique({
    where: { slug },
    select: { name: true },
  });

  if (!tag) {
    return { title: "标签未找到" };
  }

  return {
    title: `${tag.name} - WikiFlow`,
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const { slug } = await params;
  const session = await auth();

  const tag = await prisma.tag.findUnique({
    where: { slug },
    include: {
      posts: {
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        include: {
          author: { select: { name: true } },
          category: { select: { name: true, slug: true, color: true } },
        },
      },
    },
  });

  if (!tag) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        user={session?.user ? {
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          role: (session.user as { role?: string }).role,
        } : undefined}
        title={`标签: ${tag.name}`}
        backHref="/posts"
        backLabel="返回文章列表"
      />

      <main className="container mx-auto px-4 md:px-6 py-8">
        <div className="mb-6">
          <Badge
            variant="outline"
            className="text-lg px-4 py-1"
            style={{
              borderColor: tag.color || undefined,
              color: tag.color || undefined,
            }}
          >
            {tag.name}
          </Badge>
          <span className="text-muted-foreground ml-3">
            {tag.posts.length} 篇文章
          </span>
        </div>

      {tag.posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">该标签下暂无文章</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tag.posts.map((post) => (
            <Link key={post.id} href={`/posts/${post.slug}`}>
              <Card className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{post.title}</CardTitle>
                      {post.excerpt && (
                        <CardDescription className="line-clamp-2">
                          {post.excerpt}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <User className="mr-1 h-4 w-4" />
                      {post.author.name || "未知作者"}
                    </div>
                    {post.publishedAt && (
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-4 w-4" />
                        {post.publishedAt.toLocaleDateString("zh-CN")}
                      </div>
                    )}
                    {post.category && post.category.color && (
                      <Link href={`/category/${post.category.slug}`}>
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: post.category.color,
                            color: post.category.color,
                          }}
                        >
                          {post.category.name}
                        </Badge>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
      </main>
    </div>
  );
}
