import type { ReactionParticipant } from "@/lib/types";
import { getDb } from "@/lib/cloudflare";
import { generateId } from "@/lib/auth";

/**
 * Reports and safety articles share identical comment/reaction behaviour,
 * differing only in table and parent-column names. This module implements the
 * logic once; the table names come from the static configs below (never from
 * user input), so interpolating them into SQL is safe.
 */
export type EngagementConfig = {
  commentsTable: "report_comments" | "article_comments";
  reactionsTable: "report_reactions" | "article_reactions";
  parentColumn: "crime_id" | "article_id";
};

export const REPORT_ENGAGEMENT: EngagementConfig = {
  commentsTable: "report_comments",
  reactionsTable: "report_reactions",
  parentColumn: "crime_id",
};

export const ARTICLE_ENGAGEMENT: EngagementConfig = {
  commentsTable: "article_comments",
  reactionsTable: "article_reactions",
  parentColumn: "article_id",
};

export async function listEngagementComments<T extends { business_id: string }>(
  config: EngagementConfig,
  parentId: string,
  viewerBusinessId: string,
): Promise<(T & { is_own: boolean })[]> {
  const db = await getDb();
  const result = await db
    .prepare(
      `SELECT c.*, b.business_name, m.name as member_name
       FROM ${config.commentsTable} c
       JOIN businesses b ON b.id = c.business_id
       LEFT JOIN business_members m ON m.id = c.member_id
       WHERE c.${config.parentColumn} = ? AND c.deleted_at IS NULL
       ORDER BY c.created_at ASC`,
    )
    .bind(parentId)
    .all<T>();

  return (result.results ?? []).map((comment) => ({
    ...comment,
    is_own: comment.business_id === viewerBusinessId,
  }));
}

