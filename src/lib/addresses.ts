import {
  isAllowedPostcode,
  isLocationInZone,
  matchSuburb,
  ZONE_OUTSIDE_MESSAGE,
} from "@/lib/zone-4551";
import { POSTCODE_4551_CENTER } from "@/lib/map-4551";

export type AddressSuggestion = {
  address: string;
  suburb: string | null;
  latitude: number;
  longitude: number;
};

const NOMINATIM_HEADERS = {
  Accept: "application/json",
  "Accept-Language": "en-AU",
  "User-Agent": "BizWatch4551/1.0 (community safety reporting)",
};

type NominatimAddress = Record<string, string>;

type EsriSuggestion = {
  text: string;
  magicKey?: string;
  isCollection?: boolean;
};

type EsriCandidate = {
  address?: string;
  location?: { x: number; y: number };
  score?: number;
  attributes?: {
    StAddr?: string;
    City?: string;
    Region?: string;
    Postal?: string;
  };
};

const ESRI_CENTER = `${POSTCODE_4551_CENTER[1]},${POSTCODE_4551_CENTER[0]}`;

function formatStreetLine(houseNumber: string, street: string): string {
  return `${houseNumber.trim()} ${street.trim()}`;
}

function extractSuburb(parts: {
  suburb?: string | null;
  city?: string | null;
  district?: string | null;
  locality?: string | null;
  town?: string | null;
  city_district?: string | null;
  village?: string | null;
}): string | null {
  return matchSuburb(
    parts.suburb ??
      parts.city_district ??
      parts.district ??
      parts.locality ??
      parts.town ??
      parts.city ??
      parts.village,
  );
}

function suburbFromEsriAddress(address: string, city?: string): string | null {
  const parts = address.split(",").map((part) => part.trim());
  for (const part of parts.slice(1)) {
    const matched = matchSuburb(part);
    if (matched) return matched;
  }
  return matchSuburb(city);
}

function parseEsriCandidate(candidate: EsriCandidate): AddressSuggestion | null {
  if (!candidate.location || !candidate.address) return null;

  const latitude = candidate.location.y;
  const longitude = candidate.location.x;
  const postcode = candidate.attributes?.Postal ?? null;

  if (!isAllowedPostcode(postcode)) return null;
  if (!isLocationInZone({ latitude, longitude, postcode })) return null;

  const address =
    candidate.attributes?.StAddr?.trim() ||
    candidate.address.split(",")[0]?.trim() ||
    candidate.address;

  const suburb = suburbFromEsriAddress(
    candidate.address,
    candidate.attributes?.City,
  );

  return {
    address,
    suburb,
    latitude,
    longitude,
  };
}

async function geocodeEsriCandidate(
  suggestion: EsriSuggestion,
): Promise<AddressSuggestion | null> {
  const params = new URLSearchParams({
    SingleLine: suggestion.text.replace(/, AUS$/i, ""),
    countryCode: "AUS",
    location: ESRI_CENTER,
    outFields: "StAddr,City,Region,Postal",
    maxLocations: "1",
    f: "json",
  });

  if (suggestion.magicKey) {
    params.set("magicKey", suggestion.magicKey);
  }

  const res = await fetch(
    `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?${params.toString()}`,
    { next: { revalidate: 0 } },
  );

  if (!res.ok) return null;

  const data = (await res.json()) as { candidates?: EsriCandidate[] };
  const candidate = data.candidates?.[0];
  if (!candidate) return null;

  return parseEsriCandidate(candidate);
}

async function searchEsriAddresses(query: string): Promise<AddressSuggestion[]> {
  const params = new URLSearchParams({
    text: query,
    countryCode: "AUS",
    location: ESRI_CENTER,
    distance: "25000",
    maxSuggestions: "8",
    f: "json",
  });

  const res = await fetch(
    `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest?${params.toString()}`,
    { next: { revalidate: 0 } },
  );

  if (!res.ok) return [];

  const data = (await res.json()) as { suggestions?: EsriSuggestion[] };
  const suggestions = (data.suggestions ?? []).filter(
    (item) => !item.isCollection && /\b4551\b/.test(item.text),
  );

  if (suggestions.length === 0) return [];

  const geocoded = await Promise.all(
    suggestions.slice(0, 8).map((item) => geocodeEsriCandidate(item)),
  );

  return geocoded.filter(Boolean) as AddressSuggestion[];
}

