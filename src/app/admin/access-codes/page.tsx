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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Key, Copy, Trash2, Plus, RefreshCw, XCircle, CheckCircle2, Lock, Loader2 } from "lucide-react";
import { copyToClipboard } from "@/lib/clipboard";

interface AccessCode {
  id: string;
  code: string;
  name: string;
  description: string | null;
  level: string;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  createdBy: { name: string | null; email: string };
}

function CreateCodeForm({ onSuccess }: { onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState("PROTECTED");
  const [usageLimit, setUsageLimit] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/access-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          level,
          usageLimit: usageLimit ? parseInt(usageLimit) : null,
          expiresAt: expiresAt || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "创建失败");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败");
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
        <Label htmlFor="name">访问码名称</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如：VIP会员访问码"
          required
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">描述</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="简短描述（可选）"
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label>访问级别</Label>
        <Select value={level} onValueChange={(v) => setLevel(v || "PROTECTED")}>
          <SelectTrigger className="h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PROTECTED">受保护</SelectItem>
            <SelectItem value="PRIVATE">私有</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="usageLimit">使用次数限制</Label>
          <Input
            id="usageLimit"
            type="number"
            value={usageLimit}
            onChange={(e) => setUsageLimit(e.target.value)}
            placeholder="不限制"
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expiresAt">过期时间</Label>
          <Input
            id="expiresAt"
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="h-11"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "创建中..." : "创建访问码"}
        </Button>
      </div>
    </form>
  );
}

function DeleteConfirm({ code, onConfirm }: { code: AccessCode; onConfirm: () => void }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/access-codes?id=${code.id}`, { method: "DELETE" });
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
          <h4 className="font-medium text-destructive">确认删除访问码</h4>
          <p className="text-sm text-muted-foreground mt-1">
            即将删除「{code.name}」，删除后使用此访问码的用户将无法访问。
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

export default function AdminAccessCodesPage() {
  const { data: session, status } = useSession();
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletingCode, setDeletingCode] = useState<AccessCode | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      redirect("/");
    }
  }, [status, session]);

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/access-codes");
      if (res.ok) {
        const data = await res.json();
        setCodes(data);
      }
    } catch {
      console.error("Failed to fetch access codes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      fetchCodes();
    }
  }, [status, session]);

  const copyCode = (code: string) => {
    copyToClipboard(code);
  };

  const toggleCode = async (code: AccessCode) => {
    try {
      const res = await fetch("/api/access-codes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: code.id, isActive: !code.isActive }),
      });
      if (res.ok) {
        fetchCodes();
      }
    } catch {
      console.error("Failed to toggle code");
    }
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
            <h1 className="text-3xl font-bold">访问码管理</h1>
            <p className="text-muted-foreground mt-1">管理内容访问权限</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={fetchCodes}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2 shadow-lg">
              <Plus className="h-4 w-4" />
              生成访问码
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              访问码列表 ({codes.length})
            </CardTitle>
            <CardDescription>
              访问码用于控制内容的访问权限
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse space-y-4 py-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted rounded-xl"></div>
                ))}
              </div>
            ) : codes.length === 0 ? (
              <div className="text-center py-12">
                <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">还没有访问码</p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  生成第一个访问码
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {codes.map((code) => (
                  <div
                    key={code.id}
                    className="flex items-center justify-between p-4 rounded-xl border bg-card hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${
                        code.isActive ? "bg-gradient-to-br from-primary to-primary/60" : "bg-muted"
                      }`}>
                        {code.isActive ? (
                          <Lock className="h-6 w-6 text-white" />
                        ) : (
                          <Lock className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold">{code.name}</h4>
                          <Badge variant={code.isActive ? "default" : "secondary"}>
                            {code.isActive ? "激活" : "禁用"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="font-mono bg-muted px-2 py-0.5 rounded text-sm">
                            {code.code.length > 12 ? `${code.code.slice(0, 12)}...` : code.code}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {code.level === "PROTECTED" ? "受保护" : "私有"}
                          </Badge>
                          {code.usageLimit ? (
                            <Badge variant="outline" className="text-xs">
                              {code.usedCount} / {code.usageLimit} 次
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              {code.usedCount} / ∞ 次
                            </Badge>
                          )}
                          {code.expiresAt && (
                            <span className="text-xs text-muted-foreground">
                              过期: {new Date(code.expiresAt).toLocaleDateString("zh-CN")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" onClick={() => copyCode(code.code)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleCode(code)}>
                        {code.isActive ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeletingCode(code)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>生成访问码</DialogTitle>
              <DialogDescription>
                创建一个新的访问码来保护您的内容
              </DialogDescription>
            </DialogHeader>
            <CreateCodeForm onSuccess={() => { setIsDialogOpen(false); fetchCodes(); }} />
          </DialogContent>
        </Dialog>

        <Dialog open={!!deletingCode} onOpenChange={(open) => { if (!open) setDeletingCode(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>删除确认</DialogTitle>
            </DialogHeader>
            {deletingCode && (
              <DeleteConfirm
                code={deletingCode}
                onConfirm={() => { setDeletingCode(null); fetchCodes(); }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
        </div>
    </div>
  );
}