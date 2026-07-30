"use client";

import { useState } from "react";
import type { Crime } from "@/lib/types";
import { REPORT_FLAG_DISCLAIMER } from "@/lib/types";

type ReportFlagControlsProps = {
  crime: Crime;
  onUpdate: (crime: Crime) => void;
  onArchived: (crimeId: string) => void;
};

export function ReportFlagControls({
  crime,
  onUpdate,
  onArchived,
}: ReportFlagControlsProps) {
  const [busy, setBusy] = useState(false);
  const flagCount = crime.flag_count ?? 0;
  const hasFlagged = !!crime.user_has_flagged;

  if (crime.is_owner) {
    if (flagCount <= 0) return null;
    return (
      <div className="report-flag-controls">
        <aside className="report-flag-disclaimer" role="note">
          <p>{REPORT_FLAG_DISCLAIMER}</p>
          <p className="report-flag-disclaimer-meta">
            Flagged by {flagCount} {flagCount === 1 ? "business" : "businesses"}.
          </p>
        </aside>
      </div>
    );
  }

  async function handleFlag() {
    const confirmed = window.confirm(
      "Flag this report as false or fraudulent?\n\nIf three or more businesses flag it, the report will be removed from the feed until an admin reviews it.",
    );
    if (!confirmed || busy) return;

    setBusy(true);
    const res = await fetch(`/api/crimes/${crime.id}/flags`, { method: "POST" });
    const data = (await res.json()) as {
      error?: string;
      flagCount?: number;
      userHasFlagged?: boolean;
      archived?: boolean;
    };
    setBusy(false);

    if (!res.ok) {
      window.alert(data.error ?? "Could not flag this report.");
      return;
    }

    if (data.archived) {
      onArchived(crime.id);
      window.alert(
        "This report has been removed for admin review because it received multiple community flags.",
      );
      return;
    }

    onUpdate({
      ...crime,
      flag_count: data.flagCount ?? flagCount + 1,
      user_has_flagged: true,
    });
  }

  async function handleUnflag() {
    if (busy) return;
    setBusy(true);
    const res = await fetch(`/api/crimes/${crime.id}/flags`, { method: "DELETE" });
    const data = (await res.json()) as {
      error?: string;
      flagCount?: number;
      userHasFlagged?: boolean;
    };
    setBusy(false);

    if (!res.ok) {
      window.alert(data.error ?? "Could not remove your flag.");
      return;
    }

    onUpdate({
      ...crime,
      flag_count: data.flagCount ?? Math.max(0, flagCount - 1),
      user_has_flagged: false,
    });
  }

  return (
    <div className="report-flag-controls">
      {flagCount > 0 ? (
        <aside className="report-flag-disclaimer" role="note">
          <p>{REPORT_FLAG_DISCLAIMER}</p>
          <p className="report-flag-disclaimer-meta">
            Flagged by {flagCount} {flagCount === 1 ? "business" : "businesses"}.
          </p>
        </aside>
      ) : null}

      {hasFlagged ? (
        <button
          type="button"
          className="report-flag-link"
          disabled={busy}
          onClick={() => void handleUnflag()}
        >
          {busy ? "Updating…" : "Remove your flag"}
        </button>
      ) : (
        <button
          type="button"
          className="report-flag-link"
          disabled={busy}
          onClick={() => void handleFlag()}
        >
          {busy ? "Flagging…" : "Flag as inaccurate"}
        </button>
      )}
    </div>
  );
}
