import { PageHeader } from "@/components/ui/PageHeader";

export default function PrivacyPage() {
  return (
    <div className="container-content container-reading">
      <PageHeader
        title="Privacy"
        description="How BizWatch handles your information."
      />
      <div className="space-y-4 supporting-text">
        <p>
          BizWatch collects business registration details and report information to
          operate the community safety reporting service for postcode 4551.
        </p>
        <p>
          Report information is shared only as appropriate local alerts. Personal
          identifying details, exact addresses and unverified allegations are not
          published in public alerts.
        </p>
        <p>
          Information is stored securely using Cloudflare infrastructure. Contact us
          to request access to or correction of your business information.
        </p>
      </div>
    </div>
  );
}
