import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { removeMember, setMemberAdmin } from "@/lib/members";
import { getCurrentBusiness } from "@/lib/session";

type RouteContext = { params: Promise<{ memberId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
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

  if (!isAdmin(business)) {
    return NextResponse.json(
      { error: "Only admin businesses can grant admin access to team members." },
      { status: 403 },
    );
  }

  const body = (await request.json()) as { isAdmin?: boolean };
  if (typeof body.isAdmin !== "boolean") {
    return NextResponse.json(
      { error: "isAdmin (boolean) is required." },
      { status: 400 },
    );
  }

  const { memberId } = await context.params;
  const member = await setMemberAdmin(business.id, memberId, body.isAdmin);

  if (!member) {
    return NextResponse.json({ error: "Team member not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, member });
}

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
