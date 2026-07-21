"use client";

import { useRef } from "react";
import {
  ALLOWED_MEDIA_TYPES,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS_PER_REPORT,
  formatFileSize,
} from "@/lib/media";

const ACCEPT = Array.from(ALLOWED_MEDIA_TYPES).join(",");

type EvidenceUploadProps = {
  files: File[];
  onChange: (files: File[]) => void;
  error?: string;
};

export function EvidenceUpload({ files, onChange, error }: EvidenceUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(selected: FileList | null) {
    if (!selected?.length) return;

    const next = [...files];
    for (const file of Array.from(selected)) {
      if (next.length >= MAX_ATTACHMENTS_PER_REPORT) break;
      if (!ALLOWED_MEDIA_TYPES.has(file.type)) continue;
      if (file.size > MAX_ATTACHMENT_BYTES) continue;
      if (file.size === 0) continue;
      next.push(file);
    }
    onChange(next);
  }

  function removeFile(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div
        className="rounded-md border-2 border-dashed border-grey-300 bg-grey-50 p-8 text-center"
        role="region"
        aria-label="File upload area"
      >
        <p className="text-sm font-semibold text-grey-700">Photograph or CCTV upload</p>
        <p className="small-text mt-2">
          JPEG, PNG, WebP, GIF, MP4, MOV or WebM. Up to {MAX_ATTACHMENTS_PER_REPORT} files,
          50 MB each.
        </p>
        <button
          type="button"
          className="btn btn-secondary btn-sm mt-4"
          onClick={() => inputRef.current?.click()}
          disabled={files.length >= MAX_ATTACHMENTS_PER_REPORT}
        >
          Choose files
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="sr-only"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error ? (
        <p className="form-error mt-2" role="alert">
          {error}
        </p>
      ) : null}

      {files.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${file.size}-${index}`}
              className="flex items-center justify-between gap-3 rounded-md border border-grey-200 bg-white px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-grey-900">{file.name}</p>
                <p className="small-text">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm shrink-0"
                onClick={() => removeFile(index)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export async function uploadReportAttachments(
  crimeId: string,
  files: File[],
): Promise<{ uploaded: number; errors: string[] }> {
  const errors: string[] = [];
  let uploaded = 0;

  for (const file of files) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/crimes/${crimeId}/attachments`, {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      uploaded += 1;
      continue;
    }

    const data = (await res.json()) as { error?: string };
    errors.push(data.error ?? `Could not upload ${file.name}.`);
  }

  return { uploaded, errors };
}
