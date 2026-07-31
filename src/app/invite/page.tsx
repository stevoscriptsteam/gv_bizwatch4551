import type { Metadata } from "next";
import Link from "next/link";
import { Oswald, Source_Sans_3 } from "next/font/google";

const display = Oswald({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-invite-display",
});

const body = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-invite-body",
});

export const metadata: Metadata = {
  title: "You're invited | BizWatch 4551",
  description:
    "You've been invited to register for BizWatch 4551 — the private community safety network for businesses in Caloundra and postcode 4551.",
};

export default function InvitePage() {
  return (
    <div className={`${display.variable} ${body.variable} invite-page`}>
      <section className="invite-hero" aria-labelledby="invite-heading">
        <div className="invite-lights" aria-hidden="true">
          <span className="invite-light invite-light--red" />
          <span className="invite-light invite-light--blue" />
          <span className="invite-light-beam invite-light-beam--red" />
          <span className="invite-light-beam invite-light-beam--blue" />
        </div>

        <div className="invite-content">
          <p className="invite-brand">BizWatch 4551</p>
          <h1 id="invite-heading" className="invite-title">
            You&apos;ve been invited to register
          </h1>
          <p className="invite-lead">
            Join the private community safety network for businesses in Caloundra and
            postcode 4551. Report incidents, spot patterns, and look out for one another.
          </p>
          <div className="invite-actions">
            <Link href="/register" className="btn btn-report invite-cta">
              Register your business
            </Link>
            <Link href="/sign-in" className="invite-signin">
              Already registered? Sign in
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
