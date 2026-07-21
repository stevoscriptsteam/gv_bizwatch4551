import { POSTCODE_4551_POLYGON } from "@/lib/map-4551";
import { POSTCODE_4551_SUBURBS } from "@/lib/types";

/** Nominatim viewbox: left, top, right, bottom (lon, lat) */
export const ZONE_VIEWBOX = "153.068,-26.738,153.156,-26.842";

export const ZONE_OUTSIDE_MESSAGE =
  "This address is outside the BizWatch 4551 service area. Please choose a location within postcode 4551.";

export function pointInPostcode4551(latitude: number, longitude: number): boolean {
  const lat = latitude;
  const lng = longitude;
  let inside = false;

  for (let i = 0, j = POSTCODE_4551_POLYGON.length - 1; i < POSTCODE_4551_POLYGON.length; j = i++) {
    const [latI, lngI] = POSTCODE_4551_POLYGON[i];
    const [latJ, lngJ] = POSTCODE_4551_POLYGON[j];
    const intersects =
      latI > lat !== latJ > lat &&
      lng < ((lngJ - lngI) * (lat - latI)) / (latJ - latI) + lngI;

    if (intersects) inside = !inside;
  }

  return inside;
}

export function matchSuburb(name: string | null | undefined): string | null {
  if (!name) return null;
  const lower = name.toLowerCase();
  return (
    POSTCODE_4551_SUBURBS.find(
      (suburb) =>
        suburb.toLowerCase() === lower ||
        lower.includes(suburb.toLowerCase()) ||
        suburb.toLowerCase().includes(lower),
    ) ?? null
  );
}

export function isAllowedPostcode(postcode: string | null | undefined): boolean {
  if (!postcode) return false;
  return postcode.replace(/\D/g, "") === "4551";
}

export function isLocationInZone(input: {
  latitude: number;
  longitude: number;
  postcode?: string | null;
}): boolean {
  if (!pointInPostcode4551(input.latitude, input.longitude)) {
    return false;
  }

  if (input.postcode && !isAllowedPostcode(input.postcode)) {
    return false;
  }

  return true;
}
