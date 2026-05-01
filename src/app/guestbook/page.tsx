"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import { useSession } from "next-auth/react";
import { Plus, MessageSquare } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  author: { name: string | null; email: string };
}

export default function GuestbookPage() {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      const res = await fetch("/api/guestbook");
      const data = await res.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newComment,
          authorName: authorName || "匿名用户",
        }),
      });

      if (res.ok) {
        setNewComment("");
        fetchComments();
      }
    } catch (error) {
      console.error("Failed to submit comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        user={session?.user ? { name: session.user.name, email: session.user.email, image: session.user.image, role: (session.user as { role?: string }).role } : undefined}
        title="留言板"
        backHref="/"
        backLabel="返回首页"
      />

      <main className="container mx-auto max-w-2xl px-4 md:px-6 py-8">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 mb-8">
          <CardContent className="p-6">
            <h2 className="font-semibold mb-4">发表留言</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="您的昵称（选填）"
              />
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="写下您的留言..."
                className="min-h-[100px]"
                required
              />
              <Button type="submit" disabled={isSubmitting || !newComment.trim()} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                {isSubmitting ? "提交中..." : "发表留言"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <h2 className="text-lg font-semibold mb-4">留言列表 ({comments.length})</h2>
        
        {comments.length === 0 ? (
          <Card className="border-0">
            <CardContent className="py-12 text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无留言，发表第一条留言吧</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <Card key={comment.id} className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-pink-100 text-pink-600">
                        {comment.author.name?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">
                          {comment.author.name || "匿名用户"}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {new Date(comment.createdAt).toLocaleDateString("zh-CN")}
                        </Badge>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}