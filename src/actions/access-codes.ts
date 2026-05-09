"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import type { AccessLevel } from "@prisma/client";

function normalizeAccessLevel(level: FormDataEntryValue | null): AccessLevel {
  return level === "PRIVATE" ? "PRIVATE" : "PROTECTED";
}

export async function createAccessCode(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("无权限");
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const level = normalizeAccessLevel(formData.get("level"));
  const parsedUsageLimit = parseInt(formData.get("usageLimit") as string);
  const usageLimit = Number.isInteger(parsedUsageLimit) && parsedUsageLimit > 0
    ? Math.min(parsedUsageLimit, 1_000_000)
    : null;
  const expiresAt = formData.get("expiresAt") as string || null;

  if (!name) {
    throw new Error("访问码名称不能为空");
  }

  const code = randomBytes(8).toString("hex").toUpperCase();

  const accessCode = await prisma.accessCode.create({
    data: {
      code,
      name,
      description: description || null,
      level,
      usageLimit,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdById: session.user.id,
    },
  });

  revalidatePath("/admin/access-codes");
  return accessCode;
}

export async function validateAccessCode(code: string): Promise<boolean> {
  const accessCode = await prisma.accessCode.findUnique({
    where: { code },
  });

  if (!accessCode || !accessCode.isActive) {
    return false;
  }

  if (accessCode.expiresAt && new Date() > accessCode.expiresAt) {
    return false;
  }

  if (accessCode.usageLimit && accessCode.usedCount >= accessCode.usageLimit) {
    return false;
  }

  const consumed = await prisma.accessCode.updateMany({
    where: {
      id: accessCode.id,
      ...(accessCode.usageLimit ? { usedCount: { lt: accessCode.usageLimit } } : {}),
    },
    data: { usedCount: { increment: 1 } },
  });

  return consumed.count === 1;
}

export async function deleteAccessCode(accessCodeId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("无权限");
  }

  await prisma.accessCode.delete({
    where: { id: accessCodeId },
  });

  revalidatePath("/admin/access-codes");
}

export async function toggleAccessCode(accessCodeId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("无权限");
  }

  const accessCode = await prisma.accessCode.findUnique({
    where: { id: accessCodeId },
  });

  if (!accessCode) {
    throw new Error("访问码不存在");
  }

  await prisma.accessCode.update({
    where: { id: accessCodeId },
    data: { isActive: !accessCode.isActive },
  });

  revalidatePath("/admin/access-codes");
}
