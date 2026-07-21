import { redirect } from "next/navigation";
import { getCurrentBusiness } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { ReportFlow } from "@/components/ReportFlow";

export default async function ReportPage() {
  const business = await getCurrentBusiness();
  if (!business) {
    redirect("/sign-in?next=/report");
  }

  return (
    <div className="container-content">
      <PageHeader
        title="Make a report"
        description="Use this form to report crime, suspicious activity or safety concerns affecting your business. Take your time; your progress is saved automatically."
      />
      <ReportFlow />
    </div>
  );
}
