import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";
import { DEFAULT_SETTINGS, ALLOWED_SETTINGS_KEYS } from "@/lib/settings-constants";
import { Prisma } from "@prisma/client";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const SMTP_PASS_PLACEHOLDER = "********";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const settings = await prisma.systemSetting.findMany();

    const result: Record<string, string> = { ...DEFAULT_SETTINGS };
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }

    const hasSmtpPassword = !!result.smtp_pass;
    if (hasSmtpPassword) {
      result.smtp_pass = SMTP_PASS_PLACEHOLDER;
    }

    return NextResponse.json({ settings: result, hasSmtpPassword });
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json({ error: "获取设置失败" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const body = await req.json();
    const { settings } = body as { settings: Record<string, string> };

    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "无效的设置数据" }, { status: 400 });
    }

    const operations: Prisma.PrismaPromise<unknown>[] = [];

    for (const [key, value] of Object.entries(settings)) {
      if (typeof value !== "string") continue;
      if (!ALLOWED_SETTINGS_KEYS.has(key)) continue;

      let finalValue = value;

      if (key === "smtp_pass") {
        if (value === SMTP_PASS_PLACEHOLDER) {
          continue;
        }
        if (value) {
          try {
            finalValue = encrypt(value);
          } catch (err) {
            console.error("Failed to encrypt SMTP password:", err);
            return NextResponse.json(
              { error: "SMTP 密码加密失败，请检查服务器加密配置" },
              { status: 500 }
            );
          }
        }
      }

      operations.push(
        prisma.systemSetting.upsert({
          where: { key },
          update: { value: finalValue },
          create: { key, value: finalValue },
        })
      );
    }

    await prisma.$transaction(operations);

    await logAudit({
      userId: session.user.id,
      action: "UPDATE",
      entity: "system_settings",
      detail: "Updated system settings",
    });

    return NextResponse.json({ message: "设置已保存" });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json({ error: "保存设置失败" }, { status: 500 });
  }
}
