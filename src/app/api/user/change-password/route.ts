import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash, compare } from "bcryptjs";
import { z } from "zod";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "请输入当前密码"),
  newPassword: z.string().min(8, "新密码至少8个字符").max(128),
});

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword } = changePasswordSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "该账户未设置密码" },
        { status: 400 }
      );
    }

    const isValid = await compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "当前密码不正确" },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(newPassword, 12);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: "密码修改成功" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "输入无效" },
        { status: 400 }
      );
    }
    console.error("Change password error:", error);
    return NextResponse.json({ error: "修改密码失败" }, { status: 500 });
  }
}
