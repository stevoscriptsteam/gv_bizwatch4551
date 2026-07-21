import { NextResponse } from "next/server";
import { logAdminAction, requireAdmin } from "@/lib/admin";
import { setReportArchived } from "@/lib/admin-operations";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const body = (await request.json()) as { archived?: boolean };

  if (typeof body.archived !== "boolean") {
    return NextResponse.json(
      { error: "archived (boolean) is required." },
      { status: 400 },
    );
  }

  const report = await setReportArchived(id, auth.business.id, body.archived);
  if (!report) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  await logAdminAction({
    adminId: auth.business.id,
    action: body.archived ? "archive_report" : "restore_report",
    entityType: "crime",
    entityId: id,
    details: {
      title: report.title,
      business_name: report.business_name,
    },
  });

  return NextResponse.json({ report });
}
