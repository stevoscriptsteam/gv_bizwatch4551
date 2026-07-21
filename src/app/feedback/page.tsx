import { PageHeader } from "@/components/ui/PageHeader";

export default function FeedbackPage() {
  return (
    <div className="container-content container-reading">
      <PageHeader
        title="Feedback"
        description="Help us improve BizWatch."
      />
      <div className="card card-shadow supporting-text">
        <p>
          We welcome feedback from registered businesses about the reporting process,
          reporting process and resources. Contact your BizWatch coordinator to share
          suggestions or report issues with the service.
        </p>
      </div>
    </div>
  );
}
