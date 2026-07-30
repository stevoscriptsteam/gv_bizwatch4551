import { NextResponse } from "next/server";
import { createCrime, listCrimesForArea, listCrimesForBusiness } from "@/lib/crimes";
import { enrichCrimesWithEngagement } from "@/lib/report-engagement";
import { getCurrentBusiness } from "@/lib/session";

export async function GET(request: Request) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mine = searchParams.get("mine") === "1";

  if (mine) {
    const crimes = await listCrimesForBusiness(business.id);
    const enriched = await enrichCrimesWithEngagement(crimes, business.id);
    return NextResponse.json({ crimes: enriched });
  }

  const crimes = await listCrimesForArea();
  const enriched = await enrichCrimesWithEngagement(crimes, business.id);
  return NextResponse.json({ crimes: enriched });
}

export async function POST(request: Request) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    title?: string;
    description?: string;
    crimeType?: string;
    categoryId?: string;
    address?: string;
    suburb?: string;
    latitude?: number | null;
    longitude?: number | null;
  };

  if (
    !body.title?.trim() ||
    !body.description?.trim() ||
    !body.crimeType ||
    !body.address?.trim() ||
    !body.suburb?.trim()
  ) {
    return NextResponse.json({ error: "All required fields must be completed." }, { status: 400 });
  }

  if (
    body.title.length > 200 ||
    body.description.length > 10000 ||
    body.crimeType.length > 100 ||
    body.address.length > 300 ||
    body.suburb.length > 100
  ) {
    return NextResponse.json(
      { error: "One or more fields exceed the maximum allowed length." },
      { status: 400 },
    );
  }

  const crimeId = await createCrime({
    businessId: business.id,
    memberId: business.member_id ?? null,
    title: body.title.trim(),
    description: body.description.trim(),
    crimeType: body.crimeType,
    categoryId: body.categoryId,
    address: body.address.trim(),
    suburb: body.suburb.trim(),
    latitude: body.latitude ?? null,
    longitude: body.longitude ?? null,
  });

  return NextResponse.json({ ok: true, crimeId });
}
