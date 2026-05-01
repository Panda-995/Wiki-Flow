"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users, Trash2, Shield, Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";

interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: string;
  emailVerified: string | null;
  createdAt: string;
  lockedUntil: string | null;
  _count: { posts: number; comments: number };
}

const USERS_PER_PAGE = 10;

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<UserData | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      redirect("/");
    }
  }, [status, session]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      fetchUsers();
    }
  }, [status, session, fetchUsers]);

  const filteredUsers = users.filter((user) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (user.name?.toLowerCase().includes(q)) ||
      user.email.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * USERS_PER_PAGE,
    currentPage * USERS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
      }
    } catch {
      // failed
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleDisable = async (user: UserData) => {
    setActionLoading(user.id);
    const isDisabled = !!user.lockedUntil && new Date(user.lockedUntil) > new Date("2099-01-01");
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, disabled: !isDisabled }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id
              ? {
                  ...u,
                  lockedUntil: isDisabled
                    ? null
                    : "2099-12-31T00:00:00.000Z",
                }
              : u
          )
        );
      }
    } catch {
      // failed
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(deleteTarget.id);
    try {
      const res = await fetch(`/api/admin/users?userId=${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      }
    } catch {
      // failed
    } finally {
      setActionLoading(null);
      setDeleteTarget(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Badge variant="destructive">管理员</Badge>;
      case "EDITOR":
        return <Badge variant="default">编辑</Badge>;
      default:
        return <Badge variant="secondary">用户</Badge>;
    }
  };

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

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">用户管理</h1>
          <p className="text-muted-foreground mt-1">管理注册用户</p>
        </div>

        <div className="mb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索用户名或邮箱..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              用户列表 ({filteredUsers.length}{searchQuery ? ` / 共 ${users.length}` : ""})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paginatedUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? "没有找到匹配的用户" : "暂无用户"}
                </p>
              </div>
            ) : (
              <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>文章数</TableHead>
                    <TableHead>评论数</TableHead>
                    <TableHead>注册时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map((user) => {
                    const isDisabled =
                      !!user.lockedUntil &&
                      new Date(user.lockedUntil) > new Date("2099-01-01");
                    const isSelf = user.id === session?.user?.id;

                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {user.name?.[0]?.toUpperCase() ||
                                  user.email[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {user.name || "未设置名称"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isSelf ? (
                            getRoleBadge(user.role)
                          ) : (
                            <Select
                              value={user.role || "USER"}
                              onValueChange={(v) =>
                                handleRoleChange(user.id, v || "USER")
                              }
                              disabled={actionLoading === user.id}
                            >
                              <SelectTrigger className="w-28 h-8">
                                <span className="text-sm">
                                  {user.role === "ADMIN" ? "管理员" : user.role === "EDITOR" ? "编辑" : "用户"}
                                </span>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ADMIN">管理员</SelectItem>
                                <SelectItem value="EDITOR">编辑</SelectItem>
                                <SelectItem value="USER">用户</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        <TableCell>
                          {isDisabled ? (
                            <Badge variant="destructive">已禁用</Badge>
                          ) : user.emailVerified ? (
                            <Badge variant="default">正常</Badge>
                          ) : (
                            <Badge variant="outline">未验证</Badge>
                          )}
                        </TableCell>
                        <TableCell>{user._count.posts}</TableCell>
                        <TableCell>{user._count.comments}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(user.createdAt).toLocaleDateString(
                            "zh-CN"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {!isSelf && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleDisable(user)}
                                  disabled={actionLoading === user.id}
                                >
                                  {actionLoading === user.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : isDisabled ? (
                                    <Shield className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <Shield className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteTarget(user)}
                                  disabled={actionLoading === user.id}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
        </div>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除用户</DialogTitle>
            <DialogDescription>
              确定要删除用户 &ldquo;{deleteTarget?.name || deleteTarget?.email}
              &rdquo; 吗？此操作不可撤销，该用户的所有数据（文章、评论等）将被永久删除。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
