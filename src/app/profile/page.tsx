import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProfileForm } from "@/components/ProfileForm";
import { TeamMembersCard } from "@/components/TeamMembersCard";
import { NotificationPrefsCard } from "@/components/NotificationPrefsCard";
import { isAdmin } from "@/lib/admin";
import { MAX_TEAM_MEMBERS, listMembers } from "@/lib/members";
import { getNotificationPrefs } from "@/lib/notifications";
import { getCurrentBusiness } from "@/lib/session";

export default async function ProfilePage() {
  const business = await getCurrentBusiness();
  if (!business) {
    redirect("/sign-in?next=/profile");
  }

  const isOwner = !business.member_id;
  const [members, notificationPrefs] = await Promise.all([
    isOwner ? listMembers(business.id) : Promise.resolve([]),
    getNotificationPrefs(business.id),
  ]);

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
          <TeamMembersCard
            businessName={business.business_name}
            initialMembers={members.map(({ id, name, phone, is_admin }) => ({
              id,
              name,
              phone,
              is_admin,
            }))}
            maxMembers={MAX_TEAM_MEMBERS}
            canGrantAdmin={isAdmin(business)}
          />
        ) : null}
      </div>
    </div>
  );
}
