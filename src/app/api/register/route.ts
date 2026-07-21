import { NextResponse } from "next/server";
import { registerBusiness } from "@/lib/businesses";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    businessName?: string;
    phone?: string;
    email?: string;
    suburb?: string;
  };

  const result = await registerBusiness({
    businessName: body.businessName ?? "",
    phone: body.phone ?? "",
    email: body.email ?? "",
    suburb: body.suburb,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
