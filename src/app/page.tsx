import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import { 
  BookOpen, Plus, FileText, Download, MessageSquare, Sparkles, TrendingUp, Users, Clock, ArrowRight 
} from "lucide-react";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const quickActions = [
    { icon: Plus, label: "写新文章", href: "/posts/new", gradient: "from-primary to-primary/80" },
    { icon: FileText, label: "文章列表", href: "/posts", gradient: "from-blue-500 to-blue-400" },
    { icon: Download, label: "导入文件", href: "/import", gradient: "from-green-500 to-green-400" },
    { icon: MessageSquare, label: "留言板", href: "/guestbook", gradient: "from-pink-500 to-pink-400" },
  ];

  const stats = await getStats();
  const recentPosts = await getRecentPosts();

  return (
    <div className="min-h-screen bg-background">
      <Header user={session.user} />

      <main className="container mx-auto px-6 py-12 space-y-16">
        <section className="text-center py-8 space-y-6 max-w-2xl mx-auto">
          <div>
            <Badge variant="outline" className="mb-4">
              <Sparkles className="h-4 w-4 mr-2" />
              笔记本风格知识管理
            </Badge>
            <h1 className="text-5xl font-bold tracking-tight mt-4">
              欢迎回来，< span className="text-primary">{session.user.name || session.user.email?.split('@')[0]}</span>
            </h1>
            <p className="text-xl text-muted-foreground mt-4">
              您的个人知识笔记本，随时记录灵感，构建知识网络
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-4 pt-6">
            <Link href="/posts/new">
              <Button size="lg" className="gap-2 text-lg px-8 h-14 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
                <Plus className="h-5 w-5" />
                开始写作
              </Button>
            </Link>
            <Link href="/posts">
              <Button size="lg" variant="outline" className="gap-2 text-lg px-8 h-14 hover:scale-105 transition-all duration-300">
                <FileText className="h-5 w-5" />
                浏览文章
              </Button>
            </Link>
          </div>
        </section>

        <section className="py-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            数据概览
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">文章总数</p>
                    <p className="text-3xl font-bold">{stats.postCount}</p>
                    <p className="text-xs text-muted-foreground">已发布 {stats.publishedCount} 篇</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">分类目录</p>
                    <p className="text-3xl font-bold">{stats.categoryCount}</p>
                    <p className="text-xs text-muted-foreground">组织您的知识</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">用户总数</p>
                    <p className="text-3xl font-bold">{stats.userCount}</p>
                    <p className="text-xs text-muted-foreground">活跃社区</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              最近文章
            </h2>
            <Link href="/posts">
              <Button variant="ghost" size="sm" className="gap-2">
                查看全部
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          {recentPosts.length === 0 ? (
            <Card className="border-0">
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">还没有文章</p>
                <Link href="/posts/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    创建第一篇
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recentPosts.slice(0, 4).map((post) => (
                <Link key={post.id} href={`/posts/${post.slug}`}>
                  <Card className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-primary to-primary/60" />
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant={post.status === "PUBLISHED" ? "default" : "secondary"}>
                              {post.status === "PUBLISHED" ? "已发布" : "草稿"}
                            </Badge>
                            {post.category && (
                              <Badge 
                                variant="outline"
                                style={{ 
                                  backgroundColor: post.category.color ? `${post.category.color}15` : "transparent",
                                  borderColor: post.category.color || undefined,
                                  color: post.category.color || undefined
                                }}
                              >
                                {post.category.name}
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">
                            {post.title}
                          </h3>
                          {post.excerpt && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {post.excerpt}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(post.createdAt).toLocaleDateString("zh-CN")}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="py-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            快捷操作
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href}>
                <Card className="group cursor-pointer transition-all hover:shadow-xl hover:-translate-y-2 border-0 overflow-hidden h-full">
                  <div className={`h-1.5 bg-gradient-to-r ${action.gradient}`} />
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium group-hover:text-primary transition-colors block truncate">
                        {action.label}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t mt-12">
        <div className="container mx-auto py-8 text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold">WikiFlow</span>
          </div>
          <p className="text-sm text-muted-foreground">
            笔记本风格的 Wiki 系统 · © 2026
          </p>
        </div>
      </footer>
    </div>
  );
}

async function getStats() {
  try {
    const [postCount, publishedCount, categoryCount, userCount] = await Promise.all([
      prisma.post.count(),
      prisma.post.count({ where: { status: "PUBLISHED" } }),
      prisma.category.count(),
      prisma.user.count(),
    ]);

    return { postCount, publishedCount, categoryCount, userCount };
  } catch {
    return { postCount: 0, publishedCount: 0, categoryCount: 0, userCount: 0 };
  }
}

async function getRecentPosts() {
  try {
    return await prisma.post.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        status: true,
        createdAt: true,
        category: { select: { name: true, color: true } },
      },
    });
  } catch {
    return [];
  }
}
