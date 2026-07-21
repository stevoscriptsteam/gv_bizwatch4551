import { NextResponse } from "next/server";
import { searchAddressesInZone } from "@/lib/addresses";
import { getCurrentBusiness } from "@/lib/session";

export async function GET(request: Request) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  const suggestions = await searchAddressesInZone(query);
  return NextResponse.json({ suggestions });
}
