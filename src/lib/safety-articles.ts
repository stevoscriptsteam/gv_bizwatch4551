import type {
  ArticleEngagementState,
  ArticleReactionCounts,
  ArticleReactionType,
  SafetyArticle,
  SafetyArticleSummary,
} from "@/lib/types";
import { emptyArticleReactionCounts } from "@/lib/types";
import { getDb } from "@/lib/cloudflare";
import { ARTICLE_ENGAGEMENT, enrichWithEngagement } from "@/lib/engagement";

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
  return enrichWithEngagement<T, ArticleReactionType, ArticleReactionCounts>(
    ARTICLE_ENGAGEMENT,
    articles,
    viewerBusinessId,
    emptyArticleReactionCounts,
  );
}
