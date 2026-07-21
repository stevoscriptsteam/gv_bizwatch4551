"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Crime } from "@/lib/types";
import { formatReferenceNumber, mapDbStatus } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusTag } from "@/components/ui/StatusTag";
import { EmptyState } from "@/components/ui/EmptyState";
import { EmergencyNotice } from "@/components/ui/EmergencyNotice";
import { ReportOwnerActions } from "@/components/ReportOwnerActions";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function MyReportsClient() {
  const [reports, setReports] = useState<Crime[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/crimes?mine=1");
    if (res.ok) {
      const data = (await res.json()) as { crimes: Crime[] };
      setReports(data.crimes);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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
        title="Your reports"
        description="Reports submitted by your business, with status and reference numbers."
      >
        <Link href="/report" className="btn btn-report">
          Make a new report
        </Link>
      </PageHeader>

      <EmergencyNotice />

      {loading ? (
        <p className="supporting-text mt-8">Loading…</p>
      ) : reports.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No reports submitted"
            description="When you submit a report through BizWatch, it will appear here with its status and reference number."
            action={
              <Link href="/report" className="btn btn-report">
                Make a report
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-grey-200 bg-grey-100">
                <th className="p-3 font-semibold" scope="col">
                  Reference
                </th>
                <th className="p-3 font-semibold" scope="col">
                  Summary
                </th>
                <th className="p-3 font-semibold" scope="col">
                  Address
                </th>
                <th className="p-3 font-semibold" scope="col">
                  Category
                </th>
                <th className="p-3 font-semibold" scope="col">
                  Status
                </th>
                <th className="p-3 font-semibold" scope="col">
                  Submitted
                </th>
                <th className="p-3 font-semibold" scope="col">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {reports.map((crime) => (
                <tr key={crime.id} className="border-b border-grey-200">
                  <td className="p-3 font-mono text-xs">
                    {formatReferenceNumber(crime.id)}
                  </td>
                  <td className="p-3">{crime.title}</td>
                  <td className="p-3 text-grey-700">{crime.address || crime.location}</td>
                  <td className="p-3">{crime.crime_type}</td>
                  <td className="p-3">
                    <StatusTag status={mapDbStatus(crime.status)} />
                  </td>
                  <td className="p-3 text-grey-700">{formatDate(crime.created_at)}</td>
                  <td className="p-3">
                    <ReportOwnerActions
                      crime={crime}
                      onUpdated={handleUpdate}
                      onDeleted={handleDelete}
                      compact
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
