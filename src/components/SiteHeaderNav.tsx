"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faXmark } from "@fortawesome/free-solid-svg-icons";
import { ProfileMenu } from "@/components/ProfileMenu";

type NavLink = { href: string; label: string };

type SiteHeaderNavProps = {
  signedIn: boolean;
  businessName?: string;
  isAdmin?: boolean;
  navLinks: NavLink[];
};

export function SiteHeaderNav({
  signedIn,
  businessName,
  isAdmin = false,
  navLinks,
}: SiteHeaderNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle("mobile-nav-open", open);
    return () => {
      document.body.classList.remove("mobile-nav-open");
    };
  }, [open]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <nav
        className="site-header-nav site-header-nav--desktop"
        aria-label="Main navigation"
      >
        <ul className="site-header-nav-list">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="nav-link">
                {link.label}
              </Link>
            </li>
          ))}

          {!signedIn ? (
            <li>
              <Link href="/sign-in" className="btn btn-outline btn-header">
                Sign in
              </Link>
            </li>
          ) : null}

          {signedIn && businessName ? (
            <>
              <li>
                <ProfileMenu businessName={businessName} isAdmin={isAdmin} />
              </li>
              <li>
                <Link href="/report" className="btn btn-report">
                  Make a report
                </Link>
              </li>
            </>
          ) : null}
        </ul>
      </nav>

      <button
        type="button"
        className="site-header-menu-toggle"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="site-header-drawer"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        <FontAwesomeIcon icon={open ? faXmark : faBars} aria-hidden="true" />
      </button>

      <div
        className={`site-header-backdrop${open ? " site-header-backdrop--visible" : ""}`}
        aria-hidden="true"
        onClick={() => setOpen(false)}
      />

      <nav
        id="site-header-drawer"
        className={`site-header-drawer${open ? " site-header-drawer--open" : ""}`}
        aria-label="Mobile navigation"
        aria-hidden={!open}
      >
        <ul className="site-header-drawer-list">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="site-header-drawer-link"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="site-header-drawer-actions">
          {!signedIn ? (
            <Link
              href="/sign-in"
              className="btn btn-primary site-header-drawer-btn"
              onClick={() => setOpen(false)}
            >
              Sign in
            </Link>
          ) : (
            <>
              <Link
                href="/report"
                className="btn btn-report site-header-drawer-btn"
                onClick={() => setOpen(false)}
              >
                Make a report
              </Link>
              <Link
                href="/my-reports"
                className="site-header-drawer-link"
                onClick={() => setOpen(false)}
              >
                Your reports
              </Link>
              <Link
                href="/profile"
                className="site-header-drawer-link"
                onClick={() => setOpen(false)}
              >
                Edit profile
              </Link>
              {isAdmin ? (
                <Link
                  href="/admin"
                  className="site-header-drawer-link"
                  onClick={() => setOpen(false)}
                >
                  Admin
                </Link>
              ) : null}
              <button
                type="button"
                className="site-header-drawer-link site-header-drawer-link--danger"
                onClick={() => void handleLogout()}
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </nav>
    </>
  );
}
