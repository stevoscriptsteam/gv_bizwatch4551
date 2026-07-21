import { NextResponse } from "next/server";
import { listContactListBusinesses } from "@/lib/businesses";
import { getCurrentBusiness } from "@/lib/session";

export async function GET() {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contacts = await listContactListBusinesses();
  return NextResponse.json({ contacts });
}
