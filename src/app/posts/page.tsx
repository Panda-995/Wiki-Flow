"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/header";
import { useSession } from "next-auth/react";
import { 
  FileText, Calendar, User, Search, 
  Clock, Eye, Filter, Grid, List,
  ChevronLeft, ChevronRight, X, Sparkles
} from "lucide-react";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: string;
  publishedAt: Date | null;
  createdAt: Date;
  viewCount?: number;
  author: { name: string | null };
  category: { name: string; color: string | null } | null;
  tags: { name: string }[];
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function PostsPage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(9);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, pageSize: 9, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState<string>("全部");
  const [selectedStatus, setSelectedStatus] = useState<string>("全部");
  const [allCategories, setAllCategories] = useState<string[]>(["全部"]);

  const fetchPosts = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts?page=${page}&pageSize=${pageSize}&sort=createdAt_desc`);
      const data = await res.json();
      if (data.posts) {
        setPosts(data.posts);
        setPagination(data.pagination || { page: 1, pageSize, total: data.posts.length, totalPages: 1 });
        const cats = ["全部", ...Array.from(new Set(data.posts.map((p: Post) => p.category?.name).filter(Boolean)))] as string[];
        setAllCategories(cats);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    fetchPosts(currentPage);
  }, [currentPage, fetchPosts]);

  const performSearch = useCallback(async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      setSearchResults(data.posts || []);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const timer = setTimeout(performSearch, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchQuery, performSearch]);

  const displayPosts = isSearching ? searchResults : posts;

  const filteredPosts = displayPosts.filter((post) => {
    if (!isSearching && selectedCategory !== "全部" && post.category?.name !== selectedCategory) return false;
    if (!isSearching && selectedStatus !== "全部") {
      const match = selectedStatus === "已发布" ? post.status === "PUBLISHED" : post.status === "DRAFT";
      if (!match) return false;
    }
    return true;
  });

  const totalPages = isSearching ? 1 : pagination.totalPages;
  const totalCount = isSearching ? searchResults.length : pagination.total;

  const clearFilters = () => {
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
    setSelectedCategory("全部");
    setSelectedStatus("全部");
  };

  const hasActiveFilters = isSearching || selectedCategory !== "全部" || selectedStatus !== "全部";

  if (loading && posts.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header user={session?.user ? { name: session.user.name, email: session.user.email, image: session.user.image, role: (session.user as { role?: string }).role } : undefined} title="文章列表" />
        <div className="container mx-auto px-4 md:px-6 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-muted rounded-lg"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 bg-muted rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        user={session?.user ? { name: session.user.name, email: session.user.email, image: session.user.image, role: (session.user as { role?: string }).role } : undefined}
        title="文章列表"
      />

      <main className="container mx-auto px-4 md:px-6 py-8">
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="搜索文章..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={`gap-2 ${showFilters ? 'bg-primary/10' : ''}`}
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">筛选</span>
              </Button>
              
              <div className="flex border rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-3 transition-colors ${viewMode === "grid" ? "bg-primary text-white" : "hover:bg-muted"}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-3 transition-colors ${viewMode === "list" ? "bg-primary text-white" : "hover:bg-muted"}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">分类</label>
                <div className="flex flex-wrap gap-2">
                  {allCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        selectedCategory === cat
                          ? "bg-primary text-white"
                          : "bg-background hover:bg-primary/10"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">状态</label>
                <div className="flex flex-wrap gap-2">
                  {["全部", "已发布", "草稿"].map((status) => (
                    <button
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        selectedStatus === status
                          ? "bg-primary text-white"
                          : "bg-background hover:bg-primary/10"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="self-end"
                >
                  <X className="h-4 w-4 mr-1" />
                  清除筛选
                </Button>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              共 {totalCount} 篇文章
              {hasActiveFilters && ` (已筛选)`}
            </span>
            {isSearching && (
              <span>
                搜索: <span className="font-medium text-foreground">&ldquo;{searchQuery}&rdquo;</span>
              </span>
            )}
          </div>
        </div>

        {filteredPosts.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-20">
              <div className="text-center">
                <FileText className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {hasActiveFilters ? "没有找到符合条件的文章" : "还没有文章"}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {hasActiveFilters ? "尝试调整筛选条件" : "开始创作你的第一篇文章吧"}
                </p>
                {hasActiveFilters ? (
                  <Button variant="outline" onClick={clearFilters}>
                    清除筛选
                  </Button>
                ) : (
                  <Link href="/posts/new">
                    <Button className="gap-2">
                      <Sparkles className="h-4 w-4" />
                      写文章
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <Link key={post.id} href={`/posts/${post.slug}`}>
                <Card className="group h-full border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                  <div 
                    className="h-1.5" 
                    style={{ backgroundColor: post.category?.color || '#e07b39' }}
                  />
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant={post.status === "PUBLISHED" ? "default" : "secondary"}>
                        {post.status === "PUBLISHED" ? "已发布" : "草稿"}
                      </Badge>
                      {post.category && (
                        <Badge 
                          variant="outline"
                          className="text-xs"
                          style={{ 
                            borderColor: post.category.color || undefined,
                            color: post.category.color || undefined
                          }}
                        >
                          {post.category.name}
                        </Badge>
                      )}
                    </div>

                    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h3>

                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {post.excerpt}
                      </p>
                    )}

                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {post.tags.slice(0, 3).map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            #{tag.name}
                          </Badge>
                        ))}
                        {post.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{post.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {post.author.name || "未知"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(post.createdAt).toLocaleDateString("zh-CN")}
                      </span>
                      {post.viewCount !== undefined && (
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {post.viewCount}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <Link key={post.id} href={`/posts/${post.slug}`}>
                <Card className="group border-0 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <div className="flex">
                    <div className="w-1" style={{ backgroundColor: post.category?.color || '#e07b39' }} />
                    <CardContent className="flex-1 p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={post.status === "PUBLISHED" ? "default" : "secondary"}>
                              {post.status === "PUBLISHED" ? "已发布" : "草稿"}
                            </Badge>
                            {post.category && (
                              <Badge 
                                variant="outline"
                                style={{ 
                                  borderColor: post.category.color || undefined,
                                  color: post.category.color || undefined
                                }}
                              >
                                {post.category.name}
                              </Badge>
                            )}
                            {post.tags.slice(0, 2).map((tag, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                #{tag.name}
                              </Badge>
                            ))}
                          </div>
                          <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                            {post.title}
                          </h3>
                          {post.excerpt && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {post.excerpt}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {post.author.name || "未知"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(post.createdAt).toLocaleDateString("zh-CN")}
                            </span>
                            {post.viewCount !== undefined && (
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {post.viewCount} 次阅读
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="hidden sm:block text-muted-foreground group-hover:text-primary transition-colors">
                          <FileText className="h-6 w-6" />
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {!isSearching && totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              上一页
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-10"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="gap-2"
            >
              下一页
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
