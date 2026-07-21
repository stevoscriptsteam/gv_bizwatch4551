import { NextResponse } from "next/server";
import {
  getNotificationPrefs,
  saveNotificationPrefs,
} from "@/lib/notifications";
import { getCurrentBusiness } from "@/lib/session";

export async function GET() {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prefs = await getNotificationPrefs(business.id);
  return NextResponse.json({ prefs });
}

export async function PUT(request: Request) {
  const business = await getCurrentBusiness();
  if (!business) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    enabled?: boolean;
    categories?: string[];
    suburbs?: string[];
  };

  const result = await saveNotificationPrefs(business.id, {
    enabled: body.enabled === true,
    categories: Array.isArray(body.categories) ? body.categories : [],
    suburbs: Array.isArray(body.suburbs) ? body.suburbs : [],
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const prefs = await getNotificationPrefs(business.id);
  return NextResponse.json({ ok: true, prefs });
}
