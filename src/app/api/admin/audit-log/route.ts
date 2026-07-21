import { NextResponse } from "next/server";
import { listAuditLog, requireAdmin } from "@/lib/admin";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    200,
    Math.max(1, Number.parseInt(searchParams.get("limit") ?? "100", 10) || 100),
  );

  const entries = await listAuditLog(limit);
  return NextResponse.json({ entries });
}
