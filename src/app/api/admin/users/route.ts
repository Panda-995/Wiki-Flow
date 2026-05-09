import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        emailVerified: true,
        lockedUntil: true,
        failedAttempts: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { posts: true, comments: true } },
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json({ error: "获取用户列表失败" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, role, disabled } = body;

    if (!userId) {
      return NextResponse.json({ error: "缺少用户ID" }, { status: 400 });
    }

    if (userId === session.user.id) {
      return NextResponse.json({ error: "不能修改自己的角色" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (role) {
      if (!["ADMIN", "EDITOR", "USER"].includes(role)) {
        return NextResponse.json({ error: "无效的角色" }, { status: 400 });
      }
      updateData.role = role;
    }
    if (disabled !== undefined) {
      updateData.lockedUntil = disabled
        ? new Date("2099-12-31")
        : null;
      updateData.failedAttempts = disabled ? 999 : 0;
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    await logAudit({
      userId: session.user.id,
      action: "UPDATE",
      entity: "user",
      entityId: userId,
      detail: "Updated user role or lock status",
    });

    return NextResponse.json({ message: "更新成功" });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "缺少用户ID" }, { status: 400 });
    }

    if (userId === session.user.id) {
      return NextResponse.json({ error: "不能删除自己的账户" }, { status: 400 });
    }

    await prisma.user.delete({ where: { id: userId } });

    await logAudit({
      userId: session.user.id,
      action: "DELETE",
      entity: "user",
      entityId: userId,
      detail: "Deleted user",
    });

    return NextResponse.json({ message: "删除成功" });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
