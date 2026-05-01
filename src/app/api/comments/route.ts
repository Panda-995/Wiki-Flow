import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const commentRateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60000;

function checkCommentRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = commentRateLimit.get(userId);

  if (!entry || now > entry.resetTime) {
    commentRateLimit.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId");

    if (!postId) {
      return NextResponse.json({ error: "缺少文章ID" }, { status: 400 });
    }

    const comments = await prisma.comment.findMany({
      where: { postId, parentId: null, isPublic: true },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true, image: true } },
        replies: {
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Get comments error:", error);
    return NextResponse.json({ error: "获取评论失败" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    if (!checkCommentRateLimit(session.user.id)) {
      return NextResponse.json({ error: "评论过于频繁，请稍后再试" }, { status: 429 });
    }

    const body = await req.json();
    const { postId, content, parentId } = body;

    if (!postId || !content || content.trim().length === 0) {
      return NextResponse.json({ error: "评论内容不能为空" }, { status: 400 });
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: "评论内容不能超过2000字" }, { status: 400 });
    }

    const sanitizedContent = escapeHtml(content.trim());

    const comment = await prisma.comment.create({
      data: {
        content: sanitizedContent,
        postId,
        authorId: session.user.id,
        parentId: parentId || null,
      },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json({ error: "发表评论失败" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json({ error: "缺少评论ID" }, { status: 400 });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true },
    });

    if (!comment) {
      return NextResponse.json({ error: "评论不存在" }, { status: 404 });
    }

    if (comment.authorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "无权限删除此评论" }, { status: 403 });
    }

    await prisma.comment.delete({ where: { id: commentId } });

    return NextResponse.json({ message: "删除成功" });
  } catch (error) {
    console.error("Delete comment error:", error);
    return NextResponse.json({ error: "删除评论失败" }, { status: 500 });
  }
}
