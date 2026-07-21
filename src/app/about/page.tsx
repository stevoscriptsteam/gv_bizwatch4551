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
        BizWatch 4551 is a private service for local businesses. It provides a structured
        way to report crime, suspicious activity and safety concerns, share information
        with other approved businesses, identify patterns in the 4551 community and access
        practical safety guidance.
      </p>
      <p className="supporting-text">
        BizWatch is a community reporting service. It is not operated by Queensland
        Police, Sunshine Coast Council or any government agency, unless formally
        authorised in writing.
      </p>
      <p className="supporting-text">
        Only businesses that register and are approved can submit reports and receive local
        alerts. To join, register your business via this site. Once approved, sign in with
        your registered mobile number.
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
