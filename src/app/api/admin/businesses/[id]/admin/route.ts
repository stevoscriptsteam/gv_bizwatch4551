import { NextResponse } from "next/server";
import { isMaster, logAdminAction, requireMaster } from "@/lib/admin";
import { getBusinessById, setBusinessAdmin } from "@/lib/admin-operations";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireMaster();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const body = (await request.json()) as { isAdmin?: boolean };

  if (typeof body.isAdmin !== "boolean") {
    return NextResponse.json(
      { error: "isAdmin (boolean) is required." },
      { status: 400 },
    );
  }

  const target = await getBusinessById(id);
  if (!target) {
    return NextResponse.json({ error: "Business not found." }, { status: 404 });
  }

  if (isMaster(target) && !body.isAdmin) {
    return NextResponse.json(
      { error: "Cannot remove admin access from the master account." },
      { status: 403 },
    );
  }

  if (auth.business.id === id && !body.isAdmin) {
    return NextResponse.json(
      { error: "You cannot remove your own admin access." },
      { status: 403 },
    );
  }

  const business = await setBusinessAdmin(id, body.isAdmin);
  if (!business) {
    return NextResponse.json({ error: "Could not update admin access." }, { status: 400 });
  }

  await logAdminAction({
    adminId: auth.business.id,
    action: body.isAdmin ? "grant_admin" : "revoke_admin",
    entityType: "business",
    entityId: id,
    details: {
      business_name: business.business_name,
      phone: business.phone,
    },
  });

  return NextResponse.json({ business });
}
