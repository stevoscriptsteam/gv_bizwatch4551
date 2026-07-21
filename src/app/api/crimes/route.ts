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
  const publicCrimes = enriched.map(({ business_name: _removed, ...crime }) => crime);
  return NextResponse.json({ crimes: publicCrimes });
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

  const crimeId = await createCrime({
    businessId: business.id,
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
