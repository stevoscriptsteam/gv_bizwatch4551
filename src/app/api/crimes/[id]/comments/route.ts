import { NextResponse } from "next/server";
import { addComment, listComments } from "@/lib/report-engagement";
import { getCurrentBusiness } from "@/lib/session";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const comments = await listComments(id, business.id);

  return NextResponse.json({ comments });
}

export async function POST(request: Request, context: RouteContext) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as { body?: string };
  const text = body.body?.trim();

  if (!text) {
    return NextResponse.json(
      { error: "Update cannot be empty." },
      { status: 400 },
    );
  }

  if (text.length > 2000) {
    return NextResponse.json(
      { error: "Update is too long (max 2000 characters)." },
      { status: 400 },
    );
  }

  const comment = await addComment(id, business.id, text, business.member_id);
  if (!comment) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, comment });
}