export async function addEngagementComment<T>(
  config: EngagementConfig,
  parentId: string,
  businessId: string,
  body: string,
  memberId?: string | null,
): Promise<(T & { is_own: true }) | null> {
  const db = await getDb();
  const commentId = generateId("comment");

  await db
    .prepare(
      `INSERT INTO ${config.commentsTable} (id, ${config.parentColumn}, business_id, member_id, body)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .bind(commentId, parentId, businessId, memberId ?? null, body)
    .run();

  const comment = await db
    .prepare(
      `SELECT c.*, b.business_name, m.name as member_name
       FROM ${config.commentsTable} c
       JOIN businesses b ON b.id = c.business_id
       LEFT JOIN business_members m ON m.id = c.member_id
       WHERE c.id = ?`,
    )
    .bind(commentId)
    .first<T>();

  if (!comment) return null;

  return { ...comment, is_own: true };
}

export async function updateEngagementComment(
  config: EngagementConfig,
  commentId: string,
  businessId: string,
  body: string,
): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .prepare(
      `UPDATE ${config.commentsTable}
       SET body = ?, updated_at = datetime('now')
       WHERE id = ? AND business_id = ? AND deleted_at IS NULL`,
    )
    .bind(body, commentId, businessId)
    .run();

  return (result.meta.changes ?? 0) > 0;
}

export async function deleteEngagementComment(
  config: EngagementConfig,
  commentId: string,
  businessId: string,
): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .prepare(
      `DELETE FROM ${config.commentsTable} WHERE id = ? AND business_id = ?`,
    )
    .bind(commentId, businessId)
    .run();

  return (result.meta.changes ?? 0) > 0;
}

export async function getEngagementReactionCounts<
  R extends string,
  C extends Record<R, number>,
>(
  config: EngagementConfig,
  parentId: string,
  emptyCounts: () => C,
): Promise<C> {
  const db = await getDb();
  const rows = await db
    .prepare(
      `SELECT reaction_type, COUNT(*) as count
       FROM ${config.reactionsTable}
       WHERE ${config.parentColumn} = ?
       GROUP BY reaction_type`,
    )
    .bind(parentId)
    .all<{ reaction_type: R; count: number }>();

  const counts = emptyCounts();
  for (const row of rows.results ?? []) {
    (counts as Record<string, number>)[row.reaction_type] = row.count;
  }

  return counts;
}

export async function setEngagementReaction<
  R extends string,
  C extends Record<R, number>,
>(
  config: EngagementConfig,
  parentId: string,
  businessId: string,
  reactionType: R | null,
  emptyCounts: () => C,
): Promise<{ counts: C; userReaction: R | null }> {
  const db = await getDb();
  let userReaction: R | null = reactionType;

  if (reactionType === null) {
    await db
      .prepare(
        `DELETE FROM ${config.reactionsTable}
         WHERE ${config.parentColumn} = ? AND business_id = ?`,
      )
      .bind(parentId, businessId)
      .run();
  } else {
    const existing = await db
      .prepare(
        `SELECT id, reaction_type FROM ${config.reactionsTable}
         WHERE ${config.parentColumn} = ? AND business_id = ?`,
      )
      .bind(parentId, businessId)
      .first<{ id: string; reaction_type: R }>();

    if (existing?.reaction_type === reactionType) {
      await db
        .prepare(`DELETE FROM ${config.reactionsTable} WHERE id = ?`)
        .bind(existing.id)
        .run();
      userReaction = null;
    } else if (existing) {
      await db
        .prepare(
          `UPDATE ${config.reactionsTable}
           SET reaction_type = ?, created_at = datetime('now')
           WHERE id = ?`,
        )
        .bind(reactionType, existing.id)
        .run();
    } else {
      await db
        .prepare(
          `INSERT INTO ${config.reactionsTable}
           (id, ${config.parentColumn}, business_id, reaction_type)
           VALUES (?, ?, ?, ?)`,
        )
        .bind(generateId("reaction"), parentId, businessId, reactionType)
        .run();
    }
  }

  const counts = await getEngagementReactionCounts(config, parentId, emptyCounts);

  return { counts, userReaction };
}

export async function listEngagementReactors(
  config: EngagementConfig,
  parentId: string,
  viewerBusinessId: string,
): Promise<Record<string, ReactionParticipant[]>> {
  const db = await getDb();
  const rows = await db
    .prepare(
      `SELECT r.reaction_type, r.created_at, b.id as business_id, b.business_name
       FROM ${config.reactionsTable} r
       JOIN businesses b ON b.id = r.business_id
       WHERE r.${config.parentColumn} = ?
       ORDER BY r.created_at ASC`,
    )
    .bind(parentId)
    .all<{
      reaction_type: string;
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

export async function enrichWithEngagement<
  T extends { id: string },
  R extends string,
  C extends Record<R, number>,
>(
  config: EngagementConfig,
  items: T[],
  viewerBusinessId: string,
  emptyCounts: () => C,
): Promise<(T & { comment_count: number; reactions: C; user_reaction: R | null })[]> {
  if (items.length === 0) return [];

  const db = await getDb();
  const ids = items.map((item) => item.id);
  const placeholders = ids.map(() => "?").join(", ");
  const parent = config.parentColumn;

  // One network round trip for all three aggregate queries.
  const [commentRows, reactionRows, userReactionRows] = await db.batch<
    Record<string, string | number>
  >([
    db
      .prepare(
        `SELECT ${parent} as parent_id, COUNT(*) as count
         FROM ${config.commentsTable}
         WHERE ${parent} IN (${placeholders}) AND deleted_at IS NULL
         GROUP BY ${parent}`,
      )
      .bind(...ids),
    db
      .prepare(
        `SELECT ${parent} as parent_id, reaction_type, COUNT(*) as count
         FROM ${config.reactionsTable}
         WHERE ${parent} IN (${placeholders})
         GROUP BY ${parent}, reaction_type`,
      )
      .bind(...ids),
    db
      .prepare(
        `SELECT ${parent} as parent_id, reaction_type
         FROM ${config.reactionsTable}
         WHERE business_id = ? AND ${parent} IN (${placeholders})`,
      )
      .bind(viewerBusinessId, ...ids),
  ]);

  const commentMap = new Map(
    (commentRows.results ?? []).map((r) => [r.parent_id as string, r.count as number]),
  );

  const reactionMap = new Map<string, C>();
  for (const row of reactionRows.results ?? []) {
    const parentId = row.parent_id as string;
    const counts = reactionMap.get(parentId) ?? emptyCounts();
    (counts as Record<string, number>)[row.reaction_type as string] =
      row.count as number;
    reactionMap.set(parentId, counts);
  }

  const userReactionMap = new Map(
    (userReactionRows.results ?? []).map((r) => [
      r.parent_id as string,
      r.reaction_type as R,
    ]),
  );

  return items.map((item) => ({
    ...item,
    comment_count: commentMap.get(item.id) ?? 0,
    reactions: reactionMap.get(item.id) ?? emptyCounts(),
    user_reaction: userReactionMap.get(item.id) ?? null,
  }));
}
