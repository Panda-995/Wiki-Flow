import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const { content, authorName } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: "内容不能为空" }, { status: 400 });
    }

    if (authorName && typeof authorName === "string" && authorName.trim()) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { name: escapeHtml(authorName.trim()) },
      });
    }

    const comment = await prisma.comment.create({
      data: {
        content: escapeHtml(content.trim()),
        authorId: session.user.id,
        isPublic: true,
      },
      include: {
        author: { select: { name: true } },
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Guestbook error:", error);
    return NextResponse.json({ error: "提交失败" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const comments = await prisma.comment.findMany({
      where: { postId: null, isPublic: true },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({ comments });
  } catch (err) {
    console.error("Guestbook GET error:", err);
    return NextResponse.json({ error: "获取留言失败" }, { status: 500 });
  }
}
