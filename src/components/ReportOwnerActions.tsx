"use client";

import { useState } from "react";
import type { Crime } from "@/lib/types";
import { EditReportDialog } from "@/components/EditReportDialog";

type ReportOwnerActionsProps = {
  crime: Crime;
  onUpdated: (crime: Crime) => void;
  onDeleted: (crimeId: string) => void;
  compact?: boolean;
};

export function ReportOwnerActions({
  crime,
  onUpdated,
  onDeleted,
  compact = false,
}: ReportOwnerActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Delete this report? It will be removed from the feed and map for all businesses.",
    );
    if (!confirmed) return;

    setDeleting(true);
    const res = await fetch(`/api/crimes/${crime.id}`, { method: "DELETE" });
    if (res.ok) {
      onDeleted(crime.id);
    } else {
      window.alert("Could not delete report. Please try again.");
    }
    setDeleting(false);
  };

  return (
    <>
      <div className={`report-owner-actions${compact ? " report-owner-actions--compact" : ""}`}>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setEditOpen(true)}
        >
          Edit
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm report-owner-delete"
          onClick={() => void handleDelete()}
          disabled={deleting}
        >
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>

      <EditReportDialog
        crime={crime}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={(patch) =>
          onUpdated({
            ...crime,
            ...patch,
            updated_at: new Date().toISOString(),
          })
        }
      />
    </>
  );
}
