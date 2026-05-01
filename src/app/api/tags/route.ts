import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { posts: true } },
      },
    });
    return NextResponse.json(tags);
  } catch (error) {
    console.error("Failed to fetch tags:", error);
    return NextResponse.json({ error: "获取标签失败" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, color } = body;

    if (!name) {
      return NextResponse.json({ error: "标签名称不能为空" }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const existing = await prisma.tag.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "该标签 slug 已存在" }, { status: 400 });
    }

    const tag = await prisma.tag.create({
      data: {
        name,
        slug,
        color: color || null,
      },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error("Failed to create tag:", error);
    return NextResponse.json({ error: "创建标签失败" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, name, color } = body;

    if (!id) {
      return NextResponse.json({ error: "标签 ID 不能为空" }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ error: "标签名称不能为空" }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const tag = await prisma.tag.update({
      where: { id },
      data: {
        name,
        slug,
        color: color || null,
      },
    });

    return NextResponse.json(tag);
  } catch (error) {
    console.error("Failed to update tag:", error);
    return NextResponse.json({ error: "更新标签失败" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "标签 ID 不能为空" }, { status: 400 });
    }

    await prisma.tag.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete tag:", error);
    return NextResponse.json({ error: "删除标签失败" }, { status: 500 });
  }
}