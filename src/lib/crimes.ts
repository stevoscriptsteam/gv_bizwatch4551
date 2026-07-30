import type { Alert, Crime, ReportStats } from "@/lib/types";
import { getDb, runInBackground } from "@/lib/cloudflare";
import { generateId } from "@/lib/auth";
import { sendCrimeAlertSmsFanout } from "@/lib/notifications";

export async function listCrimesForArea(): Promise<Crime[]> {
  const db = await getDb();
  const result = await db
    .prepare(
      `SELECT c.*, b.business_name, m.name as member_name
       FROM crimes c
       JOIN businesses b ON b.id = c.business_id
       LEFT JOIN business_members m ON m.id = c.member_id
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
      `SELECT c.*, b.business_name, m.name as member_name
       FROM crimes c
       JOIN businesses b ON b.id = c.business_id
       LEFT JOIN business_members m ON m.id = c.member_id
       WHERE c.business_id = ? AND c.deleted_at IS NULL AND c.archived_at IS NULL
       ORDER BY c.created_at DESC`,
    )
    .bind(businessId)
    .all<Crime>();

  return result.results ?? [];
}

export async function createCrime(input: {
  businessId: string;
  memberId?: string | null;
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
       (id, business_id, member_id, title, description, crime_type, location, suburb, postcode,
        address, latitude, longitude, category_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      crimeId,
      input.businessId,
      input.memberId ?? null,
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

  const alertMessage = `Reported ${input.crimeType} near ${input.address}, ${input.suburb}. Information submitted to BizWatch.`;

  // Fan out alerts to every other active business in a single statement
  // instead of one INSERT round trip per business.
  await db
    .prepare(
      `INSERT INTO alerts (id, business_id, crime_id, message)
       SELECT 'alert-' || lower(hex(randomblob(8))), id, ?, ?
       FROM businesses
       WHERE active = 1 AND id != ?`,
    )
    .bind(crimeId, alertMessage, input.businessId)
    .run();

  // SMS alerts to opted-in businesses, sent after the response returns.
  await runInBackground(() =>
    sendCrimeAlertSmsFanout({
      reporterBusinessId: input.businessId,
      categoryId: input.categoryId ?? null,
      suburb: input.suburb || null,
    }),
  );

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

  const [allTimeRes, last24Res, topSuburbRes] = await db.batch<{
    suburb?: string;
    count: number;
  }>([
    db.prepare(
      `SELECT COUNT(*) as count FROM crimes
       WHERE postcode = '4551' AND deleted_at IS NULL AND archived_at IS NULL`,
    ),
    db.prepare(
      `SELECT COUNT(*) as count FROM crimes
       WHERE postcode = '4551' AND deleted_at IS NULL AND archived_at IS NULL
         AND created_at > datetime('now', '-24 hours')`,
    ),
    db.prepare(
      `SELECT suburb, COUNT(*) as count FROM crimes
       WHERE postcode = '4551' AND deleted_at IS NULL AND archived_at IS NULL
         AND suburb IS NOT NULL AND TRIM(suburb) != ''
       GROUP BY suburb
       ORDER BY count DESC, suburb ASC
       LIMIT 1`,
    ),
  ]);

  const topSuburbRow = topSuburbRes.results?.[0];

  return {
    allTime: allTimeRes.results?.[0]?.count ?? 0,
    last24Hours: last24Res.results?.[0]?.count ?? 0,
    topSuburb: topSuburbRow?.suburb
      ? { suburb: topSuburbRow.suburb, count: topSuburbRow.count }
      : null,
  };
}
