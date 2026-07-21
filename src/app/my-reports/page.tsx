import { redirect } from "next/navigation";
import { MyReportsClient } from "@/components/MyReportsClient";
import { getCurrentBusiness } from "@/lib/session";

export default async function MyReportsPage() {
  const business = await getCurrentBusiness();
  if (!business) {
    redirect("/sign-in?next=/my-reports");
  }

  return <MyReportsClient />;
}
