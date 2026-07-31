import { getDb, getEnv } from "@/lib/cloudflare";
import { sendSms } from "@/lib/twilio";
import {
  POSTCODE_4551_SUBURBS,
  REPORT_CATEGORIES,
  getCategoryLabel,
} from "@/lib/types";

export type NotificationPrefs = {
  enabled: boolean;
  categories: string[];
  suburbs: string[];
};

const VALID_CATEGORY_IDS = new Set<string>(REPORT_CATEGORIES.map((c) => c.id));
const VALID_SUBURBS = new Set<string>(POSTCODE_4551_SUBURBS);

export async function getNotificationPrefs(
  businessId: string,
): Promise<NotificationPrefs> {
  const db = await getDb();

  const [enabledRes, prefsRes] = await db.batch<Record<string, string | number>>([
    db
      .prepare("SELECT sms_alerts_enabled FROM businesses WHERE id = ?")
      .bind(businessId),
    db
      .prepare(
        "SELECT pref_type, value FROM notification_prefs WHERE business_id = ?",
      )
      .bind(businessId),
  ]);

  const categories: string[] = [];
  const suburbs: string[] = [];
  for (const row of prefsRes.results ?? []) {
    if (row.pref_type === "category") categories.push(row.value as string);
    else if (row.pref_type === "suburb") suburbs.push(row.value as string);
  }

  return {
    enabled: (enabledRes.results?.[0]?.sms_alerts_enabled ?? 0) === 1,
    categories,
    suburbs,
  };
}

export async function saveNotificationPrefs(
  businessId: string,
  input: NotificationPrefs,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const categories = [...new Set(input.categories)].filter((c) =>
    VALID_CATEGORY_IDS.has(c),
  );
  const suburbs = [...new Set(input.suburbs)].filter((s) => VALID_SUBURBS.has(s));

  if (input.enabled && categories.length === 0) {
    return {
      ok: false,
      error: "Select at least one incident type to receive SMS alerts.",
    };
  }
  if (input.enabled && suburbs.length === 0) {
    return {
      ok: false,
      error: "Select at least one suburb to receive SMS alerts.",
    };
  }

  const db = await getDb();

  const statements = [
    db
      .prepare("UPDATE businesses SET sms_alerts_enabled = ? WHERE id = ?")
      .bind(input.enabled ? 1 : 0, businessId),
    db
      .prepare("DELETE FROM notification_prefs WHERE business_id = ?")
      .bind(businessId),
    ...categories.map((value) =>
      db
        .prepare(
          "INSERT INTO notification_prefs (business_id, pref_type, value) VALUES (?, 'category', ?)",
        )
        .bind(businessId, value),
    ),
    ...suburbs.map((value) =>
      db
        .prepare(
          "INSERT INTO notification_prefs (business_id, pref_type, value) VALUES (?, 'suburb', ?)",
        )
        .bind(businessId, value),
    ),
  ];

  await db.batch(statements);

  return { ok: true };
}

/**
 * Sends SMS alerts to every business that opted in to the report's
 * category AND suburb. Runs in the background (via waitUntil) after a
 * report is created so submission is never blocked on SMS delivery.
 */
export async function sendCrimeAlertSmsFanout(input: {
  reporterBusinessId: string;
  categoryId: string | null;
  suburb: string | null;
}): Promise<void> {
  if (!input.categoryId || !input.suburb) return;

  const db = await getDb();
  const recipients = await db
    .prepare(
      `SELECT b.phone FROM businesses b
       WHERE b.active = 1 AND b.sms_alerts_enabled = 1 AND b.id != ?
         AND EXISTS (
           SELECT 1 FROM notification_prefs p
           WHERE p.business_id = b.id AND p.pref_type = 'category' AND p.value = ?
         )
         AND EXISTS (
           SELECT 1 FROM notification_prefs p
           WHERE p.business_id = b.id AND p.pref_type = 'suburb' AND p.value = ?
         )`,
    )
    .bind(input.reporterBusinessId, input.categoryId, input.suburb)
    .all<{ phone: string }>();

  const phones = (recipients.results ?? []).map((r) => r.phone);
  if (phones.length === 0) return;

  const env = await getEnv();
  const label = getCategoryLabel(input.categoryId);
  const link = env.APP_URL ? ` View details: ${env.APP_URL}/reports` : "";
  const body = `BizWatch alert: ${label} reported in ${input.suburb}.${link} Manage SMS alerts in your BizWatch profile.`;

  const results = await Promise.allSettled(
    phones.map((phone) => sendSms(phone, body)),
  );

  const failed = results.filter(
    (r) => r.status === "rejected" || !r.value.ok,
  ).length;
  if (failed > 0) {
    console.error(`SMS alert fan-out: ${failed}/${phones.length} sends failed.`);
  }
}

/**
 * Notifies every admin business owner and their active staff when a new
 * registration request is submitted, so they can review it in Admin → Requests.
 */
export async function sendRegistrationRequestSmsFanout(input: {
  businessName: string;
  suburb?: string | null;
}): Promise<void> {
  const db = await getDb();

  const [ownersRes, staffRes] = await db.batch<{ phone: string }>([
    db.prepare(
      `SELECT phone FROM businesses
       WHERE active = 1 AND is_admin = 1 AND phone IS NOT NULL AND TRIM(phone) != ''`,
    ),
    db.prepare(
      `SELECT m.phone
       FROM business_members m
       JOIN businesses b ON b.id = m.business_id
       WHERE b.active = 1 AND b.is_admin = 1
         AND m.active = 1
         AND m.phone IS NOT NULL AND TRIM(m.phone) != ''`,
    ),
  ]);

  const phones = [
    ...new Set(
      [...(ownersRes.results ?? []), ...(staffRes.results ?? [])]
        .map((row) => row.phone)
        .filter(Boolean),
    ),
  ];

  if (phones.length === 0) return;

  const env = await getEnv();
  const name = input.businessName
    .replace(/[\r\n\t\v\f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  const suburb = (input.suburb ?? "")
    .replace(/[\r\n\t\v\f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
  const place = suburb ? ` (${suburb})` : "";
  const link = env.APP_URL ? ` Review: ${env.APP_URL}/admin` : "";
  const body = `BizWatch 4551: New registration request from ${name || "a business"}${place}.${link}`;

  const results = await Promise.allSettled(
    phones.map((phone) => sendSms(phone, body)),
  );

  const failed = results.filter(
    (r) => r.status === "rejected" || !r.value.ok,
  ).length;
  if (failed > 0) {
    console.error(
      `Registration request SMS fan-out: ${failed}/${phones.length} sends failed.`,
    );
  }
}
