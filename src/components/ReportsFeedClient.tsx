"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Crime } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { ReportFeedCard } from "@/components/ReportFeedCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { EmergencyNotice } from "@/components/ui/EmergencyNotice";

export function ReportsFeedClient() {
  const searchParams = useSearchParams();
  const focusId = searchParams.get("id");
  const [reports, setReports] = useState<Crime[]>([]);
  const [loading, setLoading] = useState(true);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/crimes");
    if (res.ok) {
      const data = (await res.json()) as { crimes: Crime[] };
      setReports(data.crimes);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!focusId || loading) return;

    const target = document.getElementById(`report-${focusId}`);
    if (!target) return;

    const scrollTimer = window.setTimeout(() => {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightId(focusId);
    }, 100);

    const clearTimer = window.setTimeout(() => {
      setHighlightId(null);
    }, 3500);

    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(clearTimer);
    };
  }, [focusId, loading, reports]);

  const handleUpdate = useCallback((updated: Crime) => {
    setReports((prev) =>
      prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)),
    );
  }, []);

  const handleDelete = useCallback((crimeId: string) => {
    setReports((prev) => prev.filter((r) => r.id !== crimeId));
  }, []);

  return (
    <div className="container-content">
      <PageHeader
        title="Reports"
        description="Recent incident reports shared across the Biz Watchzone, newest first."
      />

      <EmergencyNotice />

      <div className="reports-feed">
        {loading ? (
          <p className="supporting-text">Loading reports…</p>
        ) : reports.length === 0 ? (
          <EmptyState
            title="No reports yet"
            description="When incidents are reported in the 4551 area, they will appear here."
            action={
              <Link href="/report" className="btn btn-report">
                Make a report
              </Link>
            }
          />
        ) : (
          reports.map((crime) => (
            <ReportFeedCard
              key={crime.id}
              crime={crime}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              highlighted={highlightId === crime.id}
            />
          ))
        )}
      </div>
    </div>
  );
}
