import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  verificationCode: z.string().length(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, verificationCode } = registerSchema.parse(body);

    const registrationSetting = await prisma.systemSetting.findUnique({
      where: { key: "enable_registration" },
    });
    if (registrationSetting?.value === "false") {
      return NextResponse.json(
        { error: "注册功能已关闭" },
        { status: 403 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 400 }
      );
    }

    const validCode = await prisma.emailVerificationCode.findFirst({
      where: {
        email: normalizedEmail,
        code: verificationCode,
        used: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!validCode) {
      return NextResponse.json(
        { error: "验证码无效或已过期" },
        { status: 400 }
      );
    }

    await prisma.emailVerificationCode.update({
      where: { id: validCode.id },
      data: { used: true },
    });

    const hashedPassword = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        emailVerified: new Date(),
      },
    });

    await prisma.account.create({
      data: {
        userId: user.id,
        type: "credentials",
        provider: "credentials",
        providerAccountId: user.id,
      },
    });

    return NextResponse.json(
      { message: "注册成功", user: { id: user.id, email: user.email } },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "输入数据格式不正确" },
        { status: 400 }
      );
    }
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "注册失败，请稍后重试" },
      { status: 500 }
    );
  }
}
