import Link from "next/link";

const footerLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
];

const emergencyContacts = [
  {
    href: "tel:000",
    label: "Triple Zero (000)",
    detail: "Immediate danger or urgent police attendance",
  },
  {
    href: "tel:131444",
    label: "Policelink 131 444",
    detail: "Non-urgent police matters, 24 hours",
  },
  {
    href: "tel:1800333000",
    label: "Crime Stoppers 1800 333 000",
    detail: "Anonymous crime information",
  },
  {
    href: "https://www.police.qld.gov.au/",
    label: "Queensland Police",
    detail: "Official QLD Police website",
    external: true,
  },
  {
    href: "https://www.police.qld.gov.au/policelink-reporting",
    label: "Policelink online reporting",
    detail: "Report non-urgent incidents online",
    external: true,
  },
];

export function AppFooter() {
  return (
    <footer className="site-footer">
      <div className="container-content site-footer-inner">
        <div className="site-footer-row">
          <p className="site-footer-brand">BizWatch 4551</p>
          <nav aria-label="Footer navigation">
            <ul className="site-footer-links">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <section className="site-footer-emergency" aria-labelledby="footer-emergency-heading">
          <h2 id="footer-emergency-heading" className="site-footer-emergency-heading">
            Emergency and police contacts
          </h2>
          <ul className="site-footer-emergency-list">
            {emergencyContacts.map((contact) => (
              <li key={contact.href}>
                <a
                  href={contact.href}
                  className="site-footer-emergency-link"
                  {...(contact.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  {contact.label}
                </a>
                <span className="site-footer-emergency-detail">{contact.detail}</span>
              </li>
            ))}
          </ul>
          <p className="site-footer-emergency-note">
            BizWatch is not an emergency service. Call Triple Zero (000) when life or safety is at
            immediate risk.
          </p>
        </section>

        <div className="site-footer-bottom">
          <p className="site-footer-credit">
            Powered by{" "}
            <a
              href="https://gvintegratedsolutions.com.au"
              target="_blank"
              rel="noopener noreferrer"
              className="site-footer-credit-link"
            >
              GV Integrated Solutions
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
