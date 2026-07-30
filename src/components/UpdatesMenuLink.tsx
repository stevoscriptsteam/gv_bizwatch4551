"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaIcon } from "@/components/FaIcon";
import { getLatestChangelogId } from "@/lib/changelog";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

const STORAGE_KEY = "bizwatch_updates_seen";

export function markUpdatesSeen() {
  const latest = getLatestChangelogId();
  if (!latest || typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, latest);
}

export function useHasUnreadUpdates() {
  const [unread, setUnread] = useState(false);

  useEffect(() => {
    const latest = getLatestChangelogId();
    if (!latest) {
      setUnread(false);
      return;
    }
    const seen = window.localStorage.getItem(STORAGE_KEY);
    setUnread(seen !== latest);
  }, []);

  return unread;
}

export function UpdatesMenuLink({
  href = "/updates",
  icon,
  onNavigate,
  className = "profile-menu-item",
  role,
}: {
  href?: string;
  icon?: IconDefinition;
  onNavigate?: () => void;
  className?: string;
  role?: string;
}) {
  const unread = useHasUnreadUpdates();

  return (
    <Link href={href} className={className} role={role} onClick={onNavigate}>
      {icon ? (
        <FaIcon icon={icon} className="profile-menu-item-icon" aria-hidden />
      ) : null}
      <span className="updates-menu-label">
        What&apos;s new
        {unread ? (
          <span className="updates-menu-dot" aria-label="New updates available" />
        ) : null}
      </span>
    </Link>
  );
}
