import { PageHeader } from "@/components/ui/PageHeader";

export default function ContactPage() {
  return (
    <div className="container-content container-reading">
      <PageHeader
        title="Contact"
        description="Get in touch with the BizWatch team."
      />
      <div className="card card-shadow space-y-3 supporting-text">
        <p>
          To register your business or enquire about an existing application, use the{" "}
          <a href="/register" className="font-semibold text-navy-800 hover:underline">
            registration form
          </a>
          . For other account or general enquiries, contact your BizWatch coordinator for
          the 4551 community.
        </p>
        <p>
          <strong>Emergency:</strong> Call Triple Zero (000). BizWatch is not monitored
          for emergencies.
        </p>
        <p>
          <strong>Non-urgent police:</strong> Policelink 131 444
        </p>
      </div>
    </div>
  );
}
