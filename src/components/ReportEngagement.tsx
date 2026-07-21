"use client";

import type { Crime } from "@/lib/types";
import {
  EngagementPanel,
  REPORT_COMMENTS_LABELS,
} from "@/components/EngagementPanel";

type ReportEngagementProps = {
  crime: Crime;
  onUpdate?: (crime: Crime) => void;
};

export function ReportEngagement({ crime, onUpdate }: ReportEngagementProps) {
  return (
    <EngagementPanel
      targetId={crime.id}
      apiBasePath={`/api/crimes/${crime.id}`}
      initialEngagement={{
        comment_count: crime.comment_count,
        reactions: crime.reactions,
        user_reaction: crime.user_reaction,
      }}
      commentsLabels={REPORT_COMMENTS_LABELS}
      commentsAlwaysOpen
      commentPlaceholder="Share an update, extra detail, CCTV note, or related information for other local businesses…"
      onUpdate={(patch) =>
        onUpdate?.({
          ...crime,
          comment_count: patch.comment_count ?? crime.comment_count,
          reactions: (patch.reactions as Crime["reactions"]) ?? crime.reactions,
          user_reaction: (patch.user_reaction as Crime["user_reaction"]) ?? crime.user_reaction,
        })
      }
    />
  );
}
