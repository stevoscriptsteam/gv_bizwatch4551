import { NextResponse } from "next/server";
import {
  deleteArticleComment,
  updateArticleComment,
} from "@/lib/article-engagement";
import { getCurrentBusiness } from "@/lib/session";

type RouteContext = { params: Promise<{ id: string; commentId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { commentId } = await context.params;
  const body = (await request.json()) as { body?: string };
  const text = body.body?.trim();

  if (!text) {
    return NextResponse.json(
      { error: "Comment cannot be empty." },
      { status: 400 },
    );
  }

  if (text.length > 2000) {
    return NextResponse.json(
      { error: "Comment is too long (max 2000 characters)." },
      { status: 400 },
    );
  }

  const updated = await updateArticleComment(commentId, business.id, text);
  if (!updated) {
    return NextResponse.json(
      { error: "Comment not found or you cannot edit it." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { commentId } = await context.params;
  const deleted = await deleteArticleComment(commentId, business.id);

  if (!deleted) {
    return NextResponse.json(
      { error: "Comment not found or you cannot delete it." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}
