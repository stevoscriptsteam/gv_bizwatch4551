"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { FaIcon } from "@/components/FaIcon";
import { faShareNodes } from "@fortawesome/free-solid-svg-icons";

const SHARE_TITLE = "BizWatch 4551";
const SHARE_TEXT =
  "You've been invited to register for BizWatch 4551 — the community safety network for local businesses.";

function getInviteUrl() {
  if (typeof window === "undefined") return "/invite";
  return `${window.location.origin}/invite`;
}

export function InviteSharePanel({ compact = false }: { compact?: boolean }) {
  const [inviteUrl, setInviteUrl] = useState("/invite");
  const [shareHint, setShareHint] = useState<string | null>(null);

  useEffect(() => {
    setInviteUrl(getInviteUrl());
  }, []);

  async function handleShare() {
    const url = getInviteUrl();
    setInviteUrl(url);

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: SHARE_TITLE,
          text: SHARE_TEXT,
          url,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setShareHint("Invite link copied");
    } catch {
      setShareHint("Copy this link: " + url);
    }

    window.setTimeout(() => setShareHint(null), 2500);
  }

  return (
    <div className={`invite-share${compact ? " invite-share--compact" : ""}`}>
      <p className="invite-share-label">Invite a business</p>
      <div className="invite-share-qr" aria-hidden="true">
        <QRCodeSVG
          value={inviteUrl}
          size={compact ? 96 : 112}
          level="M"
          marginSize={1}
          bgColor="#ffffff"
          fgColor="#0b3558"
        />
      </div>
      <p className="invite-share-hint">Scan to open the invite page</p>
      <button
        type="button"
        className="invite-share-btn"
        onClick={() => void handleShare()}
      >
        <FaIcon icon={faShareNodes} className="invite-share-btn-icon" aria-hidden />
        Share invite
      </button>
      {shareHint ? (
        <p className="invite-share-status" role="status">
          {shareHint}
        </p>
      ) : null}
    </div>
  );
}
