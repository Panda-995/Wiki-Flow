"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Settings, Mail, Shield, Globe, RotateCcw, Server } from "lucide-react";
import { DEFAULT_SETTINGS, type SettingsData } from "@/lib/settings-constants";

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const [settings, setSettings] = useState<SettingsData>({ ...DEFAULT_SETTINGS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      redirect("/");
    }
  }, [status, session]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      fetchSettings();
    }
  }, [status, session]);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data.settings) {
        setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "设置已保存成功" });
      } else {
        setMessage({ type: "error", text: data.error || "保存失败" });
      }
    } catch {
      setMessage({ type: "error", text: "保存失败，请稍后重试" });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setMessage({ type: "success", text: "已恢复默认设置（尚未保存）" });
    setTimeout(() => setMessage(null), 3000);
  };

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
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

  if (status === "unauthenticated") {
    redirect("/login");
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Settings className="h-8 w-8 text-primary" />
                系统设置
              </h1>
              <p className="text-muted-foreground mt-1">管理系统全局配置</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleReset} disabled={saving}>
                <RotateCcw className="mr-2 h-4 w-4" />
                恢复默认
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                保存设置
              </Button>
            </div>
          </div>

          {message && (
            <div
              className={`mb-6 p-4 rounded-lg text-sm ${
                message.type === "success"
                  ? "bg-green-500/10 text-green-600 border border-green-500/20"
                  : "bg-destructive/10 text-destructive border border-destructive/20"
              }`}
            >
              {message.text}
            </div>
          )}

          <Tabs defaultValue="email" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-muted/50 rounded-xl">
              <TabsTrigger value="email" className="flex items-center gap-2 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Mail className="h-4 w-4" />
                邮箱验证
              </TabsTrigger>
              <TabsTrigger value="smtp" className="flex items-center gap-2 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Server className="h-4 w-4" />
                SMTP配置
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Shield className="h-4 w-4" />
                安全设置
              </TabsTrigger>
              <TabsTrigger value="general" className="flex items-center gap-2 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Globe className="h-4 w-4" />
                常规设置
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    验证码配置
                  </CardTitle>
                  <CardDescription>
                    配置邮箱验证码的有效期和发送频率限制
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="validity">验证码有效期（分钟）</Label>
                      <Input
                        id="validity"
                        type="number"
                        min="1"
                        max="60"
                        value={settings.verification_code_validity_minutes}
                        onChange={(e) => updateSetting("verification_code_validity_minutes", e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">验证码过期后将无法使用</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cooldown">发送冷却时间（秒）</Label>
                      <Input
                        id="cooldown"
                        type="number"
                        min="30"
                        max="300"
                        value={settings.verification_cooldown_seconds}
                        onChange={(e) => updateSetting("verification_cooldown_seconds", e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">两次发送验证码的最小间隔</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    邮件模板
                  </CardTitle>
                  <CardDescription>
                    自定义验证邮件的主题和内容模板
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">邮件主题</Label>
                    <Input
                      id="subject"
                      value={settings.verification_email_subject}
                      onChange={(e) => updateSetting("verification_email_subject", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="template">邮件内容模板</Label>
                    <Textarea
                      id="template"
                      rows={4}
                      value={settings.verification_email_template}
                      onChange={(e) => updateSetting("verification_email_template", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      可用变量：{"{{code}}"} - 验证码，{"{{expires}}"} - 有效期（分钟）
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="smtp" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5 text-primary" />
                    SMTP 邮件服务器
                  </CardTitle>
                  <CardDescription>
                    配置用于发送验证邮件的 SMTP 服务器参数
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtpHost">SMTP 主机地址</Label>
                      <Input
                        id="smtpHost"
                        value={settings.smtp_host}
                        onChange={(e) => updateSetting("smtp_host", e.target.value)}
                        placeholder="smtp.example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpPort">SMTP 端口</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        value={settings.smtp_port}
                        onChange={(e) => updateSetting("smtp_port", e.target.value)}
                        placeholder="587"
                      />
                      <p className="text-xs text-muted-foreground">常用端口：587 (STARTTLS), 465 (SSL), 25</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtpUser">SMTP 用户名</Label>
                      <Input
                        id="smtpUser"
                        value={settings.smtp_user}
                        onChange={(e) => updateSetting("smtp_user", e.target.value)}
                        placeholder="user@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpPass">SMTP 密码</Label>
                      <Input
                        id="smtpPass"
                        type="password"
                        value={settings.smtp_pass}
                        onChange={(e) => updateSetting("smtp_pass", e.target.value)}
                        placeholder="输入SMTP密码"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtpFrom">发件人地址</Label>
                      <Input
                        id="smtpFrom"
                        value={settings.smtp_from}
                        onChange={(e) => updateSetting("smtp_from", e.target.value)}
                        placeholder="noreply@example.com"
                      />
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <div className="space-y-0.5">
                        <Label>使用 SSL/TLS</Label>
                        <p className="text-xs text-muted-foreground">启用安全连接</p>
                      </div>
                      <Switch
                        checked={settings.smtp_secure === "true"}
                        onCheckedChange={(checked) =>
                          updateSetting("smtp_secure", checked ? "true" : "false")
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    测试邮件发送
                  </CardTitle>
                  <CardDescription>
                    保存配置后，可以发送测试邮件验证配置是否正确
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    配置保存成功后，系统将使用以上 SMTP 参数发送验证邮件。请确保 SMTP 服务器允许外部连接。
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    登录安全
                  </CardTitle>
                  <CardDescription>
                    配置登录安全策略和会话管理
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxAttempts">最大登录尝试次数</Label>
                      <Input
                        id="maxAttempts"
                        type="number"
                        min="3"
                        max="20"
                        value={settings.max_login_attempts}
                        onChange={(e) => updateSetting("max_login_attempts", e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">超过此次数后账号将被锁定</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lockout">锁定时间（分钟）</Label>
                      <Input
                        id="lockout"
                        type="number"
                        min="5"
                        max="1440"
                        value={settings.lockout_duration_minutes}
                        onChange={(e) => updateSetting("lockout_duration_minutes", e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">账号被锁定的持续时间</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">会话超时（分钟）</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      min="15"
                      max="10080"
                      value={settings.session_timeout_minutes}
                      onChange={(e) => updateSetting("session_timeout_minutes", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">用户无操作后自动退出登录的时间</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    站点信息
                  </CardTitle>
                  <CardDescription>
                    配置站点基本信息和显示设置
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="siteName">站点名称</Label>
                    <Input
                      id="siteName"
                      value={settings.site_name}
                      onChange={(e) => updateSetting("site_name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="siteDesc">站点描述</Label>
                    <Input
                      id="siteDesc"
                      value={settings.site_description}
                      onChange={(e) => updateSetting("site_description", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postsPerPage">每页文章数</Label>
                    <Input
                      id="postsPerPage"
                      type="number"
                      min="3"
                      max="50"
                      value={settings.posts_per_page}
                      onChange={(e) => updateSetting("posts_per_page", e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5">
                      <Label>开放注册</Label>
                      <p className="text-xs text-muted-foreground">允许新用户自行注册账号</p>
                    </div>
                    <Switch
                      checked={settings.enable_registration === "true"}
                      onCheckedChange={(checked) =>
                        updateSetting("enable_registration", checked ? "true" : "false")
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
