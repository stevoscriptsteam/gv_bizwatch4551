import Link from "next/link";
import { redirect } from "next/navigation";
import { FaIcon } from "@/components/FaIcon";
import {
  faBell,
  faBuilding,
  faFileLines,
  faLocationCrosshairs,
  faMagnifyingGlass,
  faShield,
  faShieldHalved,
} from "@/lib/icons";
import { getCurrentBusiness } from "@/lib/session";

export default async function HomePage() {
  const business = await getCurrentBusiness();
  if (business) {
    redirect("/dashboard");
  }

  return (
    <div className="home-landing">
      <section className="home-hero" aria-labelledby="home-hero-heading">
        <h1 id="home-hero-heading" className="home-hero-title">
          Help make Caloundra safer for local businesses
        </h1>
        <p className="home-hero-lead">
          Privately report theft, vandalism, threatening behaviour and suspicious activity
          affecting your business. Every report helps identify local patterns and support
          stronger safety initiatives.
        </p>
        <div className="home-hero-actions">
          <Link href="/sign-in?next=/report" className="btn btn-report">
            Report an incident
          </Link>
          <Link href="/register" className="btn btn-secondary">
            Register your business
          </Link>
        </div>
        <p className="home-hero-signin">
          Already registered?{" "}
          <Link href="/sign-in" className="home-hero-signin-link">
            Sign in
          </Link>
        </p>
      </section>

      <section className="home-section" aria-labelledby="home-helps-heading">
        <h2 id="home-helps-heading" className="home-section-title">
          How BizWatch helps
        </h2>
        <ul className="home-helps-list">
          <li className="home-helps-item">
            <span className="home-helps-icon home-helps-icon--patterns" aria-hidden="true">
              <FaIcon icon={faMagnifyingGlass} className="home-helps-icon-svg" />
            </span>
            <div>
              <h3 className="home-helps-heading">Identify local patterns</h3>
              <p className="home-helps-text">
                Combined reports help show where and when incidents are occurring.
              </p>
            </div>
          </li>
          <li className="home-helps-item">
            <span className="home-helps-icon home-helps-icon--safer" aria-hidden="true">
              <FaIcon icon={faShield} className="home-helps-icon-svg" />
            </span>
            <div>
              <h3 className="home-helps-heading">Support safer businesses</h3>
              <p className="home-helps-text">
                Information can help guide safety initiatives, security improvements and
                community advocacy.
              </p>
            </div>
          </li>
          <li className="home-helps-item">
            <span className="home-helps-icon home-helps-icon--informed" aria-hidden="true">
              <FaIcon icon={faBell} className="home-helps-icon-svg" />
            </span>
            <div>
              <h3 className="home-helps-heading">Keep businesses informed</h3>
              <p className="home-helps-text">
                Verified local businesses can access relevant safety information and practical
                resources.
              </p>
            </div>
          </li>
        </ul>
      </section>

      <section className="home-section home-section--muted" aria-labelledby="home-works-heading">
        <h2 id="home-works-heading" className="home-section-title">
          How it works
        </h2>
        <p className="home-section-lead">
          Access is limited to verified businesses in Caloundra and postcode 4551.
        </p>
        <ol className="home-steps">
          <li className="home-step">
            <span className="home-step-number" aria-hidden="true">
              1
            </span>
            <div>
              <h3 className="home-step-heading">
                <span className="home-step-icon" aria-hidden="true">
                  <FaIcon icon={faBuilding} className="home-step-icon-svg" />
                </span>
                Register your business
              </h3>
              <p className="home-step-text">Apply for access using your business details.</p>
            </div>
          </li>
          <li className="home-step">
            <span className="home-step-number" aria-hidden="true">
              2
            </span>
            <div>
              <h3 className="home-step-heading">
                <span className="home-step-icon" aria-hidden="true">
                  <FaIcon icon={faFileLines} className="home-step-icon-svg" />
                </span>
                Submit a report
              </h3>
              <p className="home-step-text">
                Record an incident or suspicious activity affecting your business.
              </p>
            </div>
          </li>
          <li className="home-step">
            <span className="home-step-number" aria-hidden="true">
              3
            </span>
            <div>
              <h3 className="home-step-heading">
                <span className="home-step-icon" aria-hidden="true">
                  <FaIcon icon={faLocationCrosshairs} className="home-step-icon-svg" />
                </span>
                Help build a clearer local picture
              </h3>
              <p className="home-step-text">
                Reports contribute to a better understanding of safety issues across the area.
              </p>
            </div>
          </li>
        </ol>
      </section>

      <aside className="home-trust" aria-labelledby="home-trust-heading">
        <span className="home-trust-icon" aria-hidden="true">
          <FaIcon icon={faShieldHalved} className="home-trust-icon-svg" />
        </span>
        <div>
          <h2 id="home-trust-heading" className="home-trust-heading">
            Business access only
          </h2>
          <p className="home-trust-text">
            BizWatch is available to verified businesses in Caloundra and postcode 4551.
            Reports are not displayed publicly.
          </p>
        </div>
      </aside>

      <aside className="home-emergency" role="note">
        <p>
          BizWatch is not an emergency service and does not replace reporting to Queensland
          Police. Call <a href="tel:000">000</a> in an emergency or contact Policelink on{" "}
          <a href="tel:131444">131 444</a> for non-urgent police assistance.
        </p>
      </aside>
    </div>
  );
}
