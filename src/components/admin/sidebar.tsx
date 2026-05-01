"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  FolderTree,
  Tags,
  KeyRound,
  Settings,
  Home,
  Sparkles,
  Users,
  ScrollText,
  Upload,
} from "lucide-react";

const adminNav = [
  {
    title: "仪表盘",
    href: "/admin",
    icon: LayoutDashboard,
    color: "bg-blue-500",
  },
  {
    title: "文章管理",
    href: "/admin/posts",
    icon: FileText,
    color: "bg-emerald-500",
  },
  {
    title: "分类管理",
    href: "/admin/categories",
    icon: FolderTree,
    color: "bg-green-500",
  },
  {
    title: "标签管理",
    href: "/admin/tags",
    icon: Tags,
    color: "bg-pink-500",
  },
  {
    title: "访问码",
    href: "/admin/access-codes",
    icon: KeyRound,
    color: "bg-orange-500",
  },
  {
    title: "用户管理",
    href: "/admin/users",
    icon: Users,
    color: "bg-purple-500",
  },
  {
    title: "审计日志",
    href: "/admin/audit-logs",
    icon: ScrollText,
    color: "bg-gray-500",
  },
  {
    title: "文件导入",
    href: "/admin/import",
    icon: Upload,
    color: "bg-cyan-500",
  },
  {
    title: "系统设置",
    href: "/admin/settings",
    icon: Settings,
    color: "bg-slate-500",
  },
];

function NavItem({ item }: { item: (typeof adminNav)[0] }) {
  const pathname = usePathname();
  const isActive = pathname === item.href;

  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-gradient-to-r from-primary/10 to-primary/5 text-primary"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      )}
    >
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
      )}
      <div
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center shadow-md transition-transform duration-200 group-hover:scale-105",
          isActive ? item.color : "bg-muted"
        )}
      >
        <item.icon
          className={cn(
            "h-4 w-4",
            isActive ? "text-white" : "text-muted-foreground"
          )}
        />
      </div>
      <span>{item.title}</span>
    </Link>
  );
}

export function AdminSidebar() {
  return (
    <>
      <aside className="flex flex-col h-screen sticky top-0 bg-background border-r w-56 xl:w-64 2xl:w-72">
        {/* Header */}
        <div className="h-16 flex items-center px-4 border-b">
          <Link
            href="/"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg flex-shrink-0">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-foreground">WikiFlow</span>
              <span className="text-xs text-muted-foreground -mt-0.5">
                管理后台
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className="mb-4">
            <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              导航菜单
            </p>
            <div className="space-y-1">
              {adminNav.map((item) => (
                <NavItem key={item.href} item={item} />
              ))}
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          >
            <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
              <Home className="h-4 w-4" />
            </div>
            <span className="font-medium">返回前台</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
