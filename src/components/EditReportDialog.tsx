"use client";

import { useState } from "react";
import type { Crime } from "@/lib/types";
import { POSTCODE_4551_SUBURBS } from "@/lib/types";
import { ReportAttachments } from "@/components/ReportAttachments";

type EditReportDialogProps = {
  crime: Crime;
  open: boolean;
  onClose: () => void;
  onSaved: (patch: Partial<Crime>) => void;
};

export function EditReportDialog({ open, ...props }: EditReportDialogProps) {
  // The form is mounted only while the dialog is open, so its state
  // initialises fresh from the crime on every open — no reset effect needed.
  if (!open) return null;
  return <EditReportDialogForm {...props} />;
}

function EditReportDialogForm({
  crime,
  onClose,
  onSaved,
}: Omit<EditReportDialogProps, "open">) {
  const [title, setTitle] = useState(crime.title);
  const [description, setDescription] = useState(crime.description);
  const [address, setAddress] = useState(crime.address || crime.location);
  const [suburb, setSuburb] = useState(crime.suburb ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/crimes/${crime.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, address, suburb }),
    });

    if (res.ok) {
      onSaved({ title, description, address, suburb, location: address });
      onClose();
    } else {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Could not update report.");
    }

    setSaving(false);
  };

  return (
    <div className="report-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="report-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-report-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="edit-report-title" className="card-heading">
          Edit report
        </h2>
        <p className="supporting-text">
          Update your report details. Other businesses will see the amended version.
        </p>

        <form className="report-edit-form" onSubmit={handleSubmit}>
          <label className="form-label">
            Summary
            <input
              className="input-field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
            />
          </label>

          <label className="form-label">
            Details
            <textarea
              className="input-field"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={5}
              maxLength={5000}
            />
          </label>

          <label className="form-label">
            Address
            <input
              className="input-field"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              maxLength={300}
            />
          </label>

          <label className="form-label">
            Suburb
            <select
              className="input-field select-field"
              value={suburb}
              onChange={(e) => setSuburb(e.target.value)}
              required
            >
              <option value="">Select suburb</option>
              {POSTCODE_4551_SUBURBS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <ReportAttachments crimeId={crime.id} editable />

          {error ? <p className="form-error">{error}</p> : null}

          <div className="report-dialog-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
