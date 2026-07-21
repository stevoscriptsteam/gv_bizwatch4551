import { NextResponse } from "next/server";
import {
  deleteCrime,
  enrichCrimesWithEngagement,
  getCrimeById,
  updateCrime,
} from "@/lib/report-engagement";
import { getCurrentBusiness } from "@/lib/session";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const crime = await getCrimeById(id);
  if (!crime) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  const [enriched] = await enrichCrimesWithEngagement([crime], business.id);
  const { business_name: _removed, ...publicCrime } = enriched;

  return NextResponse.json({ crime: publicCrime });
}

export async function PATCH(request: Request, context: RouteContext) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as {
    title?: string;
    description?: string;
    address?: string;
    suburb?: string;
  };

  if (
    !body.title?.trim() ||
    !body.description?.trim() ||
    !body.address?.trim() ||
    !body.suburb?.trim()
  ) {
    return NextResponse.json(
      { error: "Title, description, address and suburb are required." },
      { status: 400 },
    );
  }

  const updated = await updateCrime(id, business.id, {
    title: body.title.trim(),
    description: body.description.trim(),
    address: body.address.trim(),
    suburb: body.suburb.trim(),
  });

  if (!updated) {
    return NextResponse.json(
      { error: "Report not found or you cannot edit it." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const deleted = await deleteCrime(id, business.id);

  if (!deleted) {
    return NextResponse.json(
      { error: "Report not found or you cannot delete it." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}
