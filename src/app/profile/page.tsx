import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProfileForm } from "@/components/ProfileForm";
import { getCurrentBusiness } from "@/lib/session";

export default async function ProfilePage() {
  const business = await getCurrentBusiness();
  if (!business) {
    redirect("/sign-in?next=/profile");
  }

  return (
    <div className="container-content">
      <div className="mx-auto max-w-lg">
        <PageHeader
          title="Edit profile"
          description="Update your business details for your BizWatch account."
        />
        <ProfileForm
          initialBusinessName={business.business_name}
          initialEmail={business.email}
          initialSuburb={business.suburb}
          initialContactListVisible={business.contact_list_visible !== 0}
        />
      </div>
    </div>
  );
}
