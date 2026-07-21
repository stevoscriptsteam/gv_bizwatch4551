import { getEnv } from "@/lib/cloudflare";

export type SendSmsResult = {
  ok: boolean;
  error?: string;
};

export async function sendSms(
  to: string,
  body: string,
): Promise<SendSmsResult> {
  const env = await getEnv();

  // Prefer Worker secrets/bindings; fall back to process.env for local/OpenNext.
  const sid = env.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID;
  const token = env.TWILIO_AUTH_TOKEN || process.env.TWILIO_AUTH_TOKEN;
  const from = env.TWILIO_FROM_NUMBER || process.env.TWILIO_FROM_NUMBER;

  if (!sid || !token || !from) {
    return { ok: false, error: "Twilio is not configured." };
  }

  const auth = btoa(`${sid}:${token}`);

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: to, From: from, Body: body }),
      },
    );

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error("Twilio SMS failed:", response.status, text.slice(0, 200));
      return { ok: false, error: "SMS delivery failed." };
    }

    return { ok: true };
  } catch (error) {
    console.error("Twilio SMS error:", error);
    return { ok: false, error: "SMS delivery failed." };
  }
}

export async function sendOtpSms(
  phone: string,
  code: string,
): Promise<boolean> {
  const body = `BizWatch 4551 login code: ${code}. Valid for 10 minutes. Do not share.`;
  const result = await sendSms(phone, body);
  return result.ok;
}

export async function sendRegistrationSms(input: {
  phone: string;
  approvedBy: string;
  reference: string;
}): Promise<SendSmsResult> {
  // Keep SMS as a fixed 4-line template: strip control chars / newlines so a
  // crafted reference cannot inject extra "Approved by:" lines.
  const sanitize = (value: string, max: number) =>
    value.replace(/[\r\n\t\v\f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

  const approvedBy = sanitize(input.approvedBy, 120) || "BizWatch";
  const reference =
    sanitize(input.reference, 300) || "Your registration has been approved.";
  const body = [
    "You have been registered for BizWatch 4551",
    "",
    `Approved by: ${approvedBy}`,
    `Reference: ${reference}`,
  ].join("\n");

  return sendSms(input.phone, body);
}
