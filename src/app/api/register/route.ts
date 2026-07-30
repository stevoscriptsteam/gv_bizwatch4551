import { NextResponse } from "next/server";
import { registerBusiness } from "@/lib/businesses";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    businessName?: string;
    phone?: string;
    email?: string;
    suburb?: string;
    referralSource?: string;
    referralOther?: string;
    acceptedTerms?: boolean;
  };

  const result = await registerBusiness({
    businessName: body.businessName ?? "",
    phone: body.phone ?? "",
    email: body.email ?? "",
    suburb: body.suburb,
    referralSource: body.referralSource,
    referralOther: body.referralOther,
    acceptedTerms: body.acceptedTerms === true,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
