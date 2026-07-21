import type { ReportCategoryId } from "@/lib/types";
import { REPORT_CATEGORIES } from "@/lib/types";
import { POSTCODE_4551_MARKERS } from "@/lib/map-4551";
import { incidentMarkerHtml } from "@/lib/icons";

const labelToId = new Map<string, ReportCategoryId>(
  REPORT_CATEGORIES.map((c) => [c.label, c.id]),
);

export function getCategoryIdFromLabel(label: string): ReportCategoryId {
  return labelToId.get(label) ?? "other";
}

export function getCategoryId(
  categoryId: string | null | undefined,
  crimeType: string,
): ReportCategoryId {
  if (
    categoryId &&
    REPORT_CATEGORIES.some((category) => category.id === categoryId)
  ) {
    return categoryId as ReportCategoryId;
  }
  return getCategoryIdFromLabel(crimeType);
}

export { incidentMarkerHtml };

const suburbCenters = Object.fromEntries(
  POSTCODE_4551_MARKERS.map((m) => [m.name, [m.lat, m.lng] as [number, number]]),
);

export function getCrimeCoordinates(crime: {
  latitude?: number | null;
  longitude?: number | null;
  suburb?: string | null;
}): [number, number] | null {
  if (crime.latitude != null && crime.longitude != null) {
    return [crime.latitude, crime.longitude];
  }

  if (crime.suburb && suburbCenters[crime.suburb]) {
    return suburbCenters[crime.suburb];
  }

  return null;
}
