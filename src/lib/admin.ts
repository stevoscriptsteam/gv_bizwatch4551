import { NextResponse } from "next/server";
import type { Business } from "@/lib/types";
import { getDb } from "@/lib/cloudflare";
import { generateId } from "@/lib/auth";
import { getCurrentBusiness } from "@/lib/session";

/** Master account — only this phone can grant/revoke admin access. */
export const MASTER_PHONE = "+61402940839";

export type AdminAction =
  | "archive_report"
  | "restore_report"
  | "delete_report_comment"
  | "delete_article_comment"
  | "add_business"
  | "activate_business"
  | "deactivate_business"
  | "grant_admin"
  | "revoke_admin";

export type AdminAuditEntry = {
  id: string;
  admin_business_id: string;
  admin_business_name?: string;
  action: AdminAction;
  entity_type: string;
  entity_id: string;
  details: string | null;
  created_at: string;
};

export function isMaster(business: Pick<Business, "phone">): boolean {
  return business.phone === MASTER_PHONE;
}

export function isAdmin(business: Pick<Business, "is_admin">): boolean {
  return business.is_admin === 1;
}

export async function ensureMasterAdminFlag(businessId: string): Promise<void> {
  const db = await getDb();
  await db
    .prepare("UPDATE businesses SET is_admin = 1 WHERE id = ?")
    .bind(businessId)
    .run();
}

type AdminResult =
  | { ok: true; business: Business }
  | { ok: false; response: NextResponse };

export async function requireAdmin(): Promise<AdminResult> {
  const business = await getCurrentBusiness();
  if (!business) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!isAdmin(business)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, business };
}

export async function requireMaster(): Promise<AdminResult> {
  const result = await requireAdmin();
  if (!result.ok) return result;

  if (!isMaster(result.business)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Only the master account can manage admin access." },
        { status: 403 },
      ),
    };
  }

  return result;
}

export async function logAdminAction(input: {
  adminId: string;
  action: AdminAction;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  const db = await getDb();
  await db
    .prepare(
      `INSERT INTO admin_audit_log (id, admin_business_id, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      generateId("audit"),
      input.adminId,
      input.action,
      input.entityType,
      input.entityId,
      input.details ? JSON.stringify(input.details) : null,
    )
    .run();
}

export async function listAuditLog(limit = 100): Promise<AdminAuditEntry[]> {
  const db = await getDb();
  const result = await db
    .prepare(
      `SELECT a.*, b.business_name as admin_business_name
       FROM admin_audit_log a
       JOIN businesses b ON b.id = a.admin_business_id
       ORDER BY a.created_at DESC
       LIMIT ?`,
    )
    .bind(limit)
    .all<AdminAuditEntry>();

  return result.results ?? [];
}
