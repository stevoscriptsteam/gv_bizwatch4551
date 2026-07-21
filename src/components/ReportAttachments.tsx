"use client";

import { useCallback, useEffect, useState } from "react";
import type { CrimeAttachment } from "@/lib/attachments";
import { formatFileSize } from "@/lib/media";
import { uploadReportAttachments } from "@/components/EvidenceUpload";

type ReportAttachmentsProps = {
  crimeId: string;
  editable?: boolean;
};

export function ReportAttachments({ crimeId, editable = false }: ReportAttachmentsProps) {
  const [attachments, setAttachments] = useState<CrimeAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/crimes/${crimeId}/attachments`);
    if (res.ok) {
      const data = (await res.json()) as { attachments: CrimeAttachment[] };
      setAttachments(data.attachments);
      setError(null);
    } else {
      setAttachments([]);
    }
    setLoading(false);
  }, [crimeId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleAddFiles(selected: FileList | null) {
    if (!selected?.length) return;

    setUploading(true);
    setError(null);
    const result = await uploadReportAttachments(crimeId, Array.from(selected));
    await refresh();
    setUploading(false);

    if (result.errors.length > 0) {
      setError(result.errors.join(" "));
    }
  }

  async function handleDelete(attachmentId: string) {
    const confirmed = window.confirm("Remove this file from the report?");
    if (!confirmed) return;

    const res = await fetch(`/api/crimes/${crimeId}/attachments/${attachmentId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setAttachments((prev) => prev.filter((item) => item.id !== attachmentId));
      return;
    }

    setError("Could not remove attachment.");
  }

  if (loading) {
    return <p className="small-text">Loading attachments…</p>;
  }

  return (
    <div className="report-attachments">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-grey-800">Evidence files</h3>
        {editable ? (
          <label className="btn btn-secondary btn-sm cursor-pointer">
            {uploading ? "Uploading…" : "Add files"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
              multiple
              className="sr-only"
              disabled={uploading}
              onChange={(e) => {
                void handleAddFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        ) : null}
      </div>

      <p className="small-text mb-3">
        Evidence is private — only you and BizWatch coordinators can view these files.
      </p>

      {error ? (
        <p className="form-error mb-3" role="alert">
          {error}
        </p>
      ) : null}

      {attachments.length === 0 ? (
        <p className="small-text text-grey-600">No files attached yet.</p>
      ) : (
        <ul className="space-y-2">
          {attachments.map((attachment) => {
            const href = `/api/crimes/${crimeId}/attachments/${attachment.id}`;
            return (
              <li
                key={attachment.id}
                className="flex items-center gap-3 rounded-md border border-grey-200 bg-grey-50 p-3"
              >
                {attachment.kind === "photo" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={href}
                    alt={attachment.original_filename}
                    className="h-14 w-14 shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-grey-200 text-xs font-semibold uppercase text-grey-700">
                    {attachment.kind}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-sm font-medium text-navy-900 hover:underline"
                  >
                    {attachment.original_filename}
                  </a>
                  <p className="small-text">{formatFileSize(attachment.size_bytes)}</p>
                </div>
                {editable ? (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm shrink-0"
                    onClick={() => void handleDelete(attachment.id)}
                  >
                    Remove
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
