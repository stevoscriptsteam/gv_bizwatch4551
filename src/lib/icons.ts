import { icon } from "@fortawesome/fontawesome-svg-core";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBagShopping,
  faBell,
  faBuilding,
  faCar,
  faCamera,
  faCheck,
  faCircleInfo,
  faClock,
  faEye,
  faFileLines,
  faHouse,
  faLocationCrosshairs,
  faMagnifyingGlass,
  faPen,
  faQuestion,
  faShield,
  faShieldHalved,
  faThumbsUp,
  faLightbulb,
  faTriangleExclamation,
  faUser,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import type { ReportCategoryId, ReportStatus, ReactionType, ArticleReactionType } from "@/lib/types";

export const INCIDENT_ICONS: Record<ReportCategoryId, IconDefinition> = {
  theft: faBagShopping,
  aggressive: faTriangleExclamation,
  assault: faShieldHalved,
  damage: faBuilding,
  suspicious: faEye,
  vehicle: faCar,
  antisocial: faUsers,
  other: faCircleInfo,
};

export const INCIDENT_COLORS: Record<ReportCategoryId, string> = {
  theft: "#0b3558",
  aggressive: "#e75b45",
  assault: "#b42318",
  damage: "#946200",
  suspicious: "#087f83",
  vehicle: "#164a70",
  antisocial: "#6941c6",
  other: "#465563",
};

export const STATUS_ICONS: Record<ReportStatus, IconDefinition> = {
  draft: faPen,
  submitted: faFileLines,
  under_review: faMagnifyingGlass,
  information_requested: faQuestion,
  completed: faCheck,
};

export const REACTION_ICONS: Record<ReactionType, IconDefinition> = {
  following: faBell,
  also_affected: faBuilding,
  seen_nearby: faEye,
  have_information: faCamera,
};

export const ARTICLE_REACTION_ICONS: Record<ArticleReactionType, IconDefinition> = {
  helpful: faThumbsUp,
  interesting: faLightbulb,
  needs_more_detail: faQuestion,
};

export {
  faUser,
  faHouse,
  faShield,
  faBell,
  faFileLines,
  faShieldHalved,
  faMagnifyingGlass,
  faTriangleExclamation,
  faLocationCrosshairs,
  faClock,
};

export function incidentIconHtml(categoryId: ReportCategoryId): string {
  return icon(INCIDENT_ICONS[categoryId]).html[0] ?? "";
}

export function incidentMarkerHtml(categoryId: ReportCategoryId): string {
  const color = INCIDENT_COLORS[categoryId];
  const svg = incidentIconHtml(categoryId);
  return `
    <div class="incident-marker" style="--marker-color:${color}">
      <span class="incident-marker-icon" aria-hidden="true">${svg}</span>
    </div>
  `;
}

export function incidentLegendIconHtml(categoryId: ReportCategoryId): string {
  const color = INCIDENT_COLORS[categoryId];
  const svg = incidentIconHtml(categoryId);
  return `<span class="incident-legend-icon" style="--legend-color:${color}" aria-hidden="true">${svg}</span>`;
}
