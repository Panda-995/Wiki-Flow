import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

function generateCode(length: number = 16): string {
  return randomBytes(length).toString("hex").slice(0, length);
}

export async function GET() {
  const session = await auth();
  if (!session?.user || !["ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  try {
    const codes = await prisma.accessCode.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { name: true, email: true } },
      },
    });
    return NextResponse.json(codes);
  } catch (error) {
    console.error("Failed to fetch access codes:", error);
    return NextResponse.json({ error: "获取访问码失败" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !["ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, description, level, usageLimit, expiresAt } = body;

    if (!name) {
      return NextResponse.json({ error: "名称不能为空" }, { status: 400 });
    }

    const code = generateCode();

    const accessCode = await prisma.accessCode.create({
      data: {
        code,
        name,
        description: description || null,
        level: level || "PROTECTED",
        usageLimit: usageLimit || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdById: session.user.id,
      },
      include: {
        createdBy: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json(accessCode, { status: 201 });
  } catch (error) {
    console.error("Failed to create access code:", error);
    return NextResponse.json({ error: "创建访问码失败" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user || !["ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, name, description, level, usageLimit, expiresAt, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "访问码 ID 不能为空" }, { status: 400 });
    }

    const accessCode = await prisma.accessCode.update({
      where: { id },
      data: {
        name: name || undefined,
        description: description || undefined,
        level: level || undefined,
        usageLimit: usageLimit || undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
      include: {
        createdBy: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json(accessCode);
  } catch (error) {
    console.error("Failed to update access code:", error);
    return NextResponse.json({ error: "更新访问码失败" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user || !["ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "访问码 ID 不能为空" }, { status: 400 });
    }

    await prisma.accessCode.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete access code:", error);
    return NextResponse.json({ error: "删除访问码失败" }, { status: 500 });
  }
}