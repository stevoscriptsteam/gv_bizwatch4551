"use client";

import { useCallback, useRef } from "react";
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
  const crimeRef = useRef(crime);
  crimeRef.current = crime;
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  // Stable callback so EngagementPanel effects never re-subscribe on parent renders.
  const handleEngagementUpdate = useCallback(
    (patch: {
      comment_count?: number;
      reactions?: Record<string, number>;
      user_reaction?: string | null;
    }) => {
      const current = crimeRef.current;
      onUpdateRef.current?.({
        ...current,
        comment_count: patch.comment_count ?? current.comment_count,
        reactions: (patch.reactions as Crime["reactions"]) ?? current.reactions,
        user_reaction:
          (patch.user_reaction as Crime["user_reaction"]) ?? current.user_reaction,
      });
    },
    [],
  );

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
      onUpdate={handleEngagementUpdate}
    />
  );
}
