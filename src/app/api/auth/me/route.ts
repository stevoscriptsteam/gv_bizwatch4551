import { NextResponse } from "next/server";
import { isAdmin, isMaster } from "@/lib/admin";
import { updateBusinessProfile } from "@/lib/businesses";
import { getCurrentBusiness } from "@/lib/session";

export async function GET() {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    business: {
      id: business.id,
      business_name: business.business_name,
      phone: business.phone,
      email: business.email,
      suburb: business.suburb,
      contact_list_visible: business.contact_list_visible !== 0,
      is_admin: isAdmin(business),
      is_master: isMaster(business),
    },
  });
}

export async function PATCH(request: Request) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    businessName?: string;
    email?: string;
    suburb?: string;
    contactListVisible?: boolean;
  };

  const result = await updateBusinessProfile(business.id, {
    businessName: body.businessName ?? "",
    email: body.email ?? "",
    suburb: body.suburb,
    contactListVisible: body.contactListVisible !== false,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
