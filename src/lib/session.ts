import { cookies } from "next/headers";
import type { SessionBusiness } from "@/lib/types";
import { getBusinessByPhone } from "@/lib/businesses";
import { resolveAccountByPhone } from "@/lib/members";
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

const MAX_OTP_REQUESTS_PER_WINDOW = 3;
const MAX_OTP_VERIFY_ATTEMPTS = 5;

export async function requestOtp(phoneInput: string) {
  const phone = normalizePhone(phoneInput);
  if (!phone) {
    return { ok: false as const, error: "Enter a valid Australian mobile number." };
  }

  const account = await resolveAccountByPhone(phone);
  if (!account) {
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

  const db = await getDb();

  const recent = await db
    .prepare(
      `SELECT COUNT(*) as count FROM otp_codes
       WHERE phone = ? AND created_at > datetime('now', '-10 minutes')`,
    )
    .bind(phone)
    .first<{ count: number }>();

  if ((recent?.count ?? 0) >= MAX_OTP_REQUESTS_PER_WINDOW) {
    return {
      ok: false as const,
      error: "Too many codes requested. Please wait a few minutes and try again.",
    };
  }

  const code = generateOtp();
  const codeHash = await hashToken(code);

  await db
    .prepare(
      "INSERT INTO otp_codes (id, phone, code_hash, expires_at) VALUES (?, ?, ?, ?)",
    )
    .bind(generateId("otp"), phone, codeHash, otpExpiry())
    .run();

  const smsSent = await sendOtpSms(phone, code);

  if (!smsSent && process.env.NODE_ENV === "production") {
    return {
      ok: false as const,
      error: "Could not send the verification code. Please try again shortly.",
    };
  }

  return {
    ok: true as const,
    phone,
    businessName: account.business.business_name,
    memberName: account.member?.name,
    // Only ever exposed in local development when SMS is not configured.
    devCode: smsSent ? undefined : code,
  };
}

export async function verifyOtp(phoneInput: string, code: string) {
  const phone = normalizePhone(phoneInput);
  if (!phone) {
    return { ok: false as const, error: "Invalid phone number." };
  }

  const account = await resolveAccountByPhone(phone);
  if (!account) {
    return { ok: false as const, error: "Business not found or not yet approved." };
  }
  const { business, member } = account;

  const codeHash = await hashToken(code.trim());
  const db = await getDb();

  const otp = await db
    .prepare(
      `SELECT id FROM otp_codes
       WHERE phone = ? AND code_hash = ? AND used = 0
         AND attempts < ? AND expires_at > datetime('now')
       ORDER BY created_at DESC LIMIT 1`,
    )
    .bind(phone, codeHash, MAX_OTP_VERIFY_ATTEMPTS)
    .first<{ id: string }>();

  if (!otp) {
    // Count the failure against every active code so the 6-digit space
    // cannot be brute-forced within the validity window.
    await db
      .prepare(
        "UPDATE otp_codes SET attempts = attempts + 1 WHERE phone = ? AND used = 0",
      )
      .bind(phone)
      .run();
    return { ok: false as const, error: "Invalid or expired code. Request a new one." };
  }

  await db
    .prepare("UPDATE otp_codes SET used = 1 WHERE phone = ? AND used = 0")
    .bind(phone)
    .run();

  if (!member && isMaster(business)) {
    await ensureMasterAdminFlag(business.id);
    business.is_admin = 1;
  }

  const token = generateSessionToken();
  const tokenHash = await hashToken(token);
  const sessionId = generateId("sess");

  await db
    .prepare(
      "INSERT INTO sessions (id, business_id, member_id, token_hash, expires_at) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(sessionId, business.id, member?.id ?? null, tokenHash, sessionExpiry())
    .run();

  const cookieStore = await cookies();
  cookieStore.set(
    getSessionCookieName(),
    token,
    sessionCookieOptions(getSessionMaxAge()),
  );

  return { ok: true as const, business };
}

export async function getCurrentBusiness(): Promise<SessionBusiness | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  if (!token) return null;

  const tokenHash = await hashToken(token);
  const db = await getDb();

  const row = await db
    .prepare(
      `SELECT b.*, m.id as member_id, m.name as member_name
       FROM sessions s
       JOIN businesses b ON b.id = s.business_id
       LEFT JOIN business_members m ON m.id = s.member_id AND m.active = 1
       WHERE s.token_hash = ? AND s.expires_at > datetime('now') AND b.active = 1
         AND (s.member_id IS NULL OR m.id IS NOT NULL)
       LIMIT 1`,
    )
    .bind(tokenHash)
    .first<SessionBusiness>();

  if (!row) return null;

  // Team members act on behalf of the business but never inherit admin rights.
  if (row.member_id) {
    row.is_admin = 0;
  }

  return row;
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
