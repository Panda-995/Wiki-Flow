import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { randomBytes } from "crypto";
import type { AccessLevel } from "@prisma/client";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

function generateCode(length: number = 16): string {
  return randomBytes(length).toString("hex").slice(0, length);
}

function normalizeAccessLevel(level: unknown): AccessLevel {
  return level === "PRIVATE" ? "PRIVATE" : "PROTECTED";
}

function normalizeUsageLimit(value: unknown): number | null {
  const limit = typeof value === "number" ? value : Number.parseInt(String(value || ""), 10);
  if (!Number.isInteger(limit) || limit < 1) return null;
  return Math.min(limit, 1_000_000);
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

    if (!name || typeof name !== "string" || name.trim().length === 0 || name.length > 100) {
      return NextResponse.json({ error: "名称不能为空" }, { status: 400 });
    }

    const code = generateCode();

    const accessCode = await prisma.accessCode.create({
      data: {
        code,
        name: name.trim(),
        description: typeof description === "string" && description.trim() ? description.trim() : null,
        level: normalizeAccessLevel(level),
        usageLimit: normalizeUsageLimit(usageLimit),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdById: session.user.id,
      },
      include: {
        createdBy: { select: { name: true, email: true } },
      },
    });

    await logAudit({
      userId: session.user.id,
      action: "CREATE",
      entity: "access_code",
      entityId: accessCode.id,
      detail: `Created access code "${accessCode.name}"`,
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

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "访问码 ID 不能为空" }, { status: 400 });
    }

    const accessCode = await prisma.accessCode.update({
      where: { id },
      data: {
        name: typeof name === "string" && name.trim() ? name.trim().slice(0, 100) : undefined,
        description: typeof description === "string" ? description.trim() || null : undefined,
        level: level ? normalizeAccessLevel(level) : undefined,
        usageLimit: usageLimit !== undefined ? normalizeUsageLimit(usageLimit) : undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
      include: {
        createdBy: { select: { name: true, email: true } },
      },
    });

    await logAudit({
      userId: session.user.id,
      action: "UPDATE",
      entity: "access_code",
      entityId: accessCode.id,
      detail: `Updated access code "${accessCode.name}"`,
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

    await logAudit({
      userId: session.user.id,
      action: "DELETE",
      entity: "access_code",
      entityId: id,
      detail: "Deleted access code",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete access code:", error);
    return NextResponse.json({ error: "删除访问码失败" }, { status: 500 });
  }
}
