import { redirect } from "next/navigation";
import { ContactsClient } from "@/components/ContactsClient";
import { getCurrentBusiness } from "@/lib/session";

export default async function ContactsPage() {
  const business = await getCurrentBusiness();
  if (!business) {
    redirect("/sign-in?next=/contacts");
  }

  return <ContactsClient />;
}
