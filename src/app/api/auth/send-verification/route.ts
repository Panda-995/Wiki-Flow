import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { z } from "zod";
import { randomInt } from "crypto";

const sendSchema = z.object({
  email: z.string().email(),
});

function generateCode(): string {
  return randomInt(100000, 999999).toString();
}

async function getSetting(key: string, defaultValue: string): Promise<string> {
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key } });
    return setting?.value || defaultValue;
  } catch {
    return defaultValue;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = sendSchema.parse(body);

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

    const cooldownSeconds = parseInt(
      await getSetting("verification_cooldown_seconds", "60")
    );

    const recentCode = await prisma.emailVerificationCode.findFirst({
      where: {
        email: normalizedEmail,
        createdAt: {
          gte: new Date(Date.now() - cooldownSeconds * 1000),
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (recentCode) {
      const remainingSeconds = Math.ceil(
        (recentCode.createdAt.getTime() + cooldownSeconds * 1000 - Date.now()) / 1000
      );
      return NextResponse.json(
        { error: `请等待 ${remainingSeconds} 秒后再发送验证码` },
        { status: 429 }
      );
    }

    const validityMinutes = parseInt(
      await getSetting("verification_code_validity_minutes", "10")
    );

    const code = generateCode();
    const expiresAt = new Date(Date.now() + validityMinutes * 60 * 1000);

    await prisma.emailVerificationCode.create({
      data: {
        email: normalizedEmail,
        code,
        expiresAt,
      },
    });

    const subject = await getSetting("verification_email_subject", "WikiFlow - 邮箱验证码");
    const template = await getSetting("verification_email_template", "您的验证码是：{{code}}，有效期 {{expires}} 分钟。");
    const html = template
      .replace(/\{\{code\}\}/g, code)
      .replace(/\{\{expires\}\}/g, String(validityMinutes));

    await sendMail({ to: normalizedEmail, subject, html });

    return NextResponse.json(
      { message: "验证码已发送", expiresIn: validityMinutes * 60 },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "邮箱格式不正确" },
        { status: 400 }
      );
    }
    console.error("Send verification error:", error);
    return NextResponse.json(
      { error: "发送验证码失败" },
      { status: 500 }
    );
  }
}
