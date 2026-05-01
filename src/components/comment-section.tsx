"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Send, Trash2, Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface CommentData {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string | null; image: string | null };
  replies: CommentData[];
}

interface CommentSectionProps {
  postId: string;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?postId=${postId}`);
      const data = await res.json();
      setComments(data.comments || []);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content: content.trim() }),
      });
      if (res.ok) {
        setContent("");
        fetchComments();
      } else {
        const data = await res.json();
        setError(data.error || "发表失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content: replyContent.trim(), parentId }),
      });
      if (res.ok) {
        setReplyContent("");
        setReplyTo(null);
        fetchComments();
      } else {
        const data = await res.json();
        setError(data.error || "回复失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("确定要删除这条评论吗？")) return;
    try {
      const res = await fetch(`/api/comments?commentId=${commentId}`, { method: "DELETE" });
      if (res.ok) {
        fetchComments();
      }
    } catch {
      // failed
    }
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes}分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}天前`;
    return date.toLocaleDateString("zh-CN");
  };

  const renderComment = (comment: CommentData, isReply = false) => {
    const initials = comment.author.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

    return (
      <div key={comment.id} className={`${isReply ? "ml-10 mt-2" : "border-b last:border-b-0 pb-4 mb-4"}`}>
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{comment.author.name || "匿名用户"}</span>
              <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap break-words">{comment.content}</p>
            <div className="flex items-center gap-3 mt-2">
              {session?.user && !isReply && (
                <button
                  onClick={() => {
                    setReplyTo(replyTo === comment.id ? null : comment.id);
                    setReplyContent("");
                  }}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  {replyTo === comment.id ? "取消回复" : "回复"}
                </button>
              )}
              {session?.user && (session.user.id === comment.author.id || (session.user as { role?: string }).role === "ADMIN") && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" />
                  删除
                </button>
              )}
            </div>

            {replyTo === comment.id && (
              <div className="mt-3 space-y-2">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={`回复 ${comment.author.name || "匿名用户"}...`}
                  className="min-h-[60px] text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleReply(comment.id)} disabled={submitting || !replyContent.trim()}>
                    {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                    <span className="ml-1">回复</span>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setReplyTo(null)}>取消</Button>
                </div>
              </div>
            )}

            {comment.replies.length > 0 && (
              <div className="mt-2">
                <button
                  onClick={() => toggleReplies(comment.id)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  {expandedReplies.has(comment.id) ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                  {comment.replies.length} 条回复
                </button>
                {expandedReplies.has(comment.id) && (
                  <div className="mt-1">
                    {comment.replies.map((reply) => renderComment(reply, true))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-12 pt-8 border-t">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-5 w-5" />
        <h2 className="text-xl font-bold">评论 ({comments.length})</h2>
      </div>

      {session?.user ? (
        <div className="mb-8 space-y-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="写下你的评论..."
            className="min-h-[100px]"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={submitting || !content.trim()} className="gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              发表评论
            </Button>
          </div>
        </div>
      ) : (
        <Card className="mb-8 border-dashed">
          <CardContent className="py-6 text-center">
            <p className="text-muted-foreground mb-3">登录后参与评论</p>
            <Link href={`/login?callbackUrl=/posts/${postId}`}>
              <Button variant="outline" size="sm">前往登录</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="h-8 w-8 bg-muted rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-24" />
                <div className="h-4 bg-muted rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">暂无评论，来发表第一条评论吧</p>
      ) : (
        <div>{comments.map((comment) => renderComment(comment))}</div>
      )}
    </div>
  );
}
