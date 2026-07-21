import type { Crime } from "@/lib/types";
import { getDb } from "@/lib/cloudflare";
import { generateId } from "@/lib/auth";
import { MASTER_PHONE } from "@/lib/admin";
import { normalizePhone } from "@/lib/phone";
import type { Business } from "@/lib/types";

export type AdminReport = Crime & {
  archived_at?: string | null;
  archived_by?: string | null;
};

export type AdminComment = {
  id: string;
  type: "report" | "article";
  body: string;
  created_at: string;
  business_id: string;
  business_name: string;
  parent_id: string;
  parent_title: string;
  deleted_at?: string | null;
};

export async function listAdminReports(archivedOnly?: boolean): Promise<AdminReport[]> {
  const db = await getDb();
  const filter =
    archivedOnly === true
      ? "c.archived_at IS NOT NULL"
      : archivedOnly === false
        ? "c.archived_at IS NULL"
        : "1=1";

  const result = await db
    .prepare(
      `SELECT c.*, b.business_name
       FROM crimes c
       JOIN businesses b ON b.id = c.business_id
       WHERE c.deleted_at IS NULL AND ${filter}
       ORDER BY c.created_at DESC
       LIMIT 200`,
    )
    .all<AdminReport>();

  return result.results ?? [];
}

export async function setReportArchived(
  crimeId: string,
  adminId: string,
  archived: boolean,
): Promise<AdminReport | null> {
  const db = await getDb();

  if (archived) {
    const result = await db
      .prepare(
        `UPDATE crimes
         SET archived_at = datetime('now'), archived_by = ?, updated_at = datetime('now')
         WHERE id = ? AND deleted_at IS NULL`,
      )
      .bind(adminId, crimeId)
      .run();

    if (!result.meta.changes) return null;
  } else {
    const result = await db
      .prepare(
        `UPDATE crimes
         SET archived_at = NULL, archived_by = NULL, updated_at = datetime('now')
         WHERE id = ? AND deleted_at IS NULL`,
      )
      .bind(crimeId)
      .run();

    if (!result.meta.changes) return null;
  }

  return db
    .prepare(
      `SELECT c.*, b.business_name
       FROM crimes c
       JOIN businesses b ON b.id = c.business_id
       WHERE c.id = ?`,
    )
    .bind(crimeId)
    .first<AdminReport>();
}