async function findEsriAddress(query: string): Promise<AddressSuggestion | null> {
  const params = new URLSearchParams({
    SingleLine: query,
    countryCode: "AUS",
    location: ESRI_CENTER,
    outFields: "StAddr,City,Region,Postal",
    maxLocations: "5",
    f: "json",
  });

  const res = await fetch(
    `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?${params.toString()}`,
    { next: { revalidate: 0 } },
  );

  if (!res.ok) return null;

  const data = (await res.json()) as { candidates?: EsriCandidate[] };
  for (const candidate of data.candidates ?? []) {
    const parsed = parseEsriCandidate(candidate);
    if (parsed) return parsed;
  }

  return null;
}

function dedupeSuggestions(items: AddressSuggestion[]): AddressSuggestion[] {
  const seen = new Set<string>();
  const results: AddressSuggestion[] = [];

  for (const item of items) {
    const key = `${item.address.toLowerCase()}|${item.latitude.toFixed(5)}|${item.longitude.toFixed(5)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(item);
  }

  return results;
}

function scoreSuggestion(query: string, suggestion: AddressSuggestion): number {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedAddress = suggestion.address.toLowerCase();
  let score = 0;

  if (normalizedAddress.startsWith(normalizedQuery)) score += 30;
  else if (normalizedAddress.includes(normalizedQuery)) score += 15;

  const queryNumber = normalizedQuery.match(/^(\d+)/)?.[1];
  const addressNumber = normalizedAddress.match(/^(\d+)/)?.[1];
  if (queryNumber && addressNumber === queryNumber) score += 25;

  const queryStreet = normalizedQuery.replace(/^\d+\s*/, "");
  const addressStreet = normalizedAddress.replace(/^\d+\s*/, "");
  if (queryStreet && addressStreet.includes(queryStreet)) score += 10;

  return score;
}

function rankSuggestions(query: string, items: AddressSuggestion[]): AddressSuggestion[] {
  return [...items].sort(
    (a, b) => scoreSuggestion(query, b) - scoreSuggestion(query, a),
  );
}

export async function searchAddressesInZone(
  query: string,
): Promise<AddressSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const esriResults = await searchEsriAddresses(trimmed);

  return rankSuggestions(trimmed, dedupeSuggestions(esriResults)).slice(0, 6);
}

export async function reverseGeocodeInZone(
  latitude: number,
  longitude: number,
): Promise<AddressSuggestion> {
  if (!isLocationInZone({ latitude, longitude })) {
    throw new Error(ZONE_OUTSIDE_MESSAGE);
  }

  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    format: "json",
    addressdetails: "1",
  });

  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
    { headers: NOMINATIM_HEADERS, next: { revalidate: 0 } },
  );

  if (!res.ok) {
    throw new Error("Could not look up address for your location.");
  }

  const data = (await res.json()) as {
    display_name?: string;
    address?: NominatimAddress;
  };

  const parts = data.address ?? {};
  const postcode = parts.postcode ?? null;

  if (!isLocationInZone({ latitude, longitude, postcode })) {
    throw new Error(ZONE_OUTSIDE_MESSAGE);
  }

  if (postcode && !isAllowedPostcode(postcode)) {
    throw new Error(ZONE_OUTSIDE_MESSAGE);
  }

  const suburb = extractSuburb({
    suburb: parts.suburb,
    city_district: parts.city_district,
    town: parts.town,
    city: parts.city,
    village: parts.village,
  });

  const houseNumber = parts.house_number?.trim();
  const road = parts.road?.trim();
  const address =
    houseNumber && road
      ? formatStreetLine(houseNumber, road)
      : road ||
        data.display_name?.split(",").slice(0, 2).join(", ").trim() ||
        `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

  return {
    address,
    suburb,
    latitude,
    longitude,
  };
}

export async function geocodeAddressInZone(input: {
  address: string;
  suburb?: string;
}): Promise<AddressSuggestion> {
  const streetQuery = input.address.trim();
  if (!streetQuery) {
    throw new Error("Enter a street number and name.");
  }

  if (!/^\d+\s/.test(streetQuery)) {
    throw new Error(
      "Include a street number, for example: 11 Bulcock Street. Pick a suggestion from the list if one appears.",
    );
  }

  const query = [streetQuery, input.suburb?.trim(), "QLD 4551"]
    .filter(Boolean)
    .join(", ");

  const located = await findEsriAddress(query);
  if (located) return located;

  throw new Error(
    "Could not find that address in postcode 4551. Choose a suggestion from the list or use your current location.",
  );
}

export { ZONE_OUTSIDE_MESSAGE };
