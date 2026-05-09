import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req.headers);
    const limit = checkRateLimit(`access-code:${ip}`, 30, 60_000);
    if (!limit.allowed) {
      return NextResponse.json(
        { valid: false, error: "请求过于频繁，请稍后再试" },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
      );
    }

    const body = await req.json();
    const { code } = body;

    if (!code || typeof code !== "string" || code.length > 128) {
      return NextResponse.json({ valid: false, error: "访问码不能为空" }, { status: 400 });
    }

    const accessCode = await prisma.accessCode.findUnique({
      where: { code },
    });

    if (!accessCode) {
      return NextResponse.json({ valid: false, error: "访问码无效" }, { status: 404 });
    }

    if (!accessCode.isActive) {
      return NextResponse.json({ valid: false, error: "访问码已禁用" }, { status: 403 });
    }

    if (accessCode.expiresAt && new Date(accessCode.expiresAt) < new Date()) {
      return NextResponse.json({ valid: false, error: "访问码已过期" }, { status: 403 });
    }

    if (accessCode.usageLimit && accessCode.usedCount >= accessCode.usageLimit) {
      return NextResponse.json({ valid: false, error: "访问码使用次数已用尽" }, { status: 403 });
    }

    const consumed = await prisma.accessCode.updateMany({
      where: {
        id: accessCode.id,
        ...(accessCode.usageLimit ? { usedCount: { lt: accessCode.usageLimit } } : {}),
      },
      data: { usedCount: { increment: 1 } },
    });

    if (consumed.count !== 1) {
      return NextResponse.json({ valid: false, error: "访问码使用次数已用尽" }, { status: 403 });
    }

    return NextResponse.json({ 
      valid: true, 
      level: accessCode.level,
      name: accessCode.name 
    });
  } catch (error) {
    console.error("Failed to verify access code:", error);
    return NextResponse.json({ valid: false, error: "验证失败" }, { status: 500 });
  }
}
