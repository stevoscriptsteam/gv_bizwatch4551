"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { Crime } from "@/lib/types";
import { ReportFeedCard } from "@/components/ReportFeedCard";
import { EmergencyNotice } from "@/components/ui/EmergencyNotice";
// import { GvItPromoBanner } from "@/components/GvItPromoBanner";

const ReportsMap = dynamic(
  () => import("@/components/ReportsMap").then((m) => m.ReportsMap),
  {
    ssr: false,
    loading: () => (
      <div className="service-area-map flex items-center justify-center">
        <p className="small-text">Loading map…</p>
      </div>
    ),
  },
);

export function DashboardClient() {
  const [areaReports, setAreaReports] = useState<Crime[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/crimes");
    if (res.ok) {
      const data = (await res.json()) as { crimes: Crime[] };
      setAreaReports(data.crimes);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => void refresh(), 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleUpdate = useCallback((updated: Crime) => {
    setAreaReports((prev) =>
      prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)),
    );
  }, []);

  const handleDelete = useCallback((crimeId: string) => {
    setAreaReports((prev) => prev.filter((r) => r.id !== crimeId));
  }, []);

  const recentReports = areaReports.slice(0, 3);
  const mapReports = useMemo(() => areaReports.slice(0, 50), [areaReports]);

  return (
    <div className="container-content">
      <EmergencyNotice />

      <section className="mt-8" aria-labelledby="map-heading">
        <h2 id="map-heading" className="section-heading mb-2">
          Recent reports map
        </h2>
        {loading ? (
          <p className="supporting-text">Loading map…</p>
        ) : (
          <ReportsMap crimes={mapReports} />
        )}
      </section>

      <section className="dashboard-recent-reports mt-8" aria-labelledby="recent-reports-heading">
          <div className="dashboard-section-header">
            <h2 id="recent-reports-heading" className="section-heading">
              Recent reports
            </h2>
            <Link href="/reports" className="text-sm font-semibold text-navy-800 hover:underline">
              View all
            </Link>
          </div>

          {loading ? (
            <p className="supporting-text">Loading…</p>
          ) : recentReports.length === 0 ? (
            <p className="supporting-text">No reports in the area yet.</p>
          ) : (
            <div className="report-feed-preview">
              {recentReports.map((crime) => (
                <ReportFeedCard
                  key={crime.id}
                  crime={crime}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </section>

      {/* GV IT promo banner temporarily disabled
      <div className="mt-8">
        <GvItPromoBanner />
      </div>
      */}
    </div>
  );
}
