import type {
  Crime,
  ReactionCounts,
  ReactionParticipant,
  ReactionType,
  ReportComment,
} from "@/lib/types";
import { emptyReactionCounts } from "@/lib/types";
import { getDb } from "@/lib/cloudflare";
import { generateId } from "@/lib/auth";

export async function getCrimeById(crimeId: string): Promise<Crime | null> {
  const db = await getDb();
  return db
    .prepare(
      `SELECT c.*, b.business_name
       FROM crimes c
       JOIN businesses b ON b.id = c.business_id
       WHERE c.id = ? AND c.deleted_at IS NULL AND c.archived_at IS NULL`,
    )
    .bind(crimeId)
    .first<Crime>();
}

export async function updateCrime(
  crimeId: string,
  businessId: string,
  input: {
    title: string;
    description: string;
    address: string;
    suburb: string;
  },
): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .prepare(
      `UPDATE crimes
       SET title = ?, description = ?, location = ?, address = ?, suburb = ?,
           updated_at = datetime('now')
       WHERE id = ? AND business_id = ? AND deleted_at IS NULL`,
    )
    .bind(
      input.title,
      input.description,
      input.address,
      input.address,
      input.suburb,
      crimeId,
      businessId,
    )
    .run();

  return (result.meta.changes ?? 0) > 0;
}

export async function deleteCrime(
  crimeId: string,
  businessId: string,
): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .prepare(
      `UPDATE crimes SET deleted_at = datetime('now'), updated_at = datetime('now')
       WHERE id = ? AND business_id = ? AND deleted_at IS NULL`,
    )
    .bind(crimeId, businessId)
    .run();

  return (result.meta.changes ?? 0) > 0;
}

export async function enrichCrimesWithEngagement(
  crimes: Crime[],
  viewerBusinessId: string,
): Promise<Crime[]> {
  if (crimes.length === 0) return crimes;

  const db = await getDb();
  const ids = crimes.map((c) => c.id);
  const placeholders = ids.map(() => "?").join(", ");

  const commentRows = await db
    .prepare(
      `SELECT crime_id, COUNT(*) as count
       FROM report_comments
       WHERE crime_id IN (${placeholders}) AND deleted_at IS NULL
       GROUP BY crime_id`,
    )
    .bind(...ids)
    .all<{ crime_id: string; count: number }>();

  const reactionRows = await db
    .prepare(
      `SELECT crime_id, reaction_type, COUNT(*) as count
       FROM report_reactions
       WHERE crime_id IN (${placeholders})
       GROUP BY crime_id, reaction_type`,
    )
    .bind(...ids)
    .all<{ crime_id: string; reaction_type: ReactionType; count: number }>();

  const userReactionRows = await db
    .prepare(
      `SELECT crime_id, reaction_type
       FROM report_reactions
       WHERE business_id = ? AND crime_id IN (${placeholders})`,
    )
    .bind(viewerBusinessId, ...ids)
    .all<{ crime_id: string; reaction_type: ReactionType }>();

  const commentMap = new Map(
    (commentRows.results ?? []).map((r) => [r.crime_id, r.count]),
  );

  const reactionMap = new Map<string, ReactionCounts>();
  for (const row of reactionRows.results ?? []) {
    const counts = reactionMap.get(row.crime_id) ?? emptyReactionCounts();
    counts[row.reaction_type] = row.count;
    reactionMap.set(row.crime_id, counts);
  }

  const userReactionMap = new Map(
    (userReactionRows.results ?? []).map((r) => [r.crime_id, r.reaction_type]),
  );

  return crimes.map((crime) => ({
    ...crime,
    comment_count: commentMap.get(crime.id) ?? 0,
    reactions: reactionMap.get(crime.id) ?? emptyReactionCounts(),
    user_reaction: userReactionMap.get(crime.id) ?? null,
    is_owner: crime.business_id === viewerBusinessId,
  }));
}

export async function listComments(
  crimeId: string,
  viewerBusinessId: string,
): Promise<ReportComment[]> {
  const db = await getDb();
  const result = await db
    .prepare(
      `SELECT rc.*, b.business_name
       FROM report_comments rc
       JOIN businesses b ON b.id = rc.business_id
       WHERE rc.crime_id = ? AND rc.deleted_at IS NULL
       ORDER BY rc.created_at ASC`,
    )
    .bind(crimeId)
    .all<ReportComment>();

  return (result.results ?? []).map((comment) => ({
    ...comment,
    is_own: comment.business_id === viewerBusinessId,
  }));
}

