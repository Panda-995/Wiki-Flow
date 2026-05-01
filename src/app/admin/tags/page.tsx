"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
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
import { Plus, Edit, Trash2, Tags, RefreshCw, XCircle, Loader2 } from "lucide-react";

interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  _count: { posts: number };
}

function TagForm({ 
  tag, 
  onSuccess 
}: { 
  tag?: Tag;
  onSuccess: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState(tag?.name || "");
  const [color, setColor] = useState(tag?.color || "#6366f1");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const url = tag ? "/api/tags" : "/api/tags";
      const method = tag ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tag ? { id: tag.id, name, color } : { name, color }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "操作失败");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const colorOptions = [
    "#6366f1", "#ec4899", "#14b8a6", "#f59e0b", "#64748b",
    "#e07b39", "#4a7c9b", "#6b8e5a", "#c45c4a", "#8b7355"
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          <XCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">标签名称</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="输入标签名称"
          required
          className="h-11"
        />
      </div>

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
        <div className="flex gap-2 flex-wrap">
          {colorOptions.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c ? "scale-125 border-foreground" : "border-transparent"}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "保存中..." : tag ? "更新标签" : "创建标签"}
        </Button>
      </div>
    </form>
  );
}

function DeleteConfirm({ 
  tag, 
  onConfirm 
}: { 
  tag: Tag;
  onConfirm: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/tags?id=${tag.id}`, { method: "DELETE" });
      if (res.ok) {
        onConfirm();
      }
    } catch {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
        <Trash2 className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-medium text-destructive">确认删除标签</h4>
          <p className="text-sm text-muted-foreground mt-1">
            即将删除「{tag.name}」，该标签被 {tag._count.posts} 篇文章使用。
            删除后无法恢复。
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

export default function AdminTagsPage() {
  const { data: session, status } = useSession();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      redirect("/");
    }
  }, [status, session]);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tags");
      if (res.ok) {
        const data = await res.json();
        setTags(data);
      }
    } catch {
      console.error("Failed to fetch tags");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      fetchTags();
    }
  }, [status, session]);

  const handleSuccess = () => {
    setIsDialogOpen(false);
    setEditingTag(null);
    fetchTags();
  };

  const handleDeleteSuccess = () => {
    setDeletingTag(null);
    fetchTags();
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
            <h1 className="text-3xl font-bold">标签管理</h1>
            <p className="text-muted-foreground mt-1">管理文章标签体系</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={fetchTags}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={() => { setEditingTag(null); setIsDialogOpen(true); }} className="gap-2 shadow-lg">
              <Plus className="h-4 w-4" />
              新建标签
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tags className="h-5 w-5" />
              标签列表 ({tags.length})
            </CardTitle>
            <CardDescription>
              标签用于对文章进行分类标记
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse space-y-4 py-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted rounded-xl"></div>
                ))}
              </div>
            ) : tags.length === 0 ? (
              <div className="text-center py-12">
                <Tags className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">还没有标签</p>
                <Button onClick={() => { setEditingTag(null); setIsDialogOpen(true); }}>
                  创建第一个标签
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-4 rounded-xl border bg-card hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
                        style={{ backgroundColor: tag.color || "#6366f1" }}
                      >
                        <Tags className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium">{tag.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground font-mono">{tag.slug}</span>
                          <Badge variant="outline" className="text-xs">
                            {tag._count.posts} 篇
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setEditingTag(tag); setIsDialogOpen(true); }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setDeletingTag(tag); }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingTag(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTag ? "编辑标签" : "新建标签"}
              </DialogTitle>
              <DialogDescription>
                {editingTag
                  ? "修改标签信息"
                  : "创建一个新的文章标签"}
              </DialogDescription>
            </DialogHeader>
            <TagForm
              tag={editingTag || undefined}
              onSuccess={handleSuccess}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={!!deletingTag} onOpenChange={(open) => { if (!open) setDeletingTag(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>删除确认</DialogTitle>
            </DialogHeader>
            {deletingTag && (
              <DeleteConfirm
                tag={deletingTag}
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