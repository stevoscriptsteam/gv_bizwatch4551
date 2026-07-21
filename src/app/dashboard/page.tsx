import { redirect } from "next/navigation";
import { getCurrentBusiness } from "@/lib/session";
import { DashboardClient } from "@/components/DashboardClient";

export default async function DashboardPage() {
  const business = await getCurrentBusiness();
  if (!business) {
    redirect("/sign-in?next=/dashboard");
  }

  return <DashboardClient />;
}
