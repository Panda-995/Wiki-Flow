import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isAdmin = searchParams.get("admin") === "true";
    const accessCode = searchParams.get("accessCode");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "9");
    const sort = searchParams.get("sort") || "createdAt_desc";

    const session = isAdmin ? await auth() : null;
    if (isAdmin && (!session?.user || session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    let hasAccessCode = false;
    if (accessCode) {
      hasAccessCode = await verifyAccessCode(accessCode);
    }

    const where: Record<string, unknown> = isAdmin
      ? {}
      : {
          status: "PUBLISHED" as const,
          OR: [
            { accessLevel: "PUBLIC" as const },
            ...(session?.user ? [{ accessLevel: "PROTECTED" as const }] : []),
            ...(hasAccessCode ? [{ accessLevel: "PROTECTED" as const }, { accessLevel: "PRIVATE" as const }] : []),
            ...(session?.user ? [{ accessLevel: "PRIVATE" as const, authorId: session.user.id }] : []),
          ],
        };

    const [sortField, sortDir] = sort.split("_");
    const orderBy = { [sortField || "createdAt"]: sortDir === "asc" ? "asc" as const : "desc" as const };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          author: { select: { name: true } },
          category: { select: { name: true, color: true } },
          tags: { select: { name: true } },
          _count: { select: { comments: true } },
        },
      }),
      prisma.post.count({ where }),
    ]);

    return NextResponse.json({
      posts,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    console.error("Failed to fetch posts:", err);
    return NextResponse.json({ error: "获取文章列表失败" }, { status: 500 });
  }
}
