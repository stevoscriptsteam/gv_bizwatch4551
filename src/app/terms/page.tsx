import { PageHeader } from "@/components/ui/PageHeader";

export default function TermsPage() {
  return (
    <div className="container-content container-reading">
      <PageHeader title="Terms of use" description="Conditions for using BizWatch." />
      <div className="space-y-4 supporting-text">
        <p>
          BizWatch 4551 is a private community safety reporting service for approved
          businesses in postcode 4551. Access is granted only after registration and
          approval. By using this service you agree to provide accurate information to
          the best of your knowledge.
        </p>
        <p>
          BizWatch is not an emergency service. Do not use BizWatch to request urgent
          police, ambulance or fire response. Call Triple Zero (000) in an emergency.
        </p>
        <p>
          Misuse of the service, including false reports or harassment, may result in
          removal from the network.
        </p>
      </div>
    </div>
  );
}
