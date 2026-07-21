import { NextResponse } from "next/server";
import { reverseGeocodeInZone, ZONE_OUTSIDE_MESSAGE } from "@/lib/addresses";
import { getCurrentBusiness } from "@/lib/session";

export async function GET(request: Request) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const lat = Number.parseFloat(searchParams.get("lat") ?? "");
  const lon = Number.parseFloat(searchParams.get("lon") ?? "");

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return NextResponse.json({ error: "Invalid coordinates." }, { status: 400 });
  }

  try {
    const location = await reverseGeocodeInZone(lat, lon);
    return NextResponse.json({ location });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : ZONE_OUTSIDE_MESSAGE;
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
