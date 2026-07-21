import { NextResponse } from "next/server";
import { ARTICLE_REACTION_TYPES, type ArticleReactionType } from "@/lib/types";
import { listArticleReactors, setArticleReaction } from "@/lib/article-engagement";
import { getCurrentBusiness } from "@/lib/session";

type RouteContext = { params: Promise<{ id: string }> };

function isArticleReactionType(value: string): value is ArticleReactionType {
  return (ARTICLE_REACTION_TYPES as readonly string[]).includes(value);
}

export async function GET(_request: Request, context: RouteContext) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const reactors = await listArticleReactors(id, business.id);

  if (!reactors) {
    return NextResponse.json({ error: "Article not found." }, { status: 404 });
  }

  return NextResponse.json({ reactors });
}

export async function PUT(request: Request, context: RouteContext) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as { type?: string | null };

  if (body.type !== null && body.type !== undefined && !isArticleReactionType(body.type)) {
    return NextResponse.json({ error: "Invalid reaction type." }, { status: 400 });
  }

  const reactionType = body.type === null || body.type === undefined ? null : body.type;
  const result = await setArticleReaction(id, business.id, reactionType);

  if (!result) {
    return NextResponse.json({ error: "Article not found." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    reactions: result.counts,
    userReaction: result.userReaction,
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const result = await setArticleReaction(id, business.id, null);

  if (!result) {
    return NextResponse.json({ error: "Article not found." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    reactions: result.counts,
    userReaction: null,
  });
}
