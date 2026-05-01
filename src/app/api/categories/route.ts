import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { posts: true } },
        parent: { select: { name: true } },
      },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json({ error: "获取分类失败" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, description, color, order, parentId } = body;

    if (!name) {
      return NextResponse.json({ error: "分类名称不能为空" }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "该分类 slug 已存在" }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: description || null,
        color: color || null,
        order: order || 0,
        parentId: parentId || null,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Failed to create category:", error);
    return NextResponse.json({ error: "创建分类失败" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, name, description, color, order, parentId } = body;

    if (!id) {
      return NextResponse.json({ error: "分类 ID 不能为空" }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ error: "分类名称不能为空" }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        slug,
        description: description || null,
        color: color || null,
        order: order || 0,
        parentId: parentId || null,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Failed to update category:", error);
    return NextResponse.json({ error: "更新分类失败" }, { status: 500 });
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
      return NextResponse.json({ error: "分类 ID 不能为空" }, { status: 400 });
    }

    await prisma.category.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete category:", error);
    return NextResponse.json({ error: "删除分类失败" }, { status: 500 });
  }
}