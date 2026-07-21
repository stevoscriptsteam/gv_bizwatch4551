import { NextResponse } from "next/server";
import { geocodeAddressInZone, ZONE_OUTSIDE_MESSAGE } from "@/lib/addresses";
import { isLocationInZone } from "@/lib/zone-4551";
import { getCurrentBusiness } from "@/lib/session";

export async function POST(request: Request) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    address?: string;
    suburb?: string;
    latitude?: number | null;
    longitude?: number | null;
  };

  if (
    body.latitude != null &&
    body.longitude != null &&
    isLocationInZone({ latitude: body.latitude, longitude: body.longitude })
  ) {
    return NextResponse.json({
      ok: true,
      location: {
        address: body.address?.trim() ?? "",
        suburb: body.suburb?.trim() ?? null,
        latitude: body.latitude,
        longitude: body.longitude,
      },
    });
  }

  if (!body.address?.trim()) {
    return NextResponse.json(
      { error: "Select an address from the suggestions or use your current location within 4551." },
      { status: 400 },
    );
  }

  try {
    const location = await geocodeAddressInZone({
      address: body.address,
      suburb: body.suburb,
    });
    return NextResponse.json({ ok: true, location });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : ZONE_OUTSIDE_MESSAGE;
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
