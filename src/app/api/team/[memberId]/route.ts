import { NextResponse } from "next/server";
import { removeMember } from "@/lib/members";
import { getCurrentBusiness } from "@/lib/session";

type RouteContext = { params: Promise<{ memberId: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (business.member_id) {
    return NextResponse.json(
      { error: "Only the account owner can manage team members." },
      { status: 403 },
    );
  }

  const { memberId } = await context.params;
  const removed = await removeMember(business.id, memberId);

  if (!removed) {
    return NextResponse.json({ error: "Team member not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
