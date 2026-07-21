import { NextResponse } from "next/server";
import {
  enrichArticlesWithEngagement,
  listPublishedArticles,
} from "@/lib/safety-articles";
import { getCurrentBusiness } from "@/lib/session";

export async function GET() {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const articles = await listPublishedArticles();
  const enriched = await enrichArticlesWithEngagement(articles, business.id);

  return NextResponse.json({ articles: enriched });
}
