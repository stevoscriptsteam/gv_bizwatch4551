import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { TeamMembersCard } from "@/components/TeamMembersCard";
import { isAdmin } from "@/lib/admin";
import { MAX_TEAM_MEMBERS, listMembers } from "@/lib/members";
import { getCurrentBusiness } from "@/lib/session";

export default async function TeamPage() {
  const business = await getCurrentBusiness();
  if (!business) {
    redirect("/sign-in?next=/team");
  }

  // Only the business owner can manage the team — not staff signed in on a member phone.
  if (business.member_id) {
    redirect("/profile");
  }

  const members = await listMembers(business.id);

  return (
    <div className="container-content">
      <div className="mx-auto max-w-lg space-y-6">
        <PageHeader
          title="Manage team"
          description={`Add or remove staff who can sign in for ${business.business_name}. Each person uses their own mobile number.`}
        />

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

        <p className="supporting-text">
          Need to update business details?{" "}
          <Link href="/profile" className="font-semibold text-navy-800 hover:underline">
            Edit profile
          </Link>
        </p>
      </div>
    </div>
  );
}
