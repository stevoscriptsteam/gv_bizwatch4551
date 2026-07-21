import { redirect } from "next/navigation";
import { SafetyArticlesClient } from "@/components/SafetyArticlesClient";
import { getCurrentBusiness } from "@/lib/session";

export default async function SafetyPage() {
  const business = await getCurrentBusiness();
  if (!business) {
    redirect("/sign-in?next=/safety");
  }

  return <SafetyArticlesClient />;
}
