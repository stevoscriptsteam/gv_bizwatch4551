import type {
  Crime,
  ReactionCounts,
  ReactionParticipant,
  ReactionType,
  ReportComment,
} from "@/lib/types";
import { emptyReactionCounts } from "@/lib/types";
import { getDb } from "@/lib/cloudflare";
import {
  REPORT_ENGAGEMENT,
  addEngagementComment,
  deleteEngagementComment,
  enrichWithEngagement,
  getEngagementReactionCounts,
  listEngagementComments,
  listEngagementReactors,
  setEngagementReaction,
  updateEngagementComment,
} from "@/lib/engagement";

export async function getCrimeById(crimeId: string): Promise<Crime | null> {
  const db = await getDb();
  return db
    .prepare(
      `SELECT c.*, b.business_name
       FROM crimes c
       JOIN businesses b ON b.id = c.business_id
       WHERE c.id = ? AND c.deleted_at IS NULL AND c.archived_at IS NULL`,
    )
    .bind(crimeId)
    .first<Crime>();
}

export async function updateCrime(
  crimeId: string,
  businessId: string,
  input: {
    title: string;
    description: string;
    address: string;
    suburb: string;
  },
): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .prepare(
      `UPDATE crimes
       SET title = ?, description = ?, location = ?, address = ?, suburb = ?,
           updated_at = datetime('now')
       WHERE id = ? AND business_id = ? AND deleted_at IS NULL`,
    )
    .bind(
      input.title,
      input.description,
      input.address,
      input.address,
      input.suburb,
      crimeId,
      businessId,
    )
    .run();

  return (result.meta.changes ?? 0) > 0;
}

export async function deleteCrime(
  crimeId: string,
  businessId: string,
): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .prepare(
      `UPDATE crimes SET deleted_at = datetime('now'), updated_at = datetime('now')
       WHERE id = ? AND business_id = ? AND deleted_at IS NULL`,
    )
    .bind(crimeId, businessId)
    .run();

  return (result.meta.changes ?? 0) > 0;
}

export async function enrichCrimesWithEngagement(
  crimes: Crime[],
  viewerBusinessId: string,
): Promise<Crime[]> {
  const enriched = await enrichWithEngagement<Crime, ReactionType, ReactionCounts>(
    REPORT_ENGAGEMENT,
    crimes,
    viewerBusinessId,
    emptyReactionCounts,
  );

  return enriched.map((crime) => ({
    ...crime,
    is_owner: crime.business_id === viewerBusinessId,
  }));
}

export async function listComments(
  crimeId: string,
  viewerBusinessId: string,
): Promise<ReportComment[]> {
  return listEngagementComments<ReportComment>(
    REPORT_ENGAGEMENT,
    crimeId,
    viewerBusinessId,
  );
}

export async function addComment(
  crimeId: string,
  businessId: string,
  body: string,
  memberId?: string | null,
): Promise<ReportComment | null> {
  const crime = await getCrimeById(crimeId);
  if (!crime) return null;

  return addEngagementComment<ReportComment>(
    REPORT_ENGAGEMENT,
    crimeId,
    businessId,
    body,
    memberId,
  );
}

export async function updateComment(
  commentId: string,
  businessId: string,
  body: string,
): Promise<boolean> {
  return updateEngagementComment(REPORT_ENGAGEMENT, commentId, businessId, body);
}

export async function deleteComment(
  commentId: string,
  businessId: string,
): Promise<boolean> {
  return deleteEngagementComment(REPORT_ENGAGEMENT, commentId, businessId);
}

export async function setReaction(
  crimeId: string,
  businessId: string,
  reactionType: ReactionType | null,
): Promise<{ counts: ReactionCounts; userReaction: ReactionType | null } | null> {
  const crime = await getCrimeById(crimeId);
  if (!crime) return null;

  return setEngagementReaction(
    REPORT_ENGAGEMENT,
    crimeId,
    businessId,
    reactionType,
    emptyReactionCounts,
  );
}

export async function getReactionCounts(
  crimeId: string,
): Promise<ReactionCounts> {
  return getEngagementReactionCounts(
    REPORT_ENGAGEMENT,
    crimeId,
    emptyReactionCounts,
  );
}

export async function listReportReactors(
  crimeId: string,
  viewerBusinessId: string,
): Promise<Record<string, ReactionParticipant[]> | null> {
  const crime = await getCrimeById(crimeId);
  if (!crime) return null;

  return listEngagementReactors(REPORT_ENGAGEMENT, crimeId, viewerBusinessId);
}
