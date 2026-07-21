import type {
  ArticleEngagementState,
  ArticleReactionCounts,
  ArticleReactionType,
  SafetyArticle,
  SafetyArticleSummary,
} from "@/lib/types";
import { emptyArticleReactionCounts } from "@/lib/types";
import { getDb } from "@/lib/cloudflare";

export async function listPublishedArticles(): Promise<SafetyArticleSummary[]> {
  const db = await getDb();
  const result = await db
    .prepare(
      `SELECT id, slug, title, summary, author_name, author_role, category,
              status, published_at, created_at, updated_at
       FROM safety_articles
       WHERE status = 'published'
       ORDER BY published_at DESC`,
    )
    .all<SafetyArticleSummary>();

  return result.results ?? [];
}

export async function getArticleBySlug(slug: string): Promise<SafetyArticle | null> {
  const db = await getDb();
  return db
    .prepare(
      `SELECT * FROM safety_articles
       WHERE slug = ? AND status = 'published'
       LIMIT 1`,
    )
    .bind(slug)
    .first<SafetyArticle>();
}

export async function getArticleById(articleId: string): Promise<SafetyArticle | null> {
  const db = await getDb();
  return db
    .prepare(
      `SELECT * FROM safety_articles
       WHERE id = ? AND status = 'published'
       LIMIT 1`,
    )
    .bind(articleId)
    .first<SafetyArticle>();
}

export async function listRelatedArticles(
  articleId: string,
): Promise<SafetyArticleSummary[]> {
  const db = await getDb();
  const result = await db
    .prepare(
      `SELECT a.id, a.slug, a.title, a.summary, a.author_name, a.author_role,
              a.category, a.status, a.published_at, a.created_at, a.updated_at
       FROM article_related ar
       JOIN safety_articles a ON a.id = ar.related_article_id
       WHERE ar.article_id = ? AND a.status = 'published'
       ORDER BY a.published_at DESC
       LIMIT 3`,
    )
    .bind(articleId)
    .all<SafetyArticleSummary>();

  return result.results ?? [];
}

export async function enrichArticlesWithEngagement<T extends { id: string }>(
  articles: T[],
  viewerBusinessId: string,
): Promise<(T & ArticleEngagementState)[]> {
  if (articles.length === 0) return articles;

  const db = await getDb();
  const ids = articles.map((a) => a.id);
  const placeholders = ids.map(() => "?").join(", ");

  const commentRows = await db
    .prepare(
      `SELECT article_id, COUNT(*) as count
       FROM article_comments
       WHERE article_id IN (${placeholders}) AND deleted_at IS NULL
       GROUP BY article_id`,
    )
    .bind(...ids)
    .all<{ article_id: string; count: number }>();

  const reactionRows = await db
    .prepare(
      `SELECT article_id, reaction_type, COUNT(*) as count
       FROM article_reactions
       WHERE article_id IN (${placeholders})
       GROUP BY article_id, reaction_type`,
    )
    .bind(...ids)
    .all<{ article_id: string; reaction_type: ArticleReactionType; count: number }>();

  const userReactionRows = await db
    .prepare(
      `SELECT article_id, reaction_type
       FROM article_reactions
       WHERE business_id = ? AND article_id IN (${placeholders})`,
    )
    .bind(viewerBusinessId, ...ids)
    .all<{ article_id: string; reaction_type: ArticleReactionType }>();

  const commentMap = new Map(
    (commentRows.results ?? []).map((r) => [r.article_id, r.count]),
  );

  const reactionMap = new Map<string, ArticleReactionCounts>();
  for (const row of reactionRows.results ?? []) {
    const counts = reactionMap.get(row.article_id) ?? emptyArticleReactionCounts();
    counts[row.reaction_type] = row.count;
    reactionMap.set(row.article_id, counts);
  }

  const userReactionMap = new Map(
    (userReactionRows.results ?? []).map((r) => [r.article_id, r.reaction_type]),
  );

  return articles.map((article) => ({
    ...article,
    comment_count: commentMap.get(article.id) ?? 0,
    reactions: reactionMap.get(article.id) ?? emptyArticleReactionCounts(),
    user_reaction: userReactionMap.get(article.id) ?? null,
  }));
}
