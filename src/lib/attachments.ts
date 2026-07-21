import type { Business } from "@/lib/types";
import { getDb, getMediaBucket } from "@/lib/cloudflare";
import { generateId } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import {
  ALLOWED_MEDIA_TYPES,
  MAX_ATTACHMENTS_PER_REPORT,
  MAX_ATTACHMENT_BYTES,
  buildR2Key,
  detectMediaKind,
  type MediaKind,
} from "@/lib/media";

export type CrimeAttachment = {
  id: string;
  crime_id: string;
  business_id: string;
  r2_key: string;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  kind: MediaKind;
  created_at: string;
  deleted_at: string | null;
};

export function canAccessAttachments(
  viewer: Pick<Business, "id" | "is_admin">,
  crimeBusinessId: string,
): boolean {
  return viewer.id === crimeBusinessId || isAdmin(viewer);
}

export async function getCrimeBusinessId(crimeId: string): Promise<string | null> {
  const db = await getDb();
  const row = await db
    .prepare(
      `SELECT business_id FROM crimes
       WHERE id = ? AND deleted_at IS NULL AND archived_at IS NULL`,
    )
    .bind(crimeId)
    .first<{ business_id: string }>();

  return row?.business_id ?? null;
}

export async function countAttachments(crimeId: string): Promise<number> {
  const db = await getDb();
  const row = await db
    .prepare(
      `SELECT COUNT(*) as count FROM crime_attachments
       WHERE crime_id = ? AND deleted_at IS NULL`,
    )
    .bind(crimeId)
    .first<{ count: number }>();

  return row?.count ?? 0;
}

export async function listAttachments(crimeId: string): Promise<CrimeAttachment[]> {
  const db = await getDb();
  const result = await db
    .prepare(
      `SELECT * FROM crime_attachments
       WHERE crime_id = ? AND deleted_at IS NULL
       ORDER BY created_at ASC`,
    )
    .bind(crimeId)
    .all<CrimeAttachment>();

  return result.results ?? [];
}

export async function getAttachment(
  crimeId: string,
  attachmentId: string,
): Promise<CrimeAttachment | null> {
  const db = await getDb();
  return db
    .prepare(
      `SELECT * FROM crime_attachments
       WHERE id = ? AND crime_id = ? AND deleted_at IS NULL`,
    )
    .bind(attachmentId, crimeId)
    .first<CrimeAttachment>();
}

export async function createAttachment(input: {
  crimeId: string;
  businessId: string;
  file: File;
}): Promise<CrimeAttachment | { error: string }> {
  const { crimeId, businessId, file } = input;

  if (!ALLOWED_MEDIA_TYPES.has(file.type)) {
    return {
      error: "Unsupported file type. Upload JPEG, PNG, WebP, GIF, MP4, MOV or WebM.",
    };
  }

  if (file.size > MAX_ATTACHMENT_BYTES) {
    return { error: "Each file must be 50 MB or smaller." };
  }

  if (file.size === 0) {
    return { error: "Empty files cannot be uploaded." };
  }

  const existing = await countAttachments(crimeId);
  if (existing >= MAX_ATTACHMENTS_PER_REPORT) {
    return { error: `Maximum ${MAX_ATTACHMENTS_PER_REPORT} files per report.` };
  }

  const attachmentId = generateId("att");
  const r2Key = buildR2Key(crimeId, attachmentId, file.name);
  const kind = detectMediaKind(file.type);
  const bucket = await getMediaBucket();

  await bucket.put(r2Key, file.stream(), {
    httpMetadata: { contentType: file.type },
    customMetadata: {
      crimeId,
      businessId,
      originalFilename: file.name,
    },
  });

  const db = await getDb();
  await db
    .prepare(
      `INSERT INTO crime_attachments
       (id, crime_id, business_id, r2_key, original_filename, content_type, size_bytes, kind)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      attachmentId,
      crimeId,
      businessId,
      r2Key,
      file.name,
      file.type,
      file.size,
      kind,
    )
    .run();

  const attachment = await getAttachment(crimeId, attachmentId);
  if (!attachment) {
    return { error: "Upload saved but attachment record could not be loaded." };
  }

  return attachment;
}

export async function deleteAttachment(
  crimeId: string,
  attachmentId: string,
  businessId: string,
): Promise<boolean> {
  const attachment = await getAttachment(crimeId, attachmentId);
  if (!attachment || attachment.business_id !== businessId) {
    return false;
  }

  const bucket = await getMediaBucket();
  await bucket.delete(attachment.r2_key);

  const db = await getDb();
  const result = await db
    .prepare(
      `UPDATE crime_attachments
       SET deleted_at = datetime('now')
       WHERE id = ? AND crime_id = ? AND business_id = ? AND deleted_at IS NULL`,
    )
    .bind(attachmentId, crimeId, businessId)
    .run();

  return (result.meta.changes ?? 0) > 0;
}

export async function getAttachmentObject(attachment: CrimeAttachment) {
  const bucket = await getMediaBucket();
  return bucket.get(attachment.r2_key);
}
