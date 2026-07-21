import Image from "next/image";
import Link from "next/link";

export function BizWatchLogo({ compact = false }: { compact?: boolean }) {
  const height = compact ? 64 : 72;
  const width = Math.round(height * (1774 / 887));

  return (
    <Image
      src="/logo.png"
      alt="BizWatch, community safety reporting for Caloundra and postcode 4551"
      width={width}
      height={height}
      className="h-auto object-contain"
      style={{ height, width: "auto", maxWidth: compact ? 260 : 320 }}
      priority
    />
  );
}
