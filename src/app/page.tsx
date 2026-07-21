import Link from "next/link";
import { redirect } from "next/navigation";
import { FaIcon } from "@/components/FaIcon";
import { faFileLines, faShield, faShieldHalved } from "@/lib/icons";
import { getReportStats } from "@/lib/crimes";
import { getCurrentBusiness } from "@/lib/session";

export default async function HomePage() {
  const business = await getCurrentBusiness();
  if (business) {
    redirect("/dashboard");
  }

  const stats = await getReportStats();

  return (
    <div className="home-landing">
      <section className="home-intro" aria-labelledby="home-intro-heading">
        <div className="home-intro-grid">
          <div className="home-intro-copy">
            <h1 id="home-intro-heading" className="home-intro-title">
              BizWatch 4551
            </h1>
            <p className="home-intro-lead">
              A private incident reporting service for approved businesses in the 4551 area.
            </p>
            <p className="home-intro-support">
              Signed-in users can submit incident reports and access their business dashboard.
            </p>
          </div>

          <aside className="home-access-box" aria-labelledby="home-access-heading">
            <h2 id="home-access-heading" className="home-access-box-title">
              Business access
            </h2>
            <p className="home-access-box-text">
              Sign in with your registered business mobile number.
            </p>
            <div className="home-access-box-actions">
              <Link href="/sign-in" className="btn btn-primary">
                Sign in
              </Link>
              <Link href="/register" className="btn btn-secondary">
                Register your business
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="home-stats" aria-label="Reporting statistics">
        <div className="home-stat">
          <p className="home-stat-value">{stats.allTime.toLocaleString("en-AU")}</p>
          <p className="home-stat-label">Reports all time</p>
        </div>
        <div className="home-stat">
          <p className="home-stat-value">{stats.last24Hours.toLocaleString("en-AU")}</p>
          <p className="home-stat-label">Past 24 hours</p>
        </div>
        <div className="home-stat">
          <p className="home-stat-value home-stat-value--text">
            {stats.topSuburb ? stats.topSuburb.suburb : "None yet"}
          </p>
          <p className="home-stat-label">
            {stats.topSuburb
              ? `Most reported suburb (${stats.topSuburb.count.toLocaleString("en-AU")} reports)`
              : "Most reported suburb"}
          </p>
        </div>
      </section>

      <div className="home-action-grid">
        <article className="home-action-card">
          <span className="home-action-icon home-action-icon--report" aria-hidden="true">
            <FaIcon icon={faFileLines} className="home-action-icon-svg" />
          </span>
          <h2 className="home-action-heading">Report an incident</h2>
          <p className="home-action-text">
            Submit details of crime, suspicious activity or a safety concern affecting your
            business.
          </p>
          <Link href="/sign-in?next=/report" className="btn btn-report home-action-btn">
            Sign in to make a report
          </Link>
        </article>

        <article className="home-action-card">
          <span className="home-action-icon home-action-icon--safety" aria-hidden="true">
            <FaIcon icon={faShield} className="home-action-icon-svg" />
          </span>
          <h2 className="home-action-heading">Resources</h2>
          <p className="home-action-text">
            Access practical information to help protect your staff, customers and business.
          </p>
          <Link href="/sign-in?next=/safety" className="btn btn-secondary home-action-btn">
            Sign in to view resources
          </Link>
        </article>
      </div>

      <aside className="home-info-strip" aria-labelledby="home-info-heading">
        <span className="home-info-strip-icon" aria-hidden="true">
          <FaIcon icon={faShieldHalved} className="home-info-strip-icon-svg" />
        </span>
        <div>
          <h2 id="home-info-heading" className="home-info-strip-heading">
            Business access only
          </h2>
          <p className="home-info-strip-text">
            BizWatch is available to registered and approved businesses in postcode 4551.
            New businesses can apply online. Access is granted after review.
          </p>
        </div>
      </aside>

      <aside className="home-emergency-notice" role="note">
        <p>
          If someone is in immediate danger, call Triple Zero (000). BizWatch is not an
          emergency service.
        </p>
      </aside>
    </div>
  );
}
