import Link from "next/link";
import { BizWatchLogo } from "@/components/BizWatchLogo";
import { SiteHeaderNav } from "@/components/SiteHeaderNav";
import { isAdmin } from "@/lib/admin";
import { getCurrentBusiness } from "@/lib/session";

const publicNavLinks = [
  { href: "/about", label: "About" },
  { href: "/register", label: "Register" },
];

const signedInNavLinks = [
  { href: "/dashboard", label: "Home" },
  { href: "/reports", label: "Reports" },
  { href: "/contacts", label: "Contacts" },
  { href: "/safety", label: "Resources" },
];

export async function AppHeader() {
  const business = await getCurrentBusiness();
  const signedIn = !!business;
  const navLinks = signedIn ? signedInNavLinks : publicNavLinks;
  const homeHref = signedIn ? "/dashboard" : "/";

  return (
    <header className="site-header">
      <div className="main-nav-bar">
        <div className="container-content site-header-row site-header-row--compact">
          <Link href={homeHref} className="site-header-logo">
            <BizWatchLogo compact />
          </Link>

          <SiteHeaderNav
            signedIn={signedIn}
            businessName={business?.business_name}
            isAdmin={business ? isAdmin(business) : false}
            navLinks={navLinks}
          />
        </div>
      </div>
    </header>
  );
}
