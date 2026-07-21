"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  faAddressBook,
  faBookOpen,
  faFileLines,
  faHouse,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { FaIcon } from "@/components/FaIcon";

const tabs = [
  { href: "/dashboard", label: "Home", icon: faHouse },
  { href: "/reports", label: "Reports", icon: faFileLines },
  { href: "/report", label: "Report", icon: faPlus, primary: true },
  { href: "/contacts", label: "Contacts", icon: faAddressBook },
  { href: "/safety", label: "Resources", icon: faBookOpen },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="mobile-tab-bar" aria-label="Quick navigation">
      {tabs.map((tab) => {
        const active =
          pathname === tab.href || pathname.startsWith(`${tab.href}/`);

        if (tab.primary) {
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="mobile-tab mobile-tab--primary"
              aria-label="Make a report"
            >
              <span className="mobile-tab-primary-circle" aria-hidden="true">
                <FaIcon icon={tab.icon} />
              </span>
              <span className="mobile-tab-label">{tab.label}</span>
            </Link>
          );
        }

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`mobile-tab${active ? " mobile-tab--active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <FaIcon icon={tab.icon} className="mobile-tab-icon" />
            <span className="mobile-tab-label">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
