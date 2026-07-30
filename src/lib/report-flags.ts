import type { Crime } from "@/lib/types";
import { REPORT_FLAG_AUTO_ARCHIVE_THRESHOLD } from "@/lib/types";
import { getDb } from "@/lib/cloudflare";
import { generateId } from "@/lib/auth";

export type FlagResult = {
  flagCount: number;
  userHasFlagged: boolean;
  archived: boolean;
};

export async function getFlagState(
  crimeId: string,
  viewerBusinessId: string,
): Promise<{ flagCount: number; userHasFlagged: boolean }> {
  const db = await getDb();
  const [countRow, ownRow] = await Promise.all([
    db
      .prepare("SELECT COUNT(*) as count FROM report_flags WHERE crime_id = ?")
      .bind(crimeId)
      .first<{ count: number }>(),
    db
      .prepare(
        "SELECT id FROM report_flags WHERE crime_id = ? AND business_id = ? LIMIT 1",
      )
      .bind(crimeId, viewerBusinessId)
      .first<{ id: string }>(),
  ]);

  return {
    flagCount: countRow?.count ?? 0,
    userHasFlagged: !!ownRow,
  };
}

export async function enrichCrimesWithFlags(
  crimes: Crime[],
  viewerBusinessId: string,
): Promise<Crime[]> {
  if (crimes.length === 0) return crimes;

  const db = await getDb();
  const ids = crimes.map((crime) => crime.id);
  const placeholders = ids.map(() => "?").join(", ");

  const [countRes, ownRes] = await db.batch<{
    crime_id: string;
    count?: number;
  }>([
    db
      .prepare(
        `SELECT crime_id, COUNT(*) as count
         FROM report_flags
         WHERE crime_id IN (${placeholders})
         GROUP BY crime_id`,
      )
      .bind(...ids),
    db
      .prepare(
        `SELECT crime_id
         FROM report_flags
         WHERE business_id = ? AND crime_id IN (${placeholders})`,
      )
      .bind(viewerBusinessId, ...ids),
  ]);

  const countMap = new Map<string, number>();
  for (const row of countRes.results ?? []) {
    countMap.set(row.crime_id, row.count ?? 0);
  }

  const ownSet = new Set((ownRes.results ?? []).map((row) => row.crime_id));

  return crimes.map((crime) => ({
    ...crime,
    flag_count: countMap.get(crime.id) ?? 0,
    user_has_flagged: ownSet.has(crime.id),
  }));
}

export async function flagCrime(
  crimeId: string,
  businessId: string,
): Promise<
  | { ok: true; result: FlagResult }
  | { ok: false; error: string; status: number }
> {
  const db = await getDb();

  const crime = await db
    .prepare(
      `SELECT id, business_id, deleted_at, archived_at
       FROM crimes
       WHERE id = ?`,
    )
    .bind(crimeId)
    .first<{
      id: string;
      business_id: string;
      deleted_at: string | null;
      archived_at: string | null;
    }>();

  if (!crime || crime.deleted_at) {
    return { ok: false, error: "Report not found.", status: 404 };
  }
  if (crime.archived_at) {
    return { ok: false, error: "This report is no longer available.", status: 404 };
  }
  if (crime.business_id === businessId) {
    return {
      ok: false,
      error: "You cannot flag your own report.",
      status: 400,
    };
  }

  const existing = await db
    .prepare(
      "SELECT id FROM report_flags WHERE crime_id = ? AND business_id = ? LIMIT 1",
    )
    .bind(crimeId, businessId)
    .first<{ id: string }>();

  if (existing) {
    const state = await getFlagState(crimeId, businessId);
    return {
      ok: true,
      result: {
        flagCount: state.flagCount,
        userHasFlagged: true,
        archived: false,
      },
    };
  }

  try {
    await db
      .prepare(
        "INSERT INTO report_flags (id, crime_id, business_id) VALUES (?, ?, ?)",
      )
      .bind(generateId("flag"), crimeId, businessId)
      .run();
  } catch {
    return { ok: false, error: "Could not flag this report.", status: 500 };
  }

  const state = await getFlagState(crimeId, businessId);
  let archived = false;

  if (state.flagCount >= REPORT_FLAG_AUTO_ARCHIVE_THRESHOLD) {
    const archiveResult = await db
      .prepare(
        `UPDATE crimes
         SET archived_at = datetime('now'),
             archived_by = 'system:community_flags',
             archive_reason = 'community_flags',
             updated_at = datetime('now')
         WHERE id = ? AND deleted_at IS NULL AND archived_at IS NULL`,
      )
      .bind(crimeId)
      .run();
    archived = (archiveResult.meta.changes ?? 0) > 0;
  }

  return {
    ok: true,
    result: {
      flagCount: state.flagCount,
      userHasFlagged: true,
      archived,
    },
  };
}

export async function unflagCrime(
  crimeId: string,
  businessId: string,
): Promise<
  | { ok: true; result: FlagResult }
  | { ok: false; error: string; status: number }
> {
  const db = await getDb();

  const crime = await db
    .prepare(
      `SELECT id, deleted_at, archived_at FROM crimes WHERE id = ?`,
    )
    .bind(crimeId)
    .first<{ id: string; deleted_at: string | null; archived_at: string | null }>();

  if (!crime || crime.deleted_at || crime.archived_at) {
    return { ok: false, error: "Report not found.", status: 404 };
  }

  await db
    .prepare(
      "DELETE FROM report_flags WHERE crime_id = ? AND business_id = ?",
    )
    .bind(crimeId, businessId)
    .run();

  const state = await getFlagState(crimeId, businessId);
  return {
    ok: true,
    result: {
      flagCount: state.flagCount,
      userHasFlagged: false,
      archived: false,
    },
  };
}
