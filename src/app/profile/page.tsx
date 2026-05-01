"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import {
  FileText, MessageSquare, Settings, User,
  Mail, Shield, Calendar, Clock, Edit3, Save, X,
  Key, Camera, Bell, Sun, Moon, Monitor
} from "lucide-react";

interface UserStats {
  posts: number;
  comments: number;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [stats, setStats] = useState<UserStats>({ posts: 0, comments: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setEditName(session.user.name || "");
      fetchStats();
    }
  }, [session]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/user/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // stats unavailable
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName }),
      });
      if (res.ok) {
        await fetch("/api/auth/session?update");
        setIsEditing(false);
      }
    } catch {
      // save failed
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditName(session?.user?.name || "");
    setIsEditing(false);
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword.length < 8) {
      setPasswordError("新密码至少8个字符");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("两次输入的密码不一致");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch("/api/user/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordSuccess("密码修改成功");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setShowPasswordForm(false), 1500);
      } else {
        setPasswordError(data.error || "修改失败");
      }
    } catch {
      setPasswordError("网络错误，请重试");
    } finally {
      setChangingPassword(false);
    }
  };

  const tabs = [
    { id: "profile", label: "个人资料", icon: User },
    { id: "security", label: "账户安全", icon: Shield },
    { id: "preferences", label: "偏好设置", icon: Settings },
  ];

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background">
        <Header title="个人中心" />
        <div className="container mx-auto px-4 md:px-6 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-48 bg-muted rounded-xl"></div>
            <div className="h-96 bg-muted rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="border-0 shadow-lg p-8 text-center">
          <p className="text-muted-foreground mb-4">请先登录</p>
          <Link href="/login">
            <Button>前往登录</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const user = session.user;
  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || user.email?.[0]?.toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-background">
      <Header
        user={session.user ? { name: session.user.name, email: session.user.email, image: session.user.image, role: (session.user as { role?: string }).role } : undefined}
        title="个人中心"
        backHref="/"
        backLabel="返回首页"
      />

      <main className="container mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg sticky top-24">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="relative inline-block mb-4">
                    <Avatar className="h-24 w-24 text-3xl">
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <button className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-colors">
                        <Camera className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="mb-2">
                    {isEditing ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="text-center font-semibold"
                        placeholder="输入昵称"
                      />
                    ) : (
                      <h2 className="text-2xl font-bold">{user.name || "未设置昵称"}</h2>
                    )}
                  </div>

                  <p className="text-muted-foreground mb-3">{user.email}</p>

                  <Badge
                    variant={(user as { role?: string }).role === "ADMIN" ? "default" : "secondary"}
                    className="gap-1"
                  >
                    <Shield className="h-3 w-3" />
                    {(user as { role?: string }).role === "ADMIN" ? "管理员" : (user as { role?: string }).role === "EDITOR" ? "编辑" : "用户"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">
                      {statsLoading ? "-" : stats.posts}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">篇文章</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-pink-600">
                      {statsLoading ? "-" : stats.comments}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">条评论</p>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  {isEditing ? (
                    <>
                      <Button
                        className="w-full gap-2"
                        onClick={handleSave}
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            保存中...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            保存修改
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={handleCancel}
                      >
                        <X className="h-4 w-4" />
                        取消
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit3 className="h-4 w-4" />
                      编辑资料
                    </Button>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t text-center">
                  <p className="text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    加入于 {new Date().toLocaleDateString("zh-CN")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-lg">
              <div className="flex border-b">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-4 px-6 flex items-center justify-center gap-2 transition-colors ${
                      activeTab === tab.id
                        ? "border-b-2 border-primary text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              <CardContent className="p-6">
                {activeTab === "profile" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">基本信息</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">昵称</Label>
                            <Input
                              id="name"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              disabled={!isEditing}
                              placeholder="设置您的昵称"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">邮箱</Label>
                            <Input
                              id="email"
                              value={user.email || ""}
                              disabled
                              type="email"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>角色</Label>
                          <div className="flex items-center gap-2">
                            <Badge variant={(user as { role?: string }).role === "ADMIN" ? "default" : "secondary"}>
                              <Shield className="h-3 w-3 mr-1" />
                              {(user as { role?: string }).role === "ADMIN" ? "管理员" : (user as { role?: string }).role === "EDITOR" ? "编辑" : "普通用户"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {(user as { role?: string }).role === "ADMIN"
                                ? "拥有所有管理权限"
                                : (user as { role?: string }).role === "EDITOR"
                                ? "可以创建和编辑文章"
                                : "可以阅读和评论文章"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t">
                      <h3 className="text-lg font-semibold mb-4">活动统计</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <span className="font-medium">文章</span>
                          </div>
                          <p className="text-2xl font-bold text-blue-600">
                            {statsLoading ? "-" : stats.posts}
                          </p>
                        </div>
                        <div className="p-4 bg-pink-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="h-5 w-5 text-pink-600" />
                            <span className="font-medium">评论</span>
                          </div>
                          <p className="text-2xl font-bold text-pink-600">
                            {statsLoading ? "-" : stats.comments}
                          </p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-5 w-5 text-green-600" />
                            <span className="font-medium">加入天数</span>
                          </div>
                          <p className="text-2xl font-bold text-green-600">-</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "security" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">账户安全</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Mail className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">邮箱地址</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-green-600 border-green-600">已验证</Badge>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                              <Key className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                              <p className="font-medium">密码</p>
                              <p className="text-sm text-muted-foreground">定期更换密码保护账户安全</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowPasswordForm(!showPasswordForm);
                              setPasswordError("");
                              setPasswordSuccess("");
                            }}
                          >
                            {showPasswordForm ? "取消" : "修改密码"}
                          </Button>
                        </div>

                        {showPasswordForm && (
                          <div className="p-4 border rounded-lg space-y-4 bg-muted/20">
                            <div className="space-y-2">
                              <Label htmlFor="currentPassword">当前密码</Label>
                              <Input
                                id="currentPassword"
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="输入当前密码"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="newPassword">新密码</Label>
                              <Input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="至少8个字符"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="confirmPassword">确认新密码</Label>
                              <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="再次输入新密码"
                              />
                            </div>
                            {passwordError && (
                              <p className="text-sm text-destructive">{passwordError}</p>
                            )}
                            {passwordSuccess && (
                              <p className="text-sm text-green-600">{passwordSuccess}</p>
                            )}
                            <Button
                              onClick={handleChangePassword}
                              disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                              className="w-full"
                            >
                              {changingPassword ? "修改中..." : "确认修改密码"}
                            </Button>
                          </div>
                        )}

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <Shield className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-medium">双重验证</p>
                              <p className="text-sm text-muted-foreground">为账户添加额外保护</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">启用</Button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t">
                      <h3 className="text-lg font-semibold mb-4 text-destructive">危险区域</h3>
                      <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-destructive">注销账户</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              永久删除您的账户和所有相关数据。此操作不可撤销。
                            </p>
                          </div>
                          <Button variant="destructive" size="sm">注销</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "preferences" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">偏好设置</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                              <Sun className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div>
                              <p className="font-medium">主题模式</p>
                              <p className="text-sm text-muted-foreground">选择您喜欢的界面主题</p>
                            </div>
                          </div>
                          {mounted && (
                            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                              <button
                                onClick={() => setTheme("light")}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                                  theme === "light"
                                    ? "bg-background shadow-sm text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                <Sun className="h-4 w-4 inline mr-1" />
                                亮色
                              </button>
                              <button
                                onClick={() => setTheme("dark")}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                                  theme === "dark"
                                    ? "bg-background shadow-sm text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                <Moon className="h-4 w-4 inline mr-1" />
                                暗色
                              </button>
                              <button
                                onClick={() => setTheme("system")}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                                  theme === "system"
                                    ? "bg-background shadow-sm text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                <Monitor className="h-4 w-4 inline mr-1" />
                                系统
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                              <Bell className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">通知设置</p>
                              <p className="text-sm text-muted-foreground">管理您的通知偏好</p>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">即将推出</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
