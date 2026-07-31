import { getDb, runInBackground } from "@/lib/cloudflare";
import { generateId } from "@/lib/auth";
import { normalizePhone } from "@/lib/phone";
import type { Business, BusinessContact, ReferralSourceId } from "@/lib/types";
import { REFERRAL_SOURCES } from "@/lib/types";
import { sendRegistrationRequestSmsFanout } from "@/lib/notifications";

const REFERRAL_SOURCE_IDS = new Set<string>(REFERRAL_SOURCES.map((item) => item.id));

export function validateBusinessFields(input: {
  businessName: string;
  email: string;
  suburb?: string;
}): string | null {
  if (!input.businessName.trim()) {
    return "Business name is required.";
  }
  if (input.businessName.length > 200) {
    return "Business name is too long (max 200 characters).";
  }
  if (!input.email.trim() || !input.email.includes("@")) {
    return "Enter a valid email address.";
  }
  if (input.email.length > 320) {
    return "Email address is too long.";
  }
  if ((input.suburb?.length ?? 0) > 100) {
    return "Suburb is too long.";
  }
  return null;
}

function validateReferralSource(input: {
  referralSource?: string;
  referralOther?: string;
}): { source: ReferralSourceId; other: string | null } | { error: string } {
  const source = input.referralSource?.trim() ?? "";
  if (!REFERRAL_SOURCE_IDS.has(source)) {
    return { error: "Please tell us how you found out about BizWatch." };
  }

  if (source === "other") {
    const other = input.referralOther?.trim() ?? "";
    if (!other) {
      return { error: "Please tell us where you heard about BizWatch." };
    }
    if (other.length > 200) {
      return { error: "That answer is too long (max 200 characters)." };
    }
    return { source: "other", other };
  }

  return { source: source as ReferralSourceId, other: null };
}

export async function getBusinessByPhone(phone: string): Promise<Business | null> {
  const db = await getDb();
  return db
    .prepare("SELECT * FROM businesses WHERE phone = ? LIMIT 1")
    .bind(phone)
    .first<Business>();
}

export async function getActiveBusinessByPhone(
  phone: string,
): Promise<Business | null> {
  const db = await getDb();
  return db
    .prepare("SELECT * FROM businesses WHERE phone = ? AND active = 1 LIMIT 1")
    .bind(phone)
    .first<Business>();
}

export async function registerBusiness(input: {
  businessName: string;
  phone: string;
  email: string;
  suburb?: string;
  referralSource?: string;
  referralOther?: string;
  acceptedTerms?: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const phone = normalizePhone(input.phone);
  if (!phone) {
    return { ok: false, error: "Enter a valid Australian mobile number." };
  }

  const fieldError = validateBusinessFields(input);
  if (fieldError) {
    return { ok: false, error: fieldError };
  }

  if (!input.acceptedTerms) {
    return {
      ok: false,
      error: "You must accept the Privacy Policy and Terms of Use to register.",
    };
  }

  const referral = validateReferralSource(input);
  if ("error" in referral) {
    return { ok: false, error: referral.error };
  }

  const existing = await getBusinessByPhone(phone);
  if (existing) {
    if (existing.active) {
      return {
        ok: false,
        error: "This mobile number is already registered. Sign in to access your account.",
      };
    }
    return {
      ok: false,
      error:
        "A registration for this mobile number is already pending approval. We will contact you once your application is reviewed.",
    };
  }

  const db = await getDb();
  const id = generateId("biz");

  try {
    await db
      .prepare(
        `INSERT INTO businesses
          (id, business_name, phone, email, suburb, referral_source, referral_other, terms_accepted_at, active)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), 0)`,
      )
      .bind(
        id,
        input.businessName.trim(),
        phone,
        input.email.trim().toLowerCase(),
        input.suburb?.trim() || null,
        referral.source,
        referral.other,
      )
      .run();
  } catch {
    return {
      ok: false,
      error: "Could not submit registration. Please try again or contact us.",
    };
  }

  const businessName = input.businessName.trim();
  const suburb = input.suburb?.trim() || null;
  await runInBackground(() =>
    sendRegistrationRequestSmsFanout({
      businessName,
      suburb,
    }),
  );

  return { ok: true };
}

export async function listContactListBusinesses(): Promise<BusinessContact[]> {
  const db = await getDb();
  const result = await db
    .prepare(
      `SELECT id, business_name, phone, suburb
       FROM businesses
       WHERE active = 1 AND contact_list_visible = 1
       ORDER BY business_name COLLATE NOCASE ASC`,
    )
    .all<BusinessContact>();

  return result.results ?? [];
}

export async function updateBusinessProfile(
  businessId: string,
  input: {
    businessName: string;
    email: string;
    suburb?: string;
    contactListVisible: boolean;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const fieldError = validateBusinessFields(input);
  if (fieldError) {
    return { ok: false, error: fieldError };
  }

  const db = await getDb();
  const result = await db
    .prepare(
      `UPDATE businesses
       SET business_name = ?, email = ?, suburb = ?, contact_list_visible = ?
       WHERE id = ? AND active = 1`,
    )
    .bind(
      input.businessName.trim(),
      input.email.trim().toLowerCase(),
      input.suburb?.trim() || null,
      input.contactListVisible ? 1 : 0,
      businessId,
    )
    .run();

  if (!result.meta.changes) {
    return { ok: false, error: "Could not update profile." };
  }

  return { ok: true };
}
