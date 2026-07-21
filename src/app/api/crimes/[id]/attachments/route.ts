import { NextResponse } from "next/server";
import {
  canAccessAttachments,
  createAttachment,
  getCrimeBusinessId,
  listAttachments,
} from "@/lib/attachments";
import { getCurrentBusiness } from "@/lib/session";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: crimeId } = await context.params;
  const crimeBusinessId = await getCrimeBusinessId(crimeId);
  if (!crimeBusinessId) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  if (!canAccessAttachments(business, crimeBusinessId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const attachments = await listAttachments(crimeId);
  return NextResponse.json({ attachments });
}

export async function POST(request: Request, context: RouteContext) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: crimeId } = await context.params;
  const crimeBusinessId = await getCrimeBusinessId(crimeId);
  if (!crimeBusinessId) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  if (business.id !== crimeBusinessId) {
    return NextResponse.json(
      { error: "Only the report owner can upload evidence." },
      { status: 403 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const result = await createAttachment({
    crimeId,
    businessId: business.id,
    file,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ attachment: result });
}
