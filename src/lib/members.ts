import type { Business } from "@/lib/types";
import { getDb } from "@/lib/cloudflare";
import { generateId } from "@/lib/auth";
import { getActiveBusinessByPhone, getBusinessByPhone } from "@/lib/businesses";
import { normalizePhone } from "@/lib/phone";

export const MAX_TEAM_MEMBERS = 10;

export type TeamMember = {
  id: string;
  business_id: string;
  name: string;
  phone: string;
  is_admin: number;
  created_at: string;
};

export type ResolvedAccount = {
  business: Business;
  member: { id: string; name: string } | null;
};

/**
 * Sign-in accepts either the business owner's phone or a team member's phone.
 * The owner takes precedence if a phone somehow exists in both tables.
 */
export async function resolveAccountByPhone(
  phone: string,
): Promise<ResolvedAccount | null> {
  const business = await getActiveBusinessByPhone(phone);
  if (business) {
    return { business, member: null };
  }

  const db = await getDb();
  const row = await db
    .prepare(
      `SELECT b.*, m.id as resolved_member_id, m.name as resolved_member_name
       FROM business_members m
       JOIN businesses b ON b.id = m.business_id
       WHERE m.phone = ? AND m.active = 1 AND b.active = 1
       LIMIT 1`,
    )
    .bind(phone)
    .first<Business & { resolved_member_id: string; resolved_member_name: string }>();

  if (!row) return null;

  const { resolved_member_id, resolved_member_name, ...businessRow } = row;
  return {
    business: businessRow,
    member: { id: resolved_member_id, name: resolved_member_name },
  };
}

export async function getActiveMemberByPhone(
  phone: string,
): Promise<TeamMember | null> {
  const db = await getDb();
  return db
    .prepare(
      `SELECT id, business_id, name, phone, is_admin, created_at
       FROM business_members WHERE phone = ? AND active = 1 LIMIT 1`,
    )
    .bind(phone)
    .first<TeamMember>();
}

export async function listMembers(businessId: string): Promise<TeamMember[]> {
  const db = await getDb();
  const result = await db
    .prepare(
      `SELECT id, business_id, name, phone, is_admin, created_at
       FROM business_members
       WHERE business_id = ? AND active = 1
       ORDER BY name COLLATE NOCASE ASC`,
    )
    .bind(businessId)
    .all<TeamMember>();

  return result.results ?? [];
}

export async function addMember(
  businessId: string,
  input: { name: string; phone: string; isAdmin?: boolean },
): Promise<{ ok: true; member: TeamMember } | { ok: false; error: string }> {
  const name = input.name.trim();
  if (!name) {
    return { ok: false, error: "Enter the team member's name." };
  }
  if (name.length > 100) {
    return { ok: false, error: "Name is too long (max 100 characters)." };
  }

  const phone = normalizePhone(input.phone);
  if (!phone) {
    return { ok: false, error: "Enter a valid Australian mobile number." };
  }

  const existingBusiness = await getBusinessByPhone(phone);
  if (existingBusiness) {
    return {
      ok: false,
      error: "This mobile number is already registered to a business account.",
    };
  }

  const existingMember = await getActiveMemberByPhone(phone);
  if (existingMember) {
    return {
      ok: false,
      error: "This mobile number is already a team member on an account.",
    };
  }

  const members = await listMembers(businessId);
  if (members.length >= MAX_TEAM_MEMBERS) {
    return {
      ok: false,
      error: `You can add up to ${MAX_TEAM_MEMBERS} team members.`,
    };
  }

  const isAdmin = input.isAdmin ? 1 : 0;
  const db = await getDb();

  // Rows are soft-deleted on removal (to keep comment attribution), so the
  // phone may still exist as an inactive member. Reactivate it in that case
  // instead of violating the UNIQUE(phone) constraint.
  const inactive = await db
    .prepare(
      "SELECT id FROM business_members WHERE phone = ? AND active = 0 LIMIT 1",
    )
    .bind(phone)
    .first<{ id: string }>();

  let id: string;

  try {
    if (inactive) {
      id = inactive.id;
      await db
        .prepare(
          `UPDATE business_members
           SET business_id = ?, name = ?, is_admin = ?, active = 1,
               created_at = datetime('now')
           WHERE id = ?`,
        )
        .bind(businessId, name, isAdmin, id)
        .run();
    } else {
      id = generateId("member");
      await db
        .prepare(
          `INSERT INTO business_members (id, business_id, name, phone, is_admin)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .bind(id, businessId, name, phone, isAdmin)
        .run();
    }
  } catch {
    return { ok: false, error: "Could not add team member. Please try again." };
  }

  const member = await db
    .prepare(
      `SELECT id, business_id, name, phone, is_admin, created_at
       FROM business_members WHERE id = ?`,
    )
    .bind(id)
    .first<TeamMember>();

  if (!member) {
    return { ok: false, error: "Could not add team member. Please try again." };
  }

  return { ok: true, member };
}

export async function setMemberAdmin(
  businessId: string,
  memberId: string,
  isAdmin: boolean,
): Promise<TeamMember | null> {
  const db = await getDb();
  const result = await db
    .prepare(
      `UPDATE business_members SET is_admin = ?
       WHERE id = ? AND business_id = ? AND active = 1`,
    )
    .bind(isAdmin ? 1 : 0, memberId, businessId)
    .run();

  if (!result.meta.changes) return null;

  return db
    .prepare(
      `SELECT id, business_id, name, phone, is_admin, created_at
       FROM business_members WHERE id = ?`,
    )
    .bind(memberId)
    .first<TeamMember>();
}

export async function removeMember(
  businessId: string,
  memberId: string,
): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .prepare(
      `UPDATE business_members SET active = 0, is_admin = 0
       WHERE id = ? AND business_id = ? AND active = 1`,
    )
    .bind(memberId, businessId)
    .run();

  if (!result.meta.changes) return false;

  // End any active sessions the removed member had.
  await db
    .prepare("DELETE FROM sessions WHERE member_id = ?")
    .bind(memberId)
    .run();

  return true;
}