export async function addComment(
  crimeId: string,
  businessId: string,
  body: string,
): Promise<ReportComment | null> {
  const crime = await getCrimeById(crimeId);
  if (!crime) return null;

  const db = await getDb();
  const commentId = generateId("comment");

  await db
    .prepare(
      `INSERT INTO report_comments (id, crime_id, business_id, body)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(commentId, crimeId, businessId, body)
    .run();

  const comment = await db
    .prepare(
      `SELECT rc.*, b.business_name
       FROM report_comments rc
       JOIN businesses b ON b.id = rc.business_id
       WHERE rc.id = ?`,
    )
    .bind(commentId)
    .first<ReportComment>();

  if (!comment) return null;

  return { ...comment, is_own: true };
}

export async function updateComment(
  commentId: string,
  businessId: string,
  body: string,
): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .prepare(
      `UPDATE report_comments
       SET body = ?, updated_at = datetime('now')
       WHERE id = ? AND business_id = ? AND deleted_at IS NULL`,
    )
    .bind(body, commentId, businessId)
    .run();

  return (result.meta.changes ?? 0) > 0;
}

export async function deleteComment(
  commentId: string,
  businessId: string,
): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .prepare("DELETE FROM report_comments WHERE id = ? AND business_id = ?")
    .bind(commentId, businessId)
    .run();

  return (result.meta.changes ?? 0) > 0;
}

export async function setReaction(
  crimeId: string,
  businessId: string,
  reactionType: ReactionType | null,
): Promise<{ counts: ReactionCounts; userReaction: ReactionType | null } | null> {
  const crime = await getCrimeById(crimeId);
  if (!crime) return null;

  const db = await getDb();
  let userReaction: ReactionType | null = reactionType;

  if (reactionType === null) {
    await db
      .prepare(
        "DELETE FROM report_reactions WHERE crime_id = ? AND business_id = ?",
      )
      .bind(crimeId, businessId)
      .run();
    userReaction = null;
  } else {
    const existing = await db
      .prepare(
        "SELECT id, reaction_type FROM report_reactions WHERE crime_id = ? AND business_id = ?",
      )
      .bind(crimeId, businessId)
      .first<{ id: string; reaction_type: ReactionType }>();

    if (existing?.reaction_type === reactionType) {
      await db
        .prepare("DELETE FROM report_reactions WHERE id = ?")
        .bind(existing.id)
        .run();
      userReaction = null;
    } else if (existing) {
      await db
        .prepare(
          "UPDATE report_reactions SET reaction_type = ?, created_at = datetime('now') WHERE id = ?",
        )
        .bind(reactionType, existing.id)
        .run();
    } else {
      await db
        .prepare(
          `INSERT INTO report_reactions (id, crime_id, business_id, reaction_type)
           VALUES (?, ?, ?, ?)`,
        )
        .bind(generateId("reaction"), crimeId, businessId, reactionType)
        .run();
    }
  }

  const counts = await getReactionCounts(crimeId);

  return { counts, userReaction };
}

export async function getReactionCounts(
  crimeId: string,
): Promise<ReactionCounts> {
  const db = await getDb();
  const rows = await db
    .prepare(
      `SELECT reaction_type, COUNT(*) as count
       FROM report_reactions
       WHERE crime_id = ?
       GROUP BY reaction_type`,
    )
    .bind(crimeId)
    .all<{ reaction_type: ReactionType; count: number }>();

  const counts = emptyReactionCounts();
  for (const row of rows.results ?? []) {
    counts[row.reaction_type] = row.count;
  }

  return counts;
}

export async function listReportReactors(
  crimeId: string,
  viewerBusinessId: string,
): Promise<Record<string, ReactionParticipant[]> | null> {
  const crime = await getCrimeById(crimeId);
  if (!crime) return null;

  const db = await getDb();
  const rows = await db
    .prepare(
      `SELECT rr.reaction_type, rr.created_at, b.id as business_id, b.business_name
       FROM report_reactions rr
       JOIN businesses b ON b.id = rr.business_id
       WHERE rr.crime_id = ?
       ORDER BY rr.created_at ASC`,
    )
    .bind(crimeId)
    .all<{
      reaction_type: ReactionType;
      created_at: string;
      business_id: string;
      business_name: string;
    }>();

  const grouped: Record<string, ReactionParticipant[]> = {};

  for (const row of rows.results ?? []) {
    const list = grouped[row.reaction_type] ?? [];
    list.push({
      business_id: row.business_id,
      business_name: row.business_name,
      created_at: row.created_at,
      is_own: row.business_id === viewerBusinessId,
    });
    grouped[row.reaction_type] = list;
  }

  return grouped;
}
