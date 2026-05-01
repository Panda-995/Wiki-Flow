"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { createCategory, updateCategory, deleteCategory } from "@/actions/categories";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, FolderTree, XCircle, RefreshCw, Loader2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  order: number;
  _count: { posts: number };
  parent: { name: string } | null;
}

function CategoryForm({ 
  category, 
  onSuccess 
}: { 
  category?: Category;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState(category?.name || "");
  const [description, setDescription] = useState(category?.description || "");
  const [color, setColor] = useState(category?.color || "#e07b39");
  const [order, setOrder] = useState(category?.order?.toString() || "0");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("color", color);
    formData.append("order", order);

    try {
      if (category) {
        await updateCategory(category.id, formData);
      } else {
        await createCategory(formData);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          <XCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">分类名称</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="输入分类名称"
          required
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">分类描述</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="简短描述（可选）"
          className="h-11"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>颜色</Label>
          <div className="flex gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-11 h-11 rounded-lg cursor-pointer border bg-transparent"
            />
            <Input
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-11 font-mono"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="order">排序</Label>
          <Input
            id="order"
            type="number"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            className="h-11"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "保存中..." : category ? "更新分类" : "创建分类"}
        </Button>
      </div>
    </form>
  );
}

function DeleteConfirm({ 
  category, 
  onConfirm 
}: { 
  category: Category;
  onConfirm: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteCategory(category.id);
      onConfirm();
    } catch {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
        <Trash2 className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-medium text-destructive">确认删除分类</h4>
          <p className="text-sm text-muted-foreground mt-1">
            即将删除「{category.name}」，该分类下有 {category._count.posts} 篇文章。
            删除后无法恢复，请谨慎操作。
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onConfirm}>
          取消
        </Button>
        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
          {isDeleting ? "删除中..." : "确认删除"}
        </Button>
      </div>
    </div>
  );
}

export default function AdminCategoriesPage() {
  const { data: session, status } = useSession();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      redirect("/");
    }
  }, [status, session]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch {
      console.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      fetchCategories();
    }
  }, [status, session]);

  const handleSuccess = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    fetchCategories();
  };

  const handleDeleteSuccess = () => {
    setDeletingCategory(null);
    fetchCategories();
  };

  if (status === "loading") {
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
        <div className="p-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">分类管理</h1>
            <p className="text-muted-foreground mt-1">管理知识分类体系</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={fetchCategories}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={() => { setEditingCategory(null); setIsDialogOpen(true); }} className="gap-2 shadow-lg">
              <Plus className="h-4 w-4" />
              新建分类
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderTree className="h-5 w-5" />
              分类列表 ({categories.length})
            </CardTitle>
            <CardDescription>
              点击分类卡片进行编辑或删除
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse space-y-4 py-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted rounded-xl"></div>
                ))}
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-12">
                <FolderTree className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">还没有分类</p>
                <Button onClick={() => { setEditingCategory(null); setIsDialogOpen(true); }}>
                  创建第一个分类
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-4 rounded-xl border bg-card hover:shadow-lg transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
                        style={{ backgroundColor: cat.color || "#e07b39" }}
                      >
                        <FolderTree className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-lg">{cat.name}</h4>
                          {cat.parent && (
                            <Badge variant="secondary" className="text-xs">
                              父级: {cat.parent.name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="font-mono bg-muted px-2 py-0.5 rounded">{cat.slug}</span>
                          {cat.description && (
                            <span className="max-w-[200px] truncate">{cat.description}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="text-sm">
                        {cat._count.posts} 篇文章
                      </Badge>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); setEditingCategory(cat); setIsDialogOpen(true); }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); setDeletingCategory(cat); }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingCategory(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "编辑分类" : "新建分类"}
              </DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? "修改分类信息"
                  : "创建一个新的知识分类"}
              </DialogDescription>
            </DialogHeader>
            <CategoryForm
              category={editingCategory || undefined}
              onSuccess={handleSuccess}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={!!deletingCategory} onOpenChange={(open) => { if (!open) setDeletingCategory(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>删除确认</DialogTitle>
            </DialogHeader>
            {deletingCategory && (
              <DeleteConfirm
                category={deletingCategory}
                onConfirm={handleDeleteSuccess}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
        </div>
    </div>
  );
}