import { NextResponse } from "next/server";
import {
  canAccessAttachments,
  deleteAttachment,
  getAttachment,
  getAttachmentObject,
  getCrimeBusinessId,
} from "@/lib/attachments";
import { getCurrentBusiness } from "@/lib/session";

type RouteContext = { params: Promise<{ id: string; attachmentId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: crimeId, attachmentId } = await context.params;
  const crimeBusinessId = await getCrimeBusinessId(crimeId);
  if (!crimeBusinessId) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  if (!canAccessAttachments(business, crimeBusinessId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const attachment = await getAttachment(crimeId, attachmentId);
  if (!attachment) {
    return NextResponse.json({ error: "Attachment not found." }, { status: 404 });
  }

  const object = await getAttachmentObject(attachment);
  if (!object) {
    return NextResponse.json({ error: "File not found in storage." }, { status: 404 });
  }

  const headers = new Headers();
  headers.set("Content-Type", attachment.content_type);
  headers.set(
    "Content-Disposition",
    `inline; filename="${encodeURIComponent(attachment.original_filename)}"`,
  );
  headers.set("Cache-Control", "private, no-store");

  return new NextResponse(object.body, { headers });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: crimeId, attachmentId } = await context.params;
  const deleted = await deleteAttachment(crimeId, attachmentId, business.id);

  if (!deleted) {
    return NextResponse.json(
      { error: "Attachment not found or you cannot delete it." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}
