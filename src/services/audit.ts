import { db, Prisma } from "@/database/client";

export interface AuditEntry {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}

/**
 * Append-only audit trail for access to and changes of protected records.
 * Never throws: an audit failure must not break the user-facing operation,
 * but it is reported to the server log so it is not silent.
 */
export async function audit(entry: AuditEntry, client: Pick<typeof db, "auditLog"> = db): Promise<void> {
  try {
    await client.auditLog.create({
      data: {
        userId: entry.userId ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        metadata: (entry.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        ipAddress: entry.ipAddress ?? null,
      },
    });
  } catch (err) {
    console.error("[audit] failed to write audit log", entry.action, err);
  }
}
