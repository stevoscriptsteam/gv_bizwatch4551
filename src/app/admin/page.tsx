import { redirect } from "next/navigation";
import { isAdmin, isMaster } from "@/lib/admin";
import { getCurrentBusiness } from "@/lib/session";
import { AdminClient } from "@/components/AdminClient";

export default async function AdminPage() {
  const business = await getCurrentBusiness();

  if (!business || !isAdmin(business)) {
    redirect("/dashboard");
  }

  return <AdminClient isMaster={isMaster(business)} />;
}
