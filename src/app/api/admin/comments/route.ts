import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { listAdminComments } from "@/lib/admin-operations";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get("type");

  let type: "report" | "article" | undefined;
  if (typeParam === "report" || typeParam === "article") {
    type = typeParam;
  }

  const comments = await listAdminComments(type);
  return NextResponse.json({ comments });
}
