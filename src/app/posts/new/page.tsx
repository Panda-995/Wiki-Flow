"use client";

import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { NewPostForm } from "./post-form";
import { useSession } from "next-auth/react";

export default function NewPostPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-background">
      <Header
        user={session?.user ? {
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          role: (session.user as { role?: string }).role,
        } : undefined}
      />

      <main className="container mx-auto px-4 md:px-6 py-8">
        <div className="mb-6">
          <Link href="/posts">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回列表
            </Button>
          </Link>
        </div>

        <Card className="max-w-4xl">
          <CardHeader>
            <h1 className="text-2xl font-bold">创建新文章</h1>
            <p className="text-sm text-muted-foreground mt-1">使用 Markdown 编辑器创作您的文章</p>
          </CardHeader>
          <CardContent>
            <NewPostForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
