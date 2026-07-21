"use client";

import "@/lib/fontawesome";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";

type FaIconProps = {
  icon: IconDefinition | IconProp;
  className?: string;
  title?: string;
  fixedWidth?: boolean;
};

export function FaIcon({ icon, className, title, fixedWidth }: FaIconProps) {
  return (
    <FontAwesomeIcon
      icon={icon}
      className={className}
      title={title}
      fixedWidth={fixedWidth}
    />
  );
}
