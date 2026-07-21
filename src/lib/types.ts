export const REPORT_CATEGORIES = [
  {
    id: "theft",
    label: "Theft or shoplifting",
    description: "Stolen goods, shoplifting or missing property from your premises.",
  },
  {
    id: "aggressive",
    label: "Aggressive or threatening behaviour",
    description: "Verbal threats, intimidation or aggressive conduct toward staff or customers.",
  },
  {
    id: "assault",
    label: "Assault",
    description: "Physical assault or attempted assault on your premises.",
  },
  {
    id: "damage",
    label: "Property damage",
    description: "Vandalism, graffiti or damage to buildings, fixtures or equipment.",
  },
  {
    id: "suspicious",
    label: "Suspicious behaviour",
    description: "Unusual activity, loitering or behaviour that raises safety concerns.",
  },
  {
    id: "vehicle",
    label: "Vehicle-related incident",
    description: "Hit-and-run, dangerous driving or vehicle-related offences nearby.",
  },
  {
    id: "antisocial",
    label: "Antisocial behaviour",
    description: "Disruptive conduct affecting your business or customers.",
  },
  {
    id: "other",
    label: "Other safety concern",
    description: "Any other incident affecting the safety of staff, customers or premises.",
  },
] as const;

export type ReportCategoryId = (typeof REPORT_CATEGORIES)[number]["id"];

export const REPORT_STEPS = [
  "Incident details",
  "Location and time",
  "People or vehicles",
  "Evidence and attachments",
  "Contact preferences",
  "Review and submit",
] as const;

export type ReportStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "information_requested"
  | "completed";

export type Business = {
  id: string;
  business_name: string;
  phone: string;
  email: string;
  suburb: string | null;
  active: number;
  is_admin?: number;
  contact_list_visible?: number;
  created_at: string;
};

export type BusinessContact = {
  id: string;
  business_name: string;
  phone: string;
  suburb: string | null;
};

export const REACTION_TYPES = [
  "following",
  "also_affected",
  "seen_nearby",
  "have_information",
] as const;

export type ReactionType = (typeof REACTION_TYPES)[number];

export const REACTION_LABELS: Record<ReactionType, string> = {
  following: "Following",
  also_affected: "Also affected",
  seen_nearby: "Seen nearby",
  have_information: "I have information",
};

export const REACTION_DESCRIPTIONS: Record<ReactionType, string> = {
  following: "Notify me when this report is updated.",
  also_affected: "My business experienced the same or a related incident.",
  seen_nearby: "I witnessed the person, vehicle or activity nearby.",
  have_information: "I may have CCTV, photographs or other useful details.",
};

export type ReactionCounts = Record<ReactionType, number>;

export const ARTICLE_REACTION_TYPES = [
  "helpful",
  "interesting",
  "needs_more_detail",
] as const;

export type ArticleReactionType = (typeof ARTICLE_REACTION_TYPES)[number];

export const ARTICLE_REACTION_LABELS: Record<ArticleReactionType, string> = {
  helpful: "Helpful",
  interesting: "Interesting",
  needs_more_detail: "Needs more detail",
};

export const ARTICLE_REACTION_DESCRIPTIONS: Record<ArticleReactionType, string> = {
  helpful: "This article was useful for my business.",
  interesting: "This topic is worth reading and sharing.",
  needs_more_detail: "This article could include more detail or examples.",
};

export type ReactionParticipant = {
  business_id: string;
  business_name: string;
  created_at: string;
  is_own?: boolean;
};

export type ArticleReactionCounts = Record<ArticleReactionType, number>;

export type ReportComment = {
  id: string;
  crime_id: string;
  business_id: string;
  business_name: string;
  body: string;
  created_at: string;
  updated_at: string;
  is_own?: boolean;
};

export type ArticleComment = {
  id: string;
  article_id: string;
  business_id: string;
  business_name: string;
  body: string;
  created_at: string;
  updated_at: string;
  is_own?: boolean;
};

export type SafetyArticle = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  author_name: string;
  author_role: string | null;
  category: string;
  status: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  comment_count?: number;
  reactions?: ArticleReactionCounts;
  user_reaction?: ArticleReactionType | null;
};

export type SafetyArticleSummary = Omit<SafetyArticle, "body">;

export type EngagementState = {
  comment_count?: number;
  reactions?: ReactionCounts;
  user_reaction?: ReactionType | null;
};

export type ArticleEngagementState = {
  comment_count?: number;
  reactions?: ArticleReactionCounts;
  user_reaction?: ArticleReactionType | null;
};

export type Crime = {
  id: string;
  business_id: string;
  title: string;
  description: string;
  crime_type: string;
  location: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  category_id: string | null;
  suburb: string | null;
  postcode: string;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  archived_at?: string | null;
  archived_by?: string | null;
  business_name?: string;
  comment_count?: number;
  reactions?: ReactionCounts;
  user_reaction?: ReactionType | null;
  is_owner?: boolean;
};

export function emptyReactionCounts(): ReactionCounts {
  return {
    following: 0,
    also_affected: 0,
    seen_nearby: 0,
    have_information: 0,
  };
}

export function emptyArticleReactionCounts(): ArticleReactionCounts {
  return { helpful: 0, interesting: 0, needs_more_detail: 0 };
}

export type ReportStats = {
  allTime: number;
  last24Hours: number;
  topSuburb: { suburb: string; count: number } | null;
};

export type Alert = {
  id: string;
  business_id: string;
  crime_id: string;
  message: string;
  read: number;
  created_at: string;
  crime_title?: string;
  crime_type?: string;
};

export type ReportDraft = {
  step: number;
  category: ReportCategoryId | "";
  summary: string;
  incidentDate: string;
  incidentTime: string;
  address: string;
  suburb: string;
  latitude: number | null;
  longitude: number | null;
  locationNotes: string;
  peopleVehicles: string;
  evidenceNotes: string;
  contactPreference: "phone" | "email" | "either";
  contactNotes: string;
  savedAt: string;
};

export const POSTCODE_4551_SUBURBS = [
  "Caloundra",
  "Caloundra West",
  "Golden Beach",
  "Pelican Waters",
  "Moffat Beach",
  "Kings Beach",
  "Shelly Beach",
  "Battery Hill",
  "Aroona",
  "Baringa",
  "Bells Creek",
  "Currimundi",
  "Dicky Beach",
  "Little Mountain",
  "Meridan Plains",
  "Kawana Waters",
] as const;

export function formatReferenceNumber(crimeId: string): string {
  const short = crimeId.replace("crime-", "").slice(0, 8).toUpperCase();
  return `BW-4551-${short}`;
}

export function mapDbStatus(status: string): ReportStatus {
  switch (status) {
    case "reported":
      return "submitted";
    case "under_review":
      return "under_review";
    case "information_requested":
      return "information_requested";
    case "completed":
      return "completed";
    case "draft":
      return "draft";
    default:
      return "submitted";
  }
}

export function getCategoryLabel(id: string): string {
  return REPORT_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

// Legacy alias
export const CRIME_TYPES = REPORT_CATEGORIES.map((c) => c.label);
