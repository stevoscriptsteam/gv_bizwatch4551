import { NextResponse } from "next/server";
import { logAdminAction, requireAdmin } from "@/lib/admin";
import {
  addAdminBusiness,
  listAdminBusinesses,
  setBusinessActive,
} from "@/lib/admin-operations";
import { getDb } from "@/lib/cloudflare";
import { sendRegistrationSms } from "@/lib/twilio";

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
    message?: string;
  };

  const reference = (body.message ?? "").trim();
  if (!reference) {
    return NextResponse.json(
      { error: "Enter a reference message for the registration SMS." },
      { status: 400 },
    );
  }
  if (reference.length > 300) {
    return NextResponse.json(
      { error: "Reference message is too long (max 300 characters)." },
      { status: 400 },
    );
  }

  const result = await addAdminBusiness({
    businessName: body.businessName ?? "",
    phone: body.phone ?? "",
    email: body.email ?? "",
    suburb: body.suburb,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  const sms = await sendRegistrationSms({
    phone: result.phone,
    approvedBy: auth.business.business_name,
    reference,
  });

  await logAdminAction({
    adminId: auth.business.id,
    action: "add_business",
    entityType: "business",
    entityId: result.id,
    details: {
      business_name: body.businessName,
      phone: body.phone,
      reference,
      sms_sent: sms.ok,
    },
  });

  return NextResponse.json({
    ok: true,
    id: result.id,
    smsSent: sms.ok,
    smsError: sms.ok ? undefined : sms.error,
  });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as {
    id?: string;
    active?: boolean;
    message?: string;
  };
  if (!body.id || typeof body.active !== "boolean") {
    return NextResponse.json(
      { error: "id and active (boolean) are required." },
      { status: 400 },
    );
  }

  const activateReference = (body.message ?? "").trim();
  if (activateReference.length > 300) {
    return NextResponse.json(
      { error: "Reference message is too long (max 300 characters)." },
      { status: 400 },
    );
  }

  const wasActive = await (await getDb())
    .prepare("SELECT active FROM businesses WHERE id = ?")
    .bind(body.id)
    .first<{ active: number }>();

  const business = await setBusinessActive(body.id, body.active);
  if (!business) {
    return NextResponse.json({ error: "Business not found." }, { status: 404 });
  }

  let smsSent = false;
  // Notify when a pending registration is activated (inactive → active only).
  if (body.active && wasActive?.active === 0) {
    const sms = await sendRegistrationSms({
      phone: business.phone,
      approvedBy: auth.business.business_name,
      reference:
        activateReference || "Your registration has been approved.",
    });
    smsSent = sms.ok;
  }

  await logAdminAction({
    adminId: auth.business.id,
    action: body.active ? "activate_business" : "deactivate_business",
    entityType: "business",
    entityId: body.id,
    details: {
      business_name: business.business_name,
      phone: business.phone,
      sms_sent: body.active ? smsSent : undefined,
    },
  });

  return NextResponse.json({ business, smsSent });
}
