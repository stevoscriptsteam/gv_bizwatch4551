export type ChangelogEntry = {
  /** Stable id used for “seen” tracking — use the release date or version. */
  id: string;
  date: string;
  title: string;
  summary: string;
  changes: string[];
};

/**
 * Product update notes shown on /updates.
 * Add a new entry at the top when you ship a release.
 */
export const CHANGELOG: ChangelogEntry[] = [
  {
    id: "2026-07-30",
    date: "30 July 2026",
    title: "Community tools and clearer reporting",
    summary:
      "New ways to manage your team, review registration requests, and keep the feed accurate.",
    changes: [
      "Manage team from your account menu — add or remove staff with their own sign-in.",
      "Reports show who submitted them, including staff names where relevant.",
      "Flag inaccurate reports; a disclaimer appears after the first flag, and three flags remove the report for admin review.",
      "Community Admins now have an requests tab for pending business registrations, with a badge when new requests arrive.",
      "Updated public About and landing page content.",
    ],
  },
];

export function getLatestChangelogId(): string | null {
  return CHANGELOG[0]?.id ?? null;
}
