import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { phone?: string; code?: string };
    if (!body.phone?.trim() || !body.code?.trim()) {
      return NextResponse.json(
        { error: "Phone and verification code are required." },
        { status: 400 },
      );
    }

    const result = await verifyOtp(body.phone, body.code);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json({
      ok: true,
      business: {
        id: result.business.id,
        business_name: result.business.business_name,
        suburb: result.business.suburb,
      },
    });
  } catch {
    return NextResponse.json({ error: "Unable to verify code." }, { status: 500 });
  }
}
