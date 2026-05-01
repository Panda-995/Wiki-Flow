import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const { name } = await req.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "名称不能为空" }, { status: 400 });
    }

    if (name.trim().length > 100) {
      return NextResponse.json({ error: "名称长度不能超过 100 个字符" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { name: name.trim() },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
