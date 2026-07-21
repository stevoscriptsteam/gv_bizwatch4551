import type {
  ArticleComment,
  ArticleReactionCounts,
  ArticleReactionType,
  ReactionParticipant,
} from "@/lib/types";
import { emptyArticleReactionCounts } from "@/lib/types";
import { getDb } from "@/lib/cloudflare";
import { generateId } from "@/lib/auth";
import { getArticleById } from "@/lib/safety-articles";

export async function listArticleComments(
  articleId: string,
  viewerBusinessId: string,
): Promise<ArticleComment[]> {
  const db = await getDb();
  const result = await db
    .prepare(
      `SELECT ac.*, b.business_name
       FROM article_comments ac
       JOIN businesses b ON b.id = ac.business_id
       WHERE ac.article_id = ? AND ac.deleted_at IS NULL
       ORDER BY ac.created_at ASC`,
    )
    .bind(articleId)
    .all<ArticleComment>();

  return (result.results ?? []).map((comment) => ({
    ...comment,
    is_own: comment.business_id === viewerBusinessId,
  }));
}

export async function addArticleComment(
  articleId: string,
  businessId: string,
  body: string,
): Promise<ArticleComment | null> {
  const article = await getArticleById(articleId);
  if (!article) return null;

  const db = await getDb();
  const commentId = generateId("comment");

  await db
    .prepare(
      `INSERT INTO article_comments (id, article_id, business_id, body)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(commentId, articleId, businessId, body)
    .run();

  const comment = await db
    .prepare(
      `SELECT ac.*, b.business_name
       FROM article_comments ac
       JOIN businesses b ON b.id = ac.business_id
       WHERE ac.id = ?`,
    )
    .bind(commentId)
    .first<ArticleComment>();

  if (!comment) return null;

  return { ...comment, is_own: true };
}

export async function updateArticleComment(
  commentId: string,
  businessId: string,
  body: string,
): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .prepare(
      `UPDATE article_comments
       SET body = ?, updated_at = datetime('now')
       WHERE id = ? AND business_id = ? AND deleted_at IS NULL`,
    )
    .bind(body, commentId, businessId)
    .run();

  return (result.meta.changes ?? 0) > 0;
}

export async function deleteArticleComment(
  commentId: string,
  businessId: string,
): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .prepare("DELETE FROM article_comments WHERE id = ? AND business_id = ?")
    .bind(commentId, businessId)
    .run();

  return (result.meta.changes ?? 0) > 0;
}

export async function setArticleReaction(
  articleId: string,
  businessId: string,
  reactionType: ArticleReactionType | null,
): Promise<{ counts: ArticleReactionCounts; userReaction: ArticleReactionType | null } | null> {
  const article = await getArticleById(articleId);
  if (!article) return null;

  const db = await getDb();
  let userReaction: ArticleReactionType | null = reactionType;

  if (reactionType === null) {
    await db
      .prepare(
        "DELETE FROM article_reactions WHERE article_id = ? AND business_id = ?",
      )
      .bind(articleId, businessId)
      .run();
    userReaction = null;
  } else {
    const existing = await db
      .prepare(
        "SELECT id, reaction_type FROM article_reactions WHERE article_id = ? AND business_id = ?",
      )
      .bind(articleId, businessId)
      .first<{ id: string; reaction_type: ArticleReactionType }>();

    if (existing?.reaction_type === reactionType) {
      await db
        .prepare("DELETE FROM article_reactions WHERE id = ?")
        .bind(existing.id)
        .run();
      userReaction = null;
    } else if (existing) {
      await db
        .prepare(
          "UPDATE article_reactions SET reaction_type = ?, created_at = datetime('now') WHERE id = ?",
        )
        .bind(reactionType, existing.id)
        .run();
    } else {
      await db
        .prepare(
          `INSERT INTO article_reactions (id, article_id, business_id, reaction_type)
           VALUES (?, ?, ?, ?)`,
        )
        .bind(generateId("reaction"), articleId, businessId, reactionType)
        .run();
    }
  }

  const counts = await getArticleReactionCounts(articleId);

  return { counts, userReaction };
}

export async function getArticleReactionCounts(
  articleId: string,
): Promise<ArticleReactionCounts> {
  const db = await getDb();
  const rows = await db
    .prepare(
      `SELECT reaction_type, COUNT(*) as count
       FROM article_reactions
       WHERE article_id = ?
       GROUP BY reaction_type`,
    )
    .bind(articleId)
    .all<{ reaction_type: ArticleReactionType; count: number }>();

  const counts = emptyArticleReactionCounts();
  for (const row of rows.results ?? []) {
    counts[row.reaction_type] = row.count;
  }

  return counts;
}

export async function listArticleReactors(
  articleId: string,
  viewerBusinessId: string,
): Promise<Record<string, ReactionParticipant[]> | null> {
  const article = await getArticleById(articleId);
  if (!article) return null;

  const db = await getDb();
  const rows = await db
    .prepare(
      `SELECT ar.reaction_type, ar.created_at, b.id as business_id, b.business_name
       FROM article_reactions ar
       JOIN businesses b ON b.id = ar.business_id
       WHERE ar.article_id = ?
       ORDER BY ar.created_at ASC`,
    )
    .bind(articleId)
    .all<{
      reaction_type: ArticleReactionType;
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
