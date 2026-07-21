import { cookies } from "next/headers";
import type { Business } from "@/lib/types";
import { getActiveBusinessByPhone, getBusinessByPhone } from "@/lib/businesses";
import { getDb } from "@/lib/cloudflare";
import {
  generateId,
  generateOtp,
  generateSessionToken,
  getSessionCookieName,
  getSessionMaxAge,
  hashToken,
  otpExpiry,
  sessionCookieOptions,
  sessionExpiry,
} from "@/lib/auth";
import { ensureMasterAdminFlag, isMaster } from "@/lib/admin";
import { normalizePhone } from "@/lib/phone";
import { sendOtpSms } from "@/lib/twilio";

export async function requestOtp(phoneInput: string) {
  const phone = normalizePhone(phoneInput);
  if (!phone) {
    return { ok: false as const, error: "Enter a valid Australian mobile number." };
  }

  const business = await getActiveBusinessByPhone(phone);
  if (!business) {
    const pending = await getBusinessByPhone(phone);
    if (pending && !pending.active) {
      return {
        ok: false as const,
        error:
          "Your registration is pending approval. You will be able to sign in once your business has been approved.",
      };
    }

    return {
      ok: false as const,
      error:
        "This number is not registered. Register your business to apply for access.",
    };
  }

  const code = generateOtp();
  const codeHash = await hashToken(code);
  const db = await getDb();

  await db
    .prepare(
      "INSERT INTO otp_codes (id, phone, code_hash, expires_at) VALUES (?, ?, ?, ?)",
    )
    .bind(generateId("otp"), phone, codeHash, otpExpiry())
    .run();

  const smsSent = await sendOtpSms(phone, code);

  return {
    ok: true as const,
    phone,
    businessName: business.business_name,
    devCode: smsSent ? undefined : code,
  };
}

export async function verifyOtp(phoneInput: string, code: string) {
  const phone = normalizePhone(phoneInput);
  if (!phone) {
    return { ok: false as const, error: "Invalid phone number." };
  }

  const business = await getActiveBusinessByPhone(phone);
  if (!business) {
    return { ok: false as const, error: "Business not found or not yet approved." };
  }

  const codeHash = await hashToken(code.trim());
  const db = await getDb();

  const otp = await db
    .prepare(
      `SELECT * FROM otp_codes
       WHERE phone = ? AND code_hash = ? AND used = 0 AND expires_at > datetime('now')
       ORDER BY created_at DESC LIMIT 1`,
    )
    .bind(phone, codeHash)
    .first<{ id: string }>();

  if (!otp) {
    return { ok: false as const, error: "Invalid or expired code. Request a new one." };
  }

  await db
    .prepare("UPDATE otp_codes SET used = 1 WHERE id = ?")
    .bind(otp.id)
    .run();

  if (isMaster(business)) {
    await ensureMasterAdminFlag(business.id);
    business.is_admin = 1;
  }

  const token = generateSessionToken();
  const tokenHash = await hashToken(token);
  const sessionId = generateId("sess");

  await db
    .prepare(
      "INSERT INTO sessions (id, business_id, token_hash, expires_at) VALUES (?, ?, ?, ?)",
    )
    .bind(sessionId, business.id, tokenHash, sessionExpiry())
    .run();

  const cookieStore = await cookies();
  cookieStore.set(
    getSessionCookieName(),
    token,
    sessionCookieOptions(getSessionMaxAge()),
  );

  return { ok: true as const, business };
}

export async function getCurrentBusiness(): Promise<Business | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  if (!token) return null;

  const tokenHash = await hashToken(token);
  const db = await getDb();

  const row = await db
    .prepare(
      `SELECT b.* FROM sessions s
       JOIN businesses b ON b.id = s.business_id
       WHERE s.token_hash = ? AND s.expires_at > datetime('now') AND b.active = 1
       LIMIT 1`,
    )
    .bind(tokenHash)
    .first<Business>();

  return row ?? null;
}

export async function logout() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;

  if (token) {
    const tokenHash = await hashToken(token);
    const db = await getDb();
    await db
      .prepare("DELETE FROM sessions WHERE token_hash = ?")
      .bind(tokenHash)
      .run();
  }

  cookieStore.delete(getSessionCookieName());
}
