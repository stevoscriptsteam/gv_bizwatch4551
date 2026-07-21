import Link from "next/link";

export function ServiceCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <article className="card card-shadow" style={{ height: "100%" }}>
      <h2 className="card-heading">{title}</h2>
      <p className="supporting-text" style={{ marginTop: 8 }}>{description}</p>
      <Link
        href={href}
        className="btn btn-secondary"
        style={{ marginTop: 16, fontSize: 14 }}
        aria-label={`${title}, view details`}
      >
        View details
      </Link>
    </article>
  );
}
