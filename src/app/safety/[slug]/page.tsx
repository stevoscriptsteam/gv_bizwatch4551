import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArticleBody } from "@/components/ArticleBody";
import { ArticleEngagement } from "@/components/ArticleEngagement";
import { EmergencyNotice } from "@/components/ui/EmergencyNotice";
import {
  enrichArticlesWithEngagement,
  getArticleBySlug,
  listRelatedArticles,
} from "@/lib/safety-articles";
import { getCurrentBusiness } from "@/lib/session";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "long",
  }).format(new Date(iso));
}

type SafetyArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function SafetyArticlePage({ params }: SafetyArticlePageProps) {
  const business = await getCurrentBusiness();
  if (!business) {
    redirect("/sign-in?next=/safety");
  }

  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) {
    notFound();
  }

  const [enriched] = await enrichArticlesWithEngagement([article], business.id);
  const related = await listRelatedArticles(article.id);

  return (
    <div className="container-content">
      <nav className="article-breadcrumb" aria-label="Breadcrumb">
        <Link href="/safety">Resources</Link>
        <span aria-hidden="true">/</span>
        <span>{enriched.title}</span>
      </nav>

      <EmergencyNotice />

      <article className="article-detail mt-6">
        <header className="article-detail-header">
          <p className="safety-article-category">{enriched.category}</p>
          <h1 className="article-detail-title">{enriched.title}</h1>
          <div className="article-detail-byline">
            <p>
              <span className="article-detail-author">{enriched.author_name}</span>
              {enriched.author_role ? (
                <span className="article-detail-role"> · {enriched.author_role}</span>
              ) : null}
            </p>
            <p className="article-detail-date">Published {formatDate(enriched.published_at)}</p>
          </div>
        </header>

        <ArticleBody content={enriched.body} />

        <ArticleEngagement article={enriched} />
      </article>

      {related.length > 0 ? (
        <section className="related-articles mt-8" aria-labelledby="related-heading">
          <h2 id="related-heading" className="section-heading">
            Related articles
          </h2>
          <div className="related-articles-grid">
            {related.map((item) => (
              <article key={item.id} className="related-article-card card card-shadow">
                <p className="safety-article-category">{item.category}</p>
                <h3 className="related-article-title">
                  <Link href={`/safety/${item.slug}`}>{item.title}</Link>
                </h3>
                <p className="related-article-summary">{item.summary}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-8">
        <Link href="/report" className="btn btn-report">
          Make a report
        </Link>
      </div>
    </div>
  );
}
