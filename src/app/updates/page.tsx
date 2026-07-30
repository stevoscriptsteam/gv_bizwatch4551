import { redirect } from "next/navigation";
import { getCurrentBusiness } from "@/lib/session";
import { UpdatesClient } from "@/components/UpdatesClient";

export default async function UpdatesPage() {
  const business = await getCurrentBusiness();
  if (!business) {
    redirect("/sign-in?next=/updates");
  }

  return <UpdatesClient />;
}
