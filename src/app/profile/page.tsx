import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProfileForm } from "@/components/ProfileForm";
import { NotificationPrefsCard } from "@/components/NotificationPrefsCard";
import { getNotificationPrefs } from "@/lib/notifications";
import { getCurrentBusiness } from "@/lib/session";

export default async function ProfilePage() {
  const business = await getCurrentBusiness();
  if (!business) {
    redirect("/sign-in?next=/profile");
  }

  const isOwner = !business.member_id;
  const notificationPrefs = await getNotificationPrefs(business.id);

  return (
    <div className="container-content">
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <PageHeader
            title="Edit profile"
            description={
              business.member_name
                ? `Signed in as ${business.member_name} (${business.business_name}).`
                : "Update your business details for your BizWatch account."
            }
          />
          <ProfileForm
            initialBusinessName={business.business_name}
            initialEmail={business.email}
            initialSuburb={business.suburb}
            initialContactListVisible={business.contact_list_visible !== 0}
          />
        </div>

        <NotificationPrefsCard
          initialPrefs={notificationPrefs}
          phone={business.phone}
        />

        {isOwner ? (
          <p className="supporting-text">
            Want to give staff their own sign-in?{" "}
            <Link href="/team" className="font-semibold text-navy-800 hover:underline">
              Manage team
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}
