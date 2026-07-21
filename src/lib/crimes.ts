import type { Alert, Crime, ReportStats } from "@/lib/types";
import { getDb } from "@/lib/cloudflare";
import { generateId } from "@/lib/auth";

export async function listCrimesForArea(): Promise<Crime[]> {
  const db = await getDb();
  const result = await db
    .prepare(
      `SELECT c.*, b.business_name
       FROM crimes c
       JOIN businesses b ON b.id = c.business_id
       WHERE c.postcode = '4551' AND c.deleted_at IS NULL AND c.archived_at IS NULL
       ORDER BY c.created_at DESC
       LIMIT 100`,
    )
    .all<Crime>();

  return result.results ?? [];
}

export async function listCrimesForBusiness(
  businessId: string,
): Promise<Crime[]> {
  const db = await getDb();
  const result = await db
    .prepare(
      `SELECT c.*, b.business_name
       FROM crimes c
       JOIN businesses b ON b.id = c.business_id
       WHERE c.business_id = ? AND c.deleted_at IS NULL AND c.archived_at IS NULL
       ORDER BY c.created_at DESC`,
    )
    .bind(businessId)
    .all<Crime>();

  return result.results ?? [];
}

export async function createCrime(input: {
  businessId: string;
  title: string;
  description: string;
  crimeType: string;
  address: string;
  suburb: string;
  latitude?: number | null;
  longitude?: number | null;
  categoryId?: string;
  postcode?: string;
}) {
  const db = await getDb();
  const crimeId = generateId("crime");
  const postcode = input.postcode ?? "4551";

  await db
    .prepare(
      `INSERT INTO crimes
       (id, business_id, title, description, crime_type, location, suburb, postcode,
        address, latitude, longitude, category_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      crimeId,
      input.businessId,
      input.title,
      input.description,
      input.crimeType,
      input.address,
      input.suburb,
      postcode,
      input.address,
      input.latitude ?? null,
      input.longitude ?? null,
      input.categoryId ?? null,
    )
    .run();

  const businesses = await db
    .prepare("SELECT id FROM businesses WHERE active = 1 AND id != ?")
    .bind(input.businessId)
    .all<{ id: string }>();

  const alertMessage = `Reported ${input.crimeType} near ${input.address}, ${input.suburb}. Information submitted to BizWatch.`;

  for (const biz of businesses.results ?? []) {
    await db
      .prepare(
        "INSERT INTO alerts (id, business_id, crime_id, message) VALUES (?, ?, ?, ?)",
      )
      .bind(generateId("alert"), biz.id, crimeId, alertMessage)
      .run();
  }

  return crimeId;
}

export async function listAlerts(businessId: string): Promise<Alert[]> {
  const db = await getDb();
  const result = await db
    .prepare(
      `SELECT a.*, c.title as crime_title, c.crime_type
       FROM alerts a
       JOIN crimes c ON c.id = a.crime_id
       WHERE a.business_id = ?
         AND c.deleted_at IS NULL
         AND c.archived_at IS NULL
       ORDER BY a.created_at DESC
       LIMIT 50`,
    )
    .bind(businessId)
    .all<Alert>();

  return result.results ?? [];
}

export async function markAlertRead(alertId: string, businessId: string) {
  const db = await getDb();
  await db
    .prepare(
      "UPDATE alerts SET read = 1 WHERE id = ? AND business_id = ?",
    )
    .bind(alertId, businessId)
    .run();
}

export async function markAllAlertsRead(businessId: string) {
  const db = await getDb();
  await db
    .prepare("UPDATE alerts SET read = 1 WHERE business_id = ? AND read = 0")
    .bind(businessId)
    .run();
}

export async function countUnreadAlerts(businessId: string): Promise<number> {
  const db = await getDb();
  const row = await db
    .prepare(
      "SELECT COUNT(*) as count FROM alerts WHERE business_id = ? AND read = 0",
    )
    .bind(businessId)
    .first<{ count: number }>();

  return row?.count ?? 0;
}

export async function getReportStats(): Promise<ReportStats> {
  const db = await getDb();

  const allTimeRow = await db
    .prepare(
      `SELECT COUNT(*) as count FROM crimes
       WHERE postcode = '4551' AND deleted_at IS NULL AND archived_at IS NULL`,
    )
    .first<{ count: number }>();

  const last24Row = await db
    .prepare(
      `SELECT COUNT(*) as count FROM crimes
       WHERE postcode = '4551' AND deleted_at IS NULL AND archived_at IS NULL
         AND created_at > datetime('now', '-24 hours')`,
    )
    .first<{ count: number }>();

  const topSuburbRow = await db
    .prepare(
      `SELECT suburb, COUNT(*) as count FROM crimes
       WHERE postcode = '4551' AND deleted_at IS NULL AND archived_at IS NULL
         AND suburb IS NOT NULL AND TRIM(suburb) != ''
       GROUP BY suburb
       ORDER BY count DESC, suburb ASC
       LIMIT 1`,
    )
    .first<{ suburb: string; count: number }>();

  return {
    allTime: allTimeRow?.count ?? 0,
    last24Hours: last24Row?.count ?? 0,
    topSuburb: topSuburbRow
      ? { suburb: topSuburbRow.suburb, count: topSuburbRow.count }
      : null,
  };
}
