import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = registerSchema.parse(body);

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
    const ip = getClientIp(req.headers);
    const attemptLimit = checkRateLimit(
      `register:${ip}:${normalizedEmail}`,
      10,
      60 * 60 * 1000
    );

    if (!attemptLimit.allowed) {
      return NextResponse.json(
        { error: "注册尝试过于频繁，请稍后再试" },
        { status: 429, headers: { "Retry-After": String(attemptLimit.retryAfterSeconds) } }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name,
          email: normalizedEmail,
          password: hashedPassword,
          emailVerified: new Date(),
        },
      });

      await tx.account.create({
        data: {
          userId: createdUser.id,
          type: "credentials",
          provider: "credentials",
          providerAccountId: createdUser.id,
        },
      });

      return createdUser;
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