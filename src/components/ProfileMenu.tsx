"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaIcon } from "@/components/FaIcon";
import { faUser } from "@/lib/icons";
import { faChevronDown, faFileLines, faPenToSquare, faRightFromBracket, faShieldHalved } from "@fortawesome/free-solid-svg-icons";

export function ProfileMenu({
  businessName,
  isAdmin = false,
}: {
  businessName: string;
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div className="profile-menu" ref={containerRef}>
      <button
        type="button"
        className="profile-menu-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Account menu for ${businessName}`}
      >
        <span className="profile-menu-avatar" aria-hidden="true">
          <FaIcon icon={faUser} />
        </span>
        <span className="profile-menu-name">{businessName}</span>
        <FaIcon icon={faChevronDown} className="profile-menu-chevron" aria-hidden />
      </button>

      {open ? (
        <div className="profile-menu-dropdown" role="menu">
          <p className="profile-menu-dropdown-label">{businessName}</p>
          <Link
            href="/my-reports"
            className="profile-menu-item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <FaIcon icon={faFileLines} className="profile-menu-item-icon" aria-hidden />
            Your reports
          </Link>
          <Link
            href="/profile"
            className="profile-menu-item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <FaIcon icon={faPenToSquare} className="profile-menu-item-icon" aria-hidden />
            Edit profile
          </Link>
          {isAdmin ? (
            <Link
              href="/admin"
              className="profile-menu-item"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <FaIcon icon={faShieldHalved} className="profile-menu-item-icon" aria-hidden />
              Admin
            </Link>
          ) : null}
          <button
            type="button"
            className="profile-menu-item profile-menu-item--danger"
            role="menuitem"
            onClick={() => void handleLogout()}
          >
            <FaIcon icon={faRightFromBracket} className="profile-menu-item-icon" aria-hidden />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
