import { NextResponse } from "next/server";
import { REACTION_TYPES, type ReactionType } from "@/lib/types";
import { listReportReactors, setReaction } from "@/lib/report-engagement";
import { getCurrentBusiness } from "@/lib/session";

type RouteContext = { params: Promise<{ id: string }> };

function isReactionType(value: string): value is ReactionType {
  return (REACTION_TYPES as readonly string[]).includes(value);
}

export async function GET(_request: Request, context: RouteContext) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const reactors = await listReportReactors(id, business.id);

  if (!reactors) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
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

  if (body.type !== null && body.type !== undefined && !isReactionType(body.type)) {
    return NextResponse.json({ error: "Invalid reaction type." }, { status: 400 });
  }

  const reactionType = body.type === null || body.type === undefined ? null : body.type;
  const result = await setReaction(id, business.id, reactionType);

  if (!result) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
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
  const result = await setReaction(id, business.id, null);

  if (!result) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    reactions: result.counts,
    userReaction: null,
  });
}
