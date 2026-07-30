import { NextResponse } from "next/server";
import { flagCrime, unflagCrime } from "@/lib/report-flags";
import { getCurrentBusiness } from "@/lib/session";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const result = await flagCrime(id, business.id);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    flagCount: result.result.flagCount,
    userHasFlagged: result.result.userHasFlagged,
    archived: result.result.archived,
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const result = await unflagCrime(id, business.id);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    flagCount: result.result.flagCount,
    userHasFlagged: result.result.userHasFlagged,
    archived: result.result.archived,
  });
}
