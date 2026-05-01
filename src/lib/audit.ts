import { prisma } from "@/lib/prisma";

interface LogActionParams {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  detail?: string;
  ip?: string;
}

export async function logAudit({
  userId,
  action,
  entity,
  entityId,
  detail,
  ip,
}: LogActionParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entity,
        entityId: entityId || null,
        detail: detail || null,
        ip: ip || null,
      },
    });
  } catch (error) {
    console.error("Audit log error:", error);
  }
}
