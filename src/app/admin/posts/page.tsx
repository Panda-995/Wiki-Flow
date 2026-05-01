"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Search, FileText, Loader2 } from "lucide-react";

interface Post {
  id: string;
  title: string;
  slug: string;
  status: string;
  createdAt: string;
  author: { name: string | null };
  category: { name: string } | null;
  _count: { comments: number };
}

export default function AdminPostsPage() {
  const { data: session, status } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      redirect("/");
    }
  }, [status, session]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      fetchPosts();
    }
  }, [status, session]);

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/posts?admin=true");
      const data = await res.json();
      setPosts(data.posts || []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/posts/${deleteTarget.id}`, { method: "DELETE" });
      setPosts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    } catch {
      // delete failed
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    redirect("/login");
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">文章管理</h1>
            <p className="text-muted-foreground mt-1">管理所有文章</p>
          </div>
          <Link href="/posts/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新建文章
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索文章..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? "未找到匹配的文章" : "暂无文章"}
                </p>
                {!searchQuery && (
                  <Link href="/posts/new">
                    <Button>创建第一篇文章</Button>
                  </Link>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>标题</TableHead>
                    <TableHead>作者</TableHead>
                    <TableHead>分类</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>评论</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium">
                        <Link href={`/posts/${post.slug}`} className="hover:underline">
                          {post.title}
                        </Link>
                      </TableCell>
                      <TableCell>{post.author.name || "未知"}</TableCell>
                      <TableCell>{post.category?.name || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            post.status === "PUBLISHED"
                              ? "default"
                              : post.status === "DRAFT"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {post.status === "PUBLISHED"
                            ? "已发布"
                            : post.status === "DRAFT"
                            ? "草稿"
                            : "归档"}
                        </Badge>
                      </TableCell>
                      <TableCell>{post._count.comments}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(post.createdAt).toLocaleDateString("zh-CN")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/posts/${post.slug}`}>
                            <Button variant="ghost" size="sm">
                              查看
                            </Button>
                          </Link>
                          <Link href={`/posts/${post.slug}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(post)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
        </div>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除文章</DialogTitle>
            <DialogDescription>
              确定要删除文章 &ldquo;{deleteTarget?.title}&rdquo; 吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "删除中..." : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
