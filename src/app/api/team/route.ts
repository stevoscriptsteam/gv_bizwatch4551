import { NextResponse } from "next/server";
import { addMember, listMembers } from "@/lib/members";
import { getCurrentBusiness } from "@/lib/session";

export async function GET() {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const members = await listMembers(business.id);
  return NextResponse.json({ members });
}

export async function POST(request: Request) {
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

  const body = (await request.json()) as { name?: string; phone?: string };
  const result = await addMember(business.id, {
    name: body.name ?? "",
    phone: body.phone ?? "",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, member: result.member });
}
