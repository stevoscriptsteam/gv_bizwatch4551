import { StatusTag } from "@/components/ui/StatusTag";
import type { ReportStatus } from "@/lib/types";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function LocalAlertCard({
  category,
  location,
  date,
  summary,
  status = "submitted",
  safetyAdvice,
  reference,
  unread,
  onMarkRead,
}: {
  category: string;
  location: string;
  date: string;
  summary: string;
  status?: ReportStatus;
  safetyAdvice?: string;
  reference?: string;
  unread?: boolean;
  onMarkRead?: () => void;
}) {
  return (
    <article
      className={`card ${unread ? "border-l-4 border-l-teal-600" : ""}`}
      aria-label={`Reported incident: ${category}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <span className="category-label">{category}</span>
        <StatusTag status={status} />
      </div>
      <p className="card-heading mt-2">Reported incident</p>
      <p className="supporting-text mt-1">{summary}</p>
      <dl className="mt-3 space-y-1 text-sm text-grey-700">
        <div className="flex gap-2">
          <dt className="font-semibold">Location:</dt>
          <dd>{location}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-semibold">Date:</dt>
          <dd>{formatDate(date)}</dd>
        </div>
        {reference ? (
          <div className="flex gap-2">
            <dt className="font-semibold">Reference:</dt>
            <dd>{reference}</dd>
          </div>
        ) : null}
      </dl>
      <p className="small-text mt-3 italic">
        Information submitted to BizWatch. Details have not been independently verified.
      </p>
      {safetyAdvice ? (
        <p className="mt-3 rounded-md bg-teal-100 p-3 text-sm text-grey-950">
          <strong>Safety advice:</strong> {safetyAdvice}
        </p>
      ) : null}
      {unread && onMarkRead ? (
        <button type="button" onClick={onMarkRead} className="btn btn-ghost mt-3 text-sm">
          Mark as read
        </button>
      ) : null}
    </article>
  );
}
