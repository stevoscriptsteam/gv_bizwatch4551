import { NextResponse } from "next/server";
import { requestOtp } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { phone?: string };
    if (!body.phone?.trim()) {
      return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
    }

    const result = await requestOtp(body.phone);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }

    return NextResponse.json({
      ok: true,
      phone: result.phone,
      businessName: result.businessName,
      memberName: result.memberName,
      devCode: result.devCode,
    });
  } catch {
    return NextResponse.json({ error: "Unable to send code." }, { status: 500 });
  }
}
