import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { z } from "zod";
import { randomInt } from "crypto";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

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
    const ip = getClientIp(req.headers);
    const ipLimit = checkRateLimit(`verification:ip:${ip}`, 20, 60 * 60 * 1000);
    const emailLimit = checkRateLimit(`verification:email:${normalizedEmail}`, 3, 60 * 60 * 1000);

    if (!ipLimit.allowed || !emailLimit.allowed) {
      return NextResponse.json(
        { error: "验证码请求过于频繁，请稍后再试" },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.max(ipLimit.retryAfterSeconds, emailLimit.retryAfterSeconds)),
          },
        }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "如果该邮箱可以注册，验证码将发送到此邮箱", expiresIn: 0 },
        { status: 200 }
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

    const mailResult = await sendMail({ to: normalizedEmail, subject, html });
    if (!mailResult.success) {
      return NextResponse.json(
        { error: "发送验证码失败" },
        { status: 500 }
      );
    }

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
