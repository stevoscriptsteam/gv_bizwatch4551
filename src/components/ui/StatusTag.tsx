import type { ReportStatus } from "@/lib/types";
import { FaIcon } from "@/components/FaIcon";
import { STATUS_ICONS } from "@/lib/icons";

const config: Record<ReportStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "status-draft" },
  submitted: { label: "Submitted", className: "status-submitted" },
  under_review: { label: "Under review", className: "status-review" },
  information_requested: {
    label: "Information requested",
    className: "status-info",
  },
  completed: { label: "Completed", className: "status-completed" },
};

export function StatusTag({ status }: { status: ReportStatus }) {
  const { label, className } = config[status];
  return (
    <span className={`status-tag ${className}`}>
      <FaIcon icon={STATUS_ICONS[status]} className="status-tag-icon" aria-hidden />
      {label}
    </span>
  );
}
