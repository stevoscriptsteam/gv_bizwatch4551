import { NextResponse } from "next/server";
import { logAdminAction, requireAdmin } from "@/lib/admin";
import { moderateComment } from "@/lib/admin-operations";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get("type");

  if (typeParam !== "report" && typeParam !== "article") {
    return NextResponse.json(
      { error: "type must be report or article." },
      { status: 400 },
    );
  }

  const comment = await moderateComment(id, typeParam, auth.business.id);
  if (!comment) {
    return NextResponse.json({ error: "Comment not found." }, { status: 404 });
  }

  await logAdminAction({
    adminId: auth.business.id,
    action:
      typeParam === "report"
        ? "delete_report_comment"
        : "delete_article_comment",
    entityType: typeParam === "report" ? "report_comment" : "article_comment",
    entityId: id,
    details: {
      body: comment.body.slice(0, 200),
      business_name: comment.business_name,
      parent_id: comment.parent_id,
      parent_title: comment.parent_title,
    },
  });

  return NextResponse.json({ ok: true });
}
