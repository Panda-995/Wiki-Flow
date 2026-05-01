import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  FileText, Users, FolderTree, Tags, Key, Settings,
  Eye, Clock, ArrowRight, TrendingUp, Sparkles, Download
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const stats = await getStats();
  const recentPosts = await getRecentPosts();

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-6xl space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            数据概览
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">文章总数</p>
                    <p className="text-3xl font-bold">{stats.postCount}</p>
                    <p className="text-xs text-muted-foreground">已发布 {stats.publishedCount} 篇</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
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
                    <p className="text-xs text-muted-foreground">活跃用户 {stats.activeUserCount}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
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
                    <p className="text-xs text-muted-foreground">组织知识结构</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <FolderTree className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">标签总数</p>
                    <p className="text-3xl font-bold">{stats.tagCount}</p>
                    <p className="text-xs text-muted-foreground">文章标签</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                    <Tags className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              快捷操作
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/admin/posts">
              <Card className="group cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-transform" />
                  </div>
                  <h3 className="mt-4 font-semibold text-lg">文章管理</h3>
                  <p className="text-sm text-muted-foreground mt-1">创建、编辑、删除文章</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    <span>{stats.postCount} 篇文章</span>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/users">
              <Card className="group cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-transform" />
                  </div>
                  <h3 className="mt-4 font-semibold text-lg">用户管理</h3>
                  <p className="text-sm text-muted-foreground mt-1">管理用户账户和权限</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>{stats.userCount} 位用户</span>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/categories">
              <Card className="group cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FolderTree className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-transform" />
                  </div>
                  <h3 className="mt-4 font-semibold text-lg">分类管理</h3>
                  <p className="text-sm text-muted-foreground mt-1">组织知识分类结构</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <FolderTree className="h-3 w-3" />
                    <span>{stats.categoryCount} 个分类</span>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/tags">
              <Card className="group cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Tags className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-transform" />
                  </div>
                  <h3 className="mt-4 font-semibold text-lg">标签管理</h3>
                  <p className="text-sm text-muted-foreground mt-1">文章标签系统</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Tags className="h-3 w-3" />
                    <span>{stats.tagCount} 个标签</span>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/access-codes">
              <Card className="group cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Key className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-transform" />
                  </div>
                  <h3 className="mt-4 font-semibold text-lg">访问码管理</h3>
                  <p className="text-sm text-muted-foreground mt-1">内容访问控制</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Key className="h-3 w-3" />
                    <span>权限控制</span>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/import">
              <Card className="group cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Settings className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-transform" />
                  </div>
                  <h3 className="mt-4 font-semibold text-lg">文件导入</h3>
                  <p className="text-sm text-muted-foreground mt-1">批量导入 Markdown 文件</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Settings className="h-3 w-3" />
                    <span>批量导入</span>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <a href="/api/admin/export?type=posts&format=json">
              <Card className="group cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Download className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-transform" />
                  </div>
                  <h3 className="mt-4 font-semibold text-lg">导出文章 (JSON)</h3>
                  <p className="text-sm text-muted-foreground mt-1">导出所有文章为 JSON 格式</p>
                </CardContent>
              </Card>
            </a>

            <a href="/api/admin/export?type=posts&format=markdown">
              <Card className="group cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Download className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-transform" />
                  </div>
                  <h3 className="mt-4 font-semibold text-lg">导出文章 (Markdown)</h3>
                  <p className="text-sm text-muted-foreground mt-1">导出所有文章为 Markdown 格式</p>
                </CardContent>
              </Card>
            </a>
          </div>
        </section>

        {recentPosts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                最近文章
              </h2>
              <Link href="/admin/posts">
                <Button variant="ghost" size="sm" className="gap-2">
                  查看全部
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {recentPosts.map((post) => (
                <Link key={post.id} href={`/posts/${post.slug}`}>
                  <Card className="group cursor-pointer transition-all hover:shadow-lg border-0 hover:border-primary/20">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              post.status === "PUBLISHED" 
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                            }`}>
                              {post.status === "PUBLISHED" ? "已发布" : "草稿"}
                            </span>
                            {post.category && (
                              <span className="text-xs text-muted-foreground">
                                {post.category.name}
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-1">
                            {post.title}
                          </h3>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(post.createdAt).toLocaleDateString("zh-CN")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {post.viewCount} 次阅读
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
        </div>
    </div>
  );
}

async function getStats() {
  try {
    const [postCount, publishedCount, userCount, categoryCount, tagCount, activeUserCount] = await Promise.all([
      prisma.post.count(),
      prisma.post.count({ where: { status: "PUBLISHED" } }),
      prisma.user.count(),
      prisma.category.count(),
      prisma.tag.count(),
      prisma.user.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
    ]);

    return { postCount, publishedCount, userCount, categoryCount, tagCount, activeUserCount };
  } catch {
    return { 
      postCount: 0, 
      publishedCount: 0, 
      userCount: 0, 
      categoryCount: 0, 
      tagCount: 0,
      activeUserCount: 0 
    };
  }
}

async function getRecentPosts() {
  try {
    return await prisma.post.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        createdAt: true,
        viewCount: true,
        category: { select: { name: true, color: true } },
      },
    });
  } catch {
    return [];
  }
}