export async function listAdminComments(
  type?: "report" | "article",
): Promise<AdminComment[]> {
  const db = await getDb();
  const comments: AdminComment[] = [];

  if (!type || type === "report") {
    const reportRows = await db
      .prepare(
        `SELECT rc.id, rc.body, rc.created_at, rc.business_id, rc.deleted_at,
                b.business_name, rc.crime_id as parent_id, c.title as parent_title
         FROM report_comments rc
         JOIN businesses b ON b.id = rc.business_id
         JOIN crimes c ON c.id = rc.crime_id
         WHERE rc.deleted_at IS NULL
         ORDER BY rc.created_at DESC
         LIMIT 100`,
      )
      .all<{
        id: string;
        body: string;
        created_at: string;
        business_id: string;
        business_name: string;
        parent_id: string;
        parent_title: string;
        deleted_at: string | null;
      }>();

    for (const row of reportRows.results ?? []) {
      comments.push({ ...row, type: "report" });
    }
  }

  if (!type || type === "article") {
    const articleRows = await db
      .prepare(
        `SELECT ac.id, ac.body, ac.created_at, ac.business_id, ac.deleted_at,
                b.business_name, ac.article_id as parent_id, sa.title as parent_title
         FROM article_comments ac
         JOIN businesses b ON b.id = ac.business_id
         JOIN safety_articles sa ON sa.id = ac.article_id
         WHERE ac.deleted_at IS NULL
         ORDER BY ac.created_at DESC
         LIMIT 100`,
      )
      .all<{
        id: string;
        body: string;
        created_at: string;
        business_id: string;
        business_name: string;
        parent_id: string;
        parent_title: string;
        deleted_at: string | null;
      }>();

    for (const row of articleRows.results ?? []) {
      comments.push({ ...row, type: "article" });
    }
  }

  return comments.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export async function moderateComment(
  commentId: string,
  type: "report" | "article",
  adminId: string,
): Promise<AdminComment | null> {
  const db = await getDb();
  const table = type === "report" ? "report_comments" : "article_comments";

  const result = await db
    .prepare(
      `UPDATE ${table}
       SET deleted_at = datetime('now'), deleted_by = ?, updated_at = datetime('now')
       WHERE id = ? AND deleted_at IS NULL`,
    )
    .bind(adminId, commentId)
    .run();

  if (!result.meta.changes) return null;

  if (type === "report") {
    const row = await db
      .prepare(
        `SELECT rc.id, rc.body, rc.created_at, rc.business_id, rc.deleted_at,
                b.business_name, rc.crime_id as parent_id, c.title as parent_title
         FROM report_comments rc
         JOIN businesses b ON b.id = rc.business_id
         JOIN crimes c ON c.id = rc.crime_id
         WHERE rc.id = ?`,
      )
      .bind(commentId)
      .first<AdminComment>();

    return row ? { ...row, type: "report" } : null;
  }

  const row = await db
    .prepare(
      `SELECT ac.id, ac.body, ac.created_at, ac.business_id, ac.deleted_at,
              b.business_name, ac.article_id as parent_id, sa.title as parent_title
       FROM article_comments ac
       JOIN businesses b ON b.id = ac.business_id
       JOIN safety_articles sa ON sa.id = ac.article_id
       WHERE ac.id = ?`,
    )
    .bind(commentId)
    .first<AdminComment>();

  return row ? { ...row, type: "article" } : null;
}

export async function listAdminBusinesses(): Promise<Business[]> {
  const db = await getDb();
  const result = await db
    .prepare(
      `SELECT id, business_name, phone, email, suburb, active, is_admin, contact_list_visible, created_at
       FROM businesses
       ORDER BY active ASC, business_name COLLATE NOCASE ASC`,
    )
    .all<Business>();

  return result.results ?? [];
}

export async function addAdminBusiness(input: {
  businessName: string;
  phone: string;
  email: string;
  suburb?: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const phone = normalizePhone(input.phone);
  if (!phone) {
    return { ok: false, error: "Enter a valid Australian mobile number." };
  }

  if (!input.businessName.trim() || !input.email.trim()) {
    return { ok: false, error: "Business name and email are required." };
  }

  const db = await getDb();
  const id = generateId("biz");

  try {
    await db
      .prepare(
        "INSERT INTO businesses (id, business_name, phone, email, suburb, active) VALUES (?, ?, ?, ?, ?, 1)",
      )
      .bind(
        id,
        input.businessName.trim(),
        phone,
        input.email.trim().toLowerCase(),
        input.suburb?.trim() ?? null,
      )
      .run();
  } catch {
    return { ok: false, error: "Could not add business. Phone may already exist." };
  }

  return { ok: true, id };
}

export async function setBusinessActive(
  businessId: string,
  active: boolean,
): Promise<Business | null> {
  const db = await getDb();
  const activeValue = active ? 1 : 0;

  const result = await db
    .prepare("UPDATE businesses SET active = ? WHERE id = ?")
    .bind(activeValue, businessId)
    .run();

  if (!result.meta.changes) return null;

  if (!active) {
    await db
      .prepare("DELETE FROM sessions WHERE business_id = ?")
      .bind(businessId)
      .run();
  }

  return db
    .prepare(
      "SELECT id, business_name, phone, email, suburb, active, is_admin, contact_list_visible, created_at FROM businesses WHERE id = ?",
    )
    .bind(businessId)
    .first<Business>();
}

export async function setBusinessAdmin(
  targetBusinessId: string,
  isAdmin: boolean,
): Promise<Business | null> {
  const db = await getDb();

  const target = await db
    .prepare("SELECT id, phone FROM businesses WHERE id = ?")
    .bind(targetBusinessId)
    .first<{ id: string; phone: string }>();

  if (!target) return null;

  if (target.phone === MASTER_PHONE && !isAdmin) {
    return null;
  }

  const result = await db
    .prepare("UPDATE businesses SET is_admin = ? WHERE id = ?")
    .bind(isAdmin ? 1 : 0, targetBusinessId)
    .run();

  if (!result.meta.changes) return null;

  return db
    .prepare(
      "SELECT id, business_name, phone, email, suburb, active, is_admin, contact_list_visible, created_at FROM businesses WHERE id = ?",
    )
    .bind(targetBusinessId)
    .first<Business>();
}

export async function getBusinessById(businessId: string): Promise<Business | null> {
  const db = await getDb();
  return db
    .prepare(
      "SELECT id, business_name, phone, email, suburb, active, is_admin, contact_list_visible, created_at FROM businesses WHERE id = ?",
    )
    .bind(businessId)
    .first<Business>();
}
