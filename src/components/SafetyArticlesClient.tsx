"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { ArticleReactionCounts, SafetyArticleSummary } from "@/lib/types";
import { ARTICLE_REACTION_TYPES } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { EmergencyNotice } from "@/components/ui/EmergencyNotice";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
  }).format(new Date(iso));
}

function totalReactions(reactions?: ArticleReactionCounts) {
  if (!reactions) return 0;
  return ARTICLE_REACTION_TYPES.reduce((sum, type) => sum + reactions[type], 0);
}

export function SafetyArticlesClient() {
  const [articles, setArticles] = useState<SafetyArticleSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/safety/articles");
    if (res.ok) {
      const data = (await res.json()) as { articles: SafetyArticleSummary[] };
      setArticles(data.articles);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="container-content">
      <PageHeader
        title="Resources"
        description="Practical guidance for protecting staff, customers and premises across the 4551 community."
      />

      <EmergencyNotice />

      {loading ? (
        <p className="supporting-text mt-8">Loading articles…</p>
      ) : articles.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No articles available"
            description="Safety guidance articles will appear here when published."
          />
        </div>
      ) : (
        <div className="safety-articles-grid mt-8">
          {articles.map((article) => (
            <article key={article.id} className="safety-article-card card card-shadow">
              <p className="safety-article-category">{article.category}</p>
              <h2 className="safety-article-title">
                <Link href={`/safety/${article.slug}`}>{article.title}</Link>
              </h2>
              <p className="safety-article-summary">{article.summary}</p>
              <div className="safety-article-meta">
                <span>
                  {article.author_name}
                  {article.author_role ? ` · ${article.author_role}` : ""}
                </span>
                <span>{formatDate(article.published_at)}</span>
              </div>
              <div className="safety-article-stats">
                <span>{article.comment_count ?? 0} comments</span>
                <span>{totalReactions(article.reactions)} reactions</span>
              </div>
              <Link href={`/safety/${article.slug}`} className="btn btn-secondary btn-sm safety-article-read">
                Read article
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
