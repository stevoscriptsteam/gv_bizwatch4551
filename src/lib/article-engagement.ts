import type {
  ArticleComment,
  ArticleReactionCounts,
  ArticleReactionType,
  ReactionParticipant,
} from "@/lib/types";
import { emptyArticleReactionCounts } from "@/lib/types";
import { getArticleById } from "@/lib/safety-articles";
import {
  ARTICLE_ENGAGEMENT,
  addEngagementComment,
  deleteEngagementComment,
  getEngagementReactionCounts,
  listEngagementComments,
  listEngagementReactors,
  setEngagementReaction,
  updateEngagementComment,
} from "@/lib/engagement";

export async function listArticleComments(
  articleId: string,
  viewerBusinessId: string,
): Promise<ArticleComment[]> {
  return listEngagementComments<ArticleComment>(
    ARTICLE_ENGAGEMENT,
    articleId,
    viewerBusinessId,
  );
}

export async function addArticleComment(
  articleId: string,
  businessId: string,
  body: string,
  memberId?: string | null,
): Promise<ArticleComment | null> {
  const article = await getArticleById(articleId);
  if (!article) return null;

  return addEngagementComment<ArticleComment>(
    ARTICLE_ENGAGEMENT,
    articleId,
    businessId,
    body,
    memberId,
  );
}

export async function updateArticleComment(
  commentId: string,
  businessId: string,
  body: string,
): Promise<boolean> {
  return updateEngagementComment(ARTICLE_ENGAGEMENT, commentId, businessId, body);
}

export async function deleteArticleComment(
  commentId: string,
  businessId: string,
): Promise<boolean> {
  return deleteEngagementComment(ARTICLE_ENGAGEMENT, commentId, businessId);
}

export async function setArticleReaction(
  articleId: string,
  businessId: string,
  reactionType: ArticleReactionType | null,
): Promise<{ counts: ArticleReactionCounts; userReaction: ArticleReactionType | null } | null> {
  const article = await getArticleById(articleId);
  if (!article) return null;

  return setEngagementReaction(
    ARTICLE_ENGAGEMENT,
    articleId,
    businessId,
    reactionType,
    emptyArticleReactionCounts,
  );
}

export async function getArticleReactionCounts(
  articleId: string,
): Promise<ArticleReactionCounts> {
  return getEngagementReactionCounts(
    ARTICLE_ENGAGEMENT,
    articleId,
    emptyArticleReactionCounts,
  );
}

export async function listArticleReactors(
  articleId: string,
  viewerBusinessId: string,
): Promise<Record<string, ReactionParticipant[]> | null> {
  const article = await getArticleById(articleId);
  if (!article) return null;

  return listEngagementReactors(ARTICLE_ENGAGEMENT, articleId, viewerBusinessId);
}
