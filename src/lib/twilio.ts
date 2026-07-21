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

  const sid = env.TWILIO_ACCOUNT_SID;
  const token = env.TWILIO_AUTH_TOKEN;
  const from = env.TWILIO_FROM_NUMBER;

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
