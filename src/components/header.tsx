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
  Sparkles,
  Menu,
  ChevronDown,
  User,
  Settings,
  LogOut,
  ArrowLeft,
  Search,
  Sun,
  Moon,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect, useCallback, useRef } from "react";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import type { LucideIcon } from "lucide-react";

interface HeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
  showAdminNav?: boolean;
  title?: string;
  backHref?: string;
  backLabel?: string;
}

type NavItem = {
  title: string;
  href: string;
  icon?: LucideIcon;
};

interface SearchResult {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: { name: string } | null;
  tags: { name: string }[];
  createdAt: string;
}

const adminNav: NavItem[] = [
  { title: "仪表盘", href: "/admin", icon: LayoutDashboard },
  { title: "文章管理", href: "/admin/posts", icon: FileText },
  { title: "分类管理", href: "/admin/categories", icon: FolderTree },
  { title: "标签管理", href: "/admin/tags", icon: Tags },
  { title: "访问码", href: "/admin/access-codes", icon: KeyRound },
  { title: "系统设置", href: "/admin/settings", icon: Settings },
];

const mainNav: NavItem[] = [
  { title: "首页", href: "/" },
  { title: "文章", href: "/posts" },
  { title: "知识图谱", href: "/graph" },
  { title: "留言板", href: "/guestbook" },
];

export function Header({ user, showAdminNav = false, title, backHref, backLabel }: HeaderProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navItems = showAdminNav ? adminNav : mainNav;

  const performSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      setSearchResults(data.posts || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, performSearch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false);
        setSearchQuery("");
        setSearchResults([]);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-foreground">WikiFlow</span>
              {showAdminNav && (
                <span className="text-xs text-muted-foreground -mt-0.5">管理后台</span>
              )}
            </div>
          </Link>

          {backHref && (
            <Link href={backHref}>
              <Button variant="ghost" size="sm" className="gap-1.5">
                <ArrowLeft className="h-4 w-4" />
                {backLabel || "返回"}
              </Button>
            </Link>
          )}

          {title && (
            <>
              <div className="hidden md:block h-6 w-px bg-border"></div>
              <h1 className="text-lg font-semibold hidden md:block">{title}</h1>
            </>
          )}

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Search Button */}
          {!showAdminNav && (
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted/50 hover:bg-muted rounded-lg border transition-colors"
            >
              <Search className="h-4 w-4" />
              <span className="hidden md:inline">搜索文章...</span>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-background rounded border font-mono">
                Ctrl+K
              </kbd>
            </button>
          )}

          {/* Theme Toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
              title={theme === "dark" ? "切换亮色模式" : "切换暗色模式"}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          )}

          {/* Desktop User Menu */}
          <div className="hidden lg:flex items-center gap-3">
            <Link href="/posts/new">
              <Button size="sm" className="gap-2">
                <FileText className="h-4 w-4" />
                写文章
              </Button>
            </Link>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium hidden sm:inline">{user.name || user.email?.split("@")[0]}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {user.name && <p className="font-medium">{user.name}</p>}
                      {user.email && (
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Link href="/profile" className="cursor-pointer flex items-center w-full">
                      <User className="mr-2 h-4 w-4" />
                      个人中心
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "ADMIN" && (
                    <DropdownMenuItem>
                      <Link href="/admin" className="cursor-pointer flex items-center w-full">
                        <Settings className="mr-2 h-4 w-4" />
                        管理后台
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={() => signOut()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    登录
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">
                    注册
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger className="lg:hidden">
              <div className="inline-flex shrink-0 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 w-9 p-0 cursor-pointer">
                <Menu className="h-4 w-4" />
              </div>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <div className="flex flex-col h-full">
                {/* Logo */}
                <div className="flex items-center gap-3 pb-4 border-b">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-lg text-foreground">WikiFlow</span>
                    {showAdminNav && (
                      <span className="text-xs text-muted-foreground -mt-0.5">管理后台</span>
                    )}
                  </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 space-y-1">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        )}
                      >
                        {Icon && <Icon className="h-5 w-5" />}
                        {item.title}
                      </Link>
                    );
                  })}
                </nav>

                {/* User Section */}
                <div className="pt-4 border-t">
                  {user ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 px-4 py-2">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.image || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{user.name || user.email?.split("@")[0]}</p>
                          {user.email && (
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          )}
                        </div>
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-xl transition-all"
                      >
                        <User className="h-5 w-5" />
                        个人中心
                      </Link>
                      {user.role === "ADMIN" && (
                        <Link
                          href="/admin"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground rounded-xl transition-all"
                        >
                          <Settings className="h-5 w-5" />
                          管理后台
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          signOut();
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 text-sm text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                      >
                        <LogOut className="h-5 w-5" />
                        退出登录
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full">
                          登录
                        </Button>
                      </Link>
                      <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                        <Button className="w-full">
                          注册
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Search Dialog */}
          {searchOpen && (
            <div className="fixed inset-0 z-[60]">
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                  setSearchResults([]);
                }}
              />
              <div className="fixed inset-x-0 top-[15%] mx-auto max-w-xl px-4">
                <div className="bg-background rounded-xl shadow-2xl border overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 border-b">
                    <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="搜索文章..."
                      className="flex-1 bg-transparent border-none outline-none text-base placeholder:text-muted-foreground"
                    />
                    {searchLoading && (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    )}
                    <button
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0"
                      title="关闭搜索 (Esc)"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                  {searchResults.length > 0 && (
                    <div className="max-h-80 overflow-y-auto">
                      {searchResults.map((post) => (
                        <Link
                          key={post.id}
                          href={`/posts/${post.slug}`}
                          onClick={() => {
                            setSearchOpen(false);
                            setSearchQuery("");
                            setSearchResults([]);
                          }}
                          className="block px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-b-0"
                        >
                          <p className="font-medium text-sm">{post.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {post.category && (
                              <span className="text-xs text-muted-foreground">
                                {post.category.name}
                              </span>
                            )}
                            {post.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag.name}
                                className="text-xs px-1.5 py-0.5 bg-muted rounded"
                              >
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                  {searchQuery.length >= 2 && !searchLoading && searchResults.length === 0 && (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                      未找到相关文章
                    </div>
                  )}
                  {searchQuery.length < 2 && (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                      输入至少2个字符开始搜索
                    </div>
                  )}
                  <div className="px-4 py-2 border-t flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Esc</kbd>
                      关闭
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">↑↓</kbd>
                      导航
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Enter</kbd>
                      打开
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}