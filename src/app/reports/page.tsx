import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ReportsFeedClient } from "@/components/ReportsFeedClient";
import { getCurrentBusiness } from "@/lib/session";

export default async function ReportsPage() {
  const business = await getCurrentBusiness();
  if (!business) {
    redirect("/sign-in?next=/reports");
  }

  return (
    <Suspense fallback={<div className="container-content"><p className="supporting-text">Loading reports…</p></div>}>
      <ReportsFeedClient />
    </Suspense>
  );
}
