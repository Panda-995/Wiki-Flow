import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { AccessLevel } from "@prisma/client";

export const dynamic = "force-dynamic";

async function verifyAccessCode(code: string): Promise<AccessLevel | null> {
  const accessCode = await prisma.accessCode.findUnique({
    where: { code },
  });

  if (!accessCode || !accessCode.isActive) return null;
  if (accessCode.expiresAt && new Date(accessCode.expiresAt) < new Date()) return null;
  if (accessCode.usageLimit && accessCode.usedCount >= accessCode.usageLimit) return null;

  const consumed = await prisma.accessCode.updateMany({
    where: {
      id: accessCode.id,
      ...(accessCode.usageLimit ? { usedCount: { lt: accessCode.usageLimit } } : {}),
    },
    data: { usedCount: { increment: 1 } },
  });

  return consumed.count === 1 ? accessCode.level : null;
}

const SORT_OPTIONS = {
  createdAt_desc: { createdAt: "desc" as const },
  createdAt_asc: { createdAt: "asc" as const },
  publishedAt_desc: { publishedAt: "desc" as const },
  publishedAt_asc: { publishedAt: "asc" as const },
  title_asc: { title: "asc" as const },
  title_desc: { title: "desc" as const },
  viewCount_desc: { viewCount: "desc" as const },
  viewCount_asc: { viewCount: "asc" as const },
};

function parsePositiveInt(value: string | null, fallback: number, max: number): number {
  const parsed = Number.parseInt(value || "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isAdmin = searchParams.get("admin") === "true";
    const accessCode = searchParams.get("accessCode");
    const page = parsePositiveInt(searchParams.get("page"), 1, 10_000);
    const pageSize = parsePositiveInt(searchParams.get("pageSize"), 9, 50);
    const sort = searchParams.get("sort") || "createdAt_desc";

    const session = isAdmin ? await auth() : null;
    if (isAdmin && (!session?.user || session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    let accessCodeLevel: AccessLevel | null = null;
    if (accessCode) {
      accessCodeLevel = await verifyAccessCode(accessCode);
    }

    const accessCodeRules =
      accessCodeLevel === "PRIVATE"
        ? [{ accessLevel: "PROTECTED" as const }, { accessLevel: "PRIVATE" as const }]
        : accessCodeLevel === "PROTECTED"
          ? [{ accessLevel: "PROTECTED" as const }]
          : [];

    const where: Record<string, unknown> = isAdmin
      ? {}
      : {
          status: "PUBLISHED" as const,
          OR: [
            { accessLevel: "PUBLIC" as const },
            ...(session?.user ? [{ accessLevel: "PROTECTED" as const }] : []),
            ...accessCodeRules,
            ...(session?.user ? [{ accessLevel: "PRIVATE" as const, authorId: session.user.id }] : []),
          ],
        };

    const orderBy = SORT_OPTIONS[sort as keyof typeof SORT_OPTIONS] || SORT_OPTIONS.createdAt_desc;

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
