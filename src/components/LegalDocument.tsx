import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";

type LegalDocumentProps = {
  title: string;
  effectiveDate: string;
  children: React.ReactNode;
  relatedHref?: string;
  relatedLabel?: string;
};

export function LegalDocument({
  title,
  effectiveDate,
  children,
  relatedHref,
  relatedLabel,
}: LegalDocumentProps) {
  return (
    <div className="container-content">
      <div className="container-reading">
        <PageHeader title={title} description={`Effective: ${effectiveDate}`} />
        <article className="article-prose mt-6">{children}</article>
        {relatedHref && relatedLabel ? (
          <p className="supporting-text mt-8 border-t border-grey-200 pt-6">
            See also{" "}
            <Link href={relatedHref} className="font-semibold text-navy-800 hover:underline">
              {relatedLabel}
            </Link>
            .
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function LegalContactBlock({
  email = "legal@gvintegratedsolutions.com.au",
}: {
  email?: string;
}) {
  return (
    <address className="not-italic">
      <strong>GV Integrated Solutions</strong>
      <br />
      ABN 58 261 360 091
      <br />
      Email:{" "}
      <a href={`mailto:${email}`} className="font-semibold text-navy-800 hover:underline">
        {email}
      </a>
    </address>
  );
}
