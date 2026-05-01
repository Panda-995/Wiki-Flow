import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import { Calendar, User } from "lucide-react";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });

  if (!category) {
    return { title: "分类未找到" };
  }

  return {
    title: `${category.name} - WikiFlow`,
    description: category.description,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const session = await auth();

  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      posts: {
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        include: {
          author: { select: { name: true } },
          tags: { select: { name: true, slug: true } },
        },
      },
      parent: { select: { name: true, slug: true } },
      children: { select: { name: true, slug: true } },
    },
  });

  if (!category) {
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
        title={`分类: ${category.name}`}
        backHref="/posts"
        backLabel="返回文章列表"
      />

      <main className="container mx-auto px-4 md:px-6 py-8">
        <div className="mb-6">
          {category.parent && (
            <Link href={`/category/${category.parent.slug}`}>
              <Badge variant="outline" className="mb-2">
                上级: {category.parent.name}
              </Badge>
            </Link>
          )}
          <h1 className="text-3xl font-bold mb-2" style={{ color: category.color || undefined }}>
            {category.name}
          </h1>
          {category.description && (
            <p className="text-muted-foreground">{category.description}</p>
          )}
        </div>

      {category.children.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">子分类</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {category.children.map((child) => (
              <Link key={child.slug} href={`/category/${child.slug}`}>
                <Badge variant="outline">{child.name}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {category.posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">该分类下暂无文章</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {category.posts.map((post) => (
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
                    {post.tags.length > 0 && (
                      <div className="flex gap-1">
                        {post.tags.slice(0, 3).map((tag) => (
                          <Link key={tag.slug} href={`/tag/${tag.slug}`}>
                            <Badge variant="secondary" className="text-xs">
                              {tag.name}
                            </Badge>
                          </Link>
                        ))}
                      </div>
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
