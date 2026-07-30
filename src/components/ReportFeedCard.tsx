"use client";

import type { Crime } from "@/lib/types";
import { formatReferenceNumber, formatReporterLabel } from "@/lib/types";
import { FaIcon } from "@/components/FaIcon";
import { INCIDENT_COLORS, INCIDENT_ICONS } from "@/lib/icons";
import { getCategoryId } from "@/lib/incident-icons";
import { ReportLocationPreview } from "@/components/ReportLocationPreview";
import { ReportEngagement } from "@/components/ReportEngagement";
import { ReportOwnerActions } from "@/components/ReportOwnerActions";
import { ReportFlagControls } from "@/components/ReportFlagControls";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function formatRelativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMins = Math.round(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(iso);
}

function truncate(text: string, max = 280) {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}

type ReportFeedCardProps = {
  crime: Crime;
  onUpdate?: (crime: Crime) => void;
  onDelete?: (crimeId: string) => void;
  highlighted?: boolean;
};

export function ReportFeedCard({
  crime,
  onUpdate,
  onDelete,
  highlighted = false,
}: ReportFeedCardProps) {
  const categoryId = getCategoryId(crime.category_id, crime.crime_type);
  const color = INCIDENT_COLORS[categoryId];
  const address = crime.address || crime.location;
  const locationLine = crime.suburb ? `${address}, ${crime.suburb}` : address;
  const amended =
    crime.updated_at && crime.updated_at !== crime.created_at;
  const reporter = formatReporterLabel(crime);

  return (
    <article
      id={`report-${crime.id}`}
      className={`report-feed-card${highlighted ? " report-feed-card-highlighted" : ""}`}
    >
      <header className="report-feed-card-header">
        <span
          className="report-feed-card-icon"
          style={{ color, borderColor: color }}
          aria-hidden="true"
        >
          <FaIcon icon={INCIDENT_ICONS[categoryId]} className="report-feed-card-icon-svg" />
        </span>
        <div className="report-feed-card-meta">
          <p className="report-feed-card-category">{crime.crime_type}</p>
          <p className="report-feed-card-reporter">{reporter}</p>
          <p className="report-feed-card-time">
            {formatRelativeTime(crime.created_at)}
            {amended ? " · Edited" : ""}
          </p>
        </div>
      </header>

      <h3 className="report-feed-card-title">{crime.title}</h3>

      <p className="report-feed-card-description">{truncate(crime.description)}</p>

      <p className="report-feed-card-location">{locationLine}</p>

      <ReportLocationPreview crime={crime} markerColor={color} />

      {onUpdate && onDelete ? (
        <ReportFlagControls
          crime={crime}
          onUpdate={onUpdate}
          onArchived={onDelete}
        />
      ) : null}

      <ReportEngagement
        crime={crime}
        onUpdate={onUpdate}
      />

      {crime.is_owner && onUpdate && onDelete ? (
        <ReportOwnerActions
          crime={crime}
          onUpdated={onUpdate}
          onDeleted={onDelete}
        />
      ) : null}

      <footer className="report-feed-card-footer">
        <span className="report-feed-card-ref">{formatReferenceNumber(crime.id)}</span>
        <span className="report-feed-card-date">{formatDate(crime.created_at)}</span>
      </footer>
    </article>
  );
}
