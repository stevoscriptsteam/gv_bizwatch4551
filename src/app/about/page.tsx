import { PageHeader } from "@/components/ui/PageHeader";
import Link from "next/link";

function StaticPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="container-content">
      <div className="container-reading">
        <PageHeader title={title} description={description} />
        <div className="prose-supporting space-y-4">{children}</div>
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <StaticPage
      title="About BizWatch"
      description="A private community safety reporting service for approved businesses in Caloundra and postcode 4551."
    >
      <p className="supporting-text">
      BizWatch is a private community safety network for approved businesses across Caloundra and the 4551 area.

  It gives local businesses a simple way to report incidents, share relevant information and stay informed about issues affecting nearby businesses. By bringing this information together, BizWatch can help identify repeat behaviour and emerging local patterns.

      BizWatch is not an emergency service and does not replace reporting crime to Queensland Police. If someone is in immediate danger, call Triple Zero (000).
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/register" className="btn btn-primary inline-flex">
          Register your business
        </Link>
        <Link href="/sign-in" className="btn btn-secondary inline-flex">
          Sign in
        </Link>
      </div>
    </StaticPage>
  );
}
