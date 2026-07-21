"use client";

import type { SafetyArticle } from "@/lib/types";
import {
  ARTICLE_REACTION_DESCRIPTIONS,
  ARTICLE_REACTION_LABELS,
  ARTICLE_REACTION_TYPES,
  emptyArticleReactionCounts,
} from "@/lib/types";
import { EngagementPanel } from "@/components/EngagementPanel";
import { ARTICLE_REACTION_ICONS } from "@/lib/icons";

const articleReactionConfig = {
  types: ARTICLE_REACTION_TYPES,
  labels: ARTICLE_REACTION_LABELS,
  descriptions: ARTICLE_REACTION_DESCRIPTIONS,
  icons: ARTICLE_REACTION_ICONS,
  emptyCounts: emptyArticleReactionCounts,
};

type ArticleEngagementProps = {
  article: SafetyArticle;
};

export function ArticleEngagement({ article }: ArticleEngagementProps) {
  return (
    <EngagementPanel
      targetId={article.id}
      apiBasePath={`/api/safety/articles/${article.id}`}
      initialEngagement={{
        comment_count: article.comment_count,
        reactions: article.reactions,
        user_reaction: article.user_reaction,
      }}
      commentPlaceholder="Share your experience or ask a question…"
      reactionConfig={articleReactionConfig}
    />
  );
}
