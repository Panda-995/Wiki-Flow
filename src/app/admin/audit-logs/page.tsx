"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollText, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface AuditLogData {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  detail: string | null;
  ip: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string } | null;
}

const ACTION_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  CREATE: { label: "创建", variant: "default" },
  UPDATE: { label: "更新", variant: "secondary" },
  DELETE: { label: "删除", variant: "destructive" },
  LOGIN: { label: "登录", variant: "outline" },
  LOGOUT: { label: "登出", variant: "outline" },
  EXPORT: { label: "导出", variant: "secondary" },
  IMPORT: { label: "导入", variant: "secondary" },
};

export default function AdminAuditLogsPage() {
  const { data: session, status } = useSession();
  const [logs, setLogs] = useState<AuditLogData[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      redirect("/");
    }
  }, [status, session]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/audit-logs?page=${page}&limit=50`);
      if (!res.ok) {
        setLogs([]);
        setTotal(0);
        setTotalPages(1);
        return;
      }
      const data = await res.json();
      setLogs(data.logs || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {
      setLogs([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      fetchLogs();
    }
  }, [status, session, fetchLogs]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("zh-CN");
  };

  const getActionBadge = (action: string) => {
    const config = ACTION_LABELS[action] || { label: action, variant: "outline" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen bg-background">
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
          <div className="mb-6">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ScrollText className="h-8 w-8 text-primary" />
              审计日志
            </h1>
            <p className="text-muted-foreground mt-1">查看系统操作记录，共 {total} 条</p>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                操作记录
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  暂无审计日志
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[160px]">时间</TableHead>
                          <TableHead className="w-[80px]">操作</TableHead>
                          <TableHead className="w-[100px]">对象</TableHead>
                          <TableHead>详情</TableHead>
                          <TableHead className="w-[120px]">用户</TableHead>
                          <TableHead className="w-[120px]">IP</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDate(log.createdAt)}
                            </TableCell>
                            <TableCell>{getActionBadge(log.action)}</TableCell>
                            <TableCell className="text-sm">
                              {log.entity}
                              {log.entityId && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  #{log.entityId.slice(-6)}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm max-w-[300px] truncate">
                              {log.detail || "-"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {log.user ? (log.user.name || log.user.email) : "系统"}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground font-mono">
                              {log.ip || "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        上一页
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {page} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        下一页
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
    </div>
  );
}
