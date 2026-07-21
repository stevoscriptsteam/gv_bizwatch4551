import { NextResponse } from "next/server";
import { logAdminAction, requireAdmin } from "@/lib/admin";
import {
  addAdminBusiness,
  listAdminBusinesses,
  setBusinessActive,
} from "@/lib/admin-operations";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const businesses = await listAdminBusinesses();
  return NextResponse.json({ businesses });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as {
    businessName?: string;
    phone?: string;
    email?: string;
    suburb?: string;
  };

  const result = await addAdminBusiness({
    businessName: body.businessName ?? "",
    phone: body.phone ?? "",
    email: body.email ?? "",
    suburb: body.suburb,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  await logAdminAction({
    adminId: auth.business.id,
    action: "add_business",
    entityType: "business",
    entityId: result.id,
    details: {
      business_name: body.businessName,
      phone: body.phone,
    },
  });

  return NextResponse.json({ ok: true, id: result.id });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as { id?: string; active?: boolean };
  if (!body.id || typeof body.active !== "boolean") {
    return NextResponse.json(
      { error: "id and active (boolean) are required." },
      { status: 400 },
    );
  }

  const business = await setBusinessActive(body.id, body.active);
  if (!business) {
    return NextResponse.json({ error: "Business not found." }, { status: 404 });
  }

  await logAdminAction({
    adminId: auth.business.id,
    action: body.active ? "activate_business" : "deactivate_business",
    entityType: "business",
    entityId: body.id,
    details: {
      business_name: business.business_name,
      phone: business.phone,
    },
  });

  return NextResponse.json({ business });
}
