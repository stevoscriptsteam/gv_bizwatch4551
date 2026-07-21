import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { listAdminReports } from "@/lib/admin-operations";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const archivedParam = searchParams.get("archived");

  let archivedOnly: boolean | undefined;
  if (archivedParam === "1" || archivedParam === "true") {
    archivedOnly = true;
  } else if (archivedParam === "0" || archivedParam === "false") {
    archivedOnly = false;
  }

  const reports = await listAdminReports(archivedOnly);
  return NextResponse.json({ reports });
}
