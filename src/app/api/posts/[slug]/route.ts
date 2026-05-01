import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { renderMarkdown, extractHeadings } from "@/lib/markdown";

export const dynamic = "force-dynamic";

async function verifyAccessCode(code: string): Promise<boolean> {
  const accessCode = await prisma.accessCode.findUnique({
    where: { code },
  });

  if (!accessCode || !accessCode.isActive) return false;
  if (accessCode.expiresAt && new Date(accessCode.expiresAt) < new Date()) return false;
  if (accessCode.usageLimit && accessCode.usedCount >= accessCode.usageLimit) return false;

  await prisma.accessCode.update({
    where: { id: accessCode.id },
    data: { usedCount: { increment: 1 } },
  });

  return true;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const post = await prisma.post.findUnique({
      where: { slug },
      include: {
        author: { select: { name: true, image: true } },
        category: { select: { name: true, color: true } },
        tags: { select: { name: true, slug: true } },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    if (post.accessLevel !== "PUBLIC") {
      const session = await auth();

      if (post.accessLevel === "PRIVATE") {
        const isAuthor = session?.user?.id === post.authorId;
        const isAdmin = session?.user?.role === "ADMIN";

        if (!isAuthor && !isAdmin) {
          const { searchParams } = new URL(req.url);
          const accessCode = searchParams.get("accessCode");
          if (!accessCode || !(await verifyAccessCode(accessCode))) {
            return NextResponse.json({ error: "需要访问码", accessLevel: post.accessLevel }, { status: 403 });
          }
        }
      }

      if (post.accessLevel === "PROTECTED") {
        if (!session?.user) {
          const { searchParams } = new URL(req.url);
          const accessCode = searchParams.get("accessCode");
          if (!accessCode || !(await verifyAccessCode(accessCode))) {
            return NextResponse.json({ error: "需要访问码", accessLevel: post.accessLevel }, { status: 403 });
          }
        }
      }
    }

    const html = await renderMarkdown(post.content);
    const headings = extractHeadings(post.content);

    await prisma.post.update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json({
      post: {
        ...post,
        html,
        headings,
        viewCount: post.viewCount + 1,
      },
    });
  } catch (err) {
    console.error("Failed to fetch post:", err);
    return NextResponse.json({ error: "获取文章失败" }, { status: 500 });
  }
}
