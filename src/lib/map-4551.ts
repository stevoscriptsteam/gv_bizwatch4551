/** Approximate postcode 4551 service area (Caloundra & surrounds) */

export type MapMarker = {
  name: string;
  lat: number;
  lng: number;
};

/** Polygon tracing the 4551 postcode area (lat/lng for Leaflet) */
export const POSTCODE_4551_POLYGON: [number, number][] = [
  [-26.746, 153.082],
  [-26.738, 153.108],
  [-26.741, 153.132],
  [-26.752, 153.148],
  [-26.768, 153.156],
  [-26.788, 153.154],
  [-26.806, 153.152],
  [-26.822, 153.148],
  [-26.836, 153.138],
  [-26.842, 153.118],
  [-26.838, 153.098],
  [-26.824, 153.082],
  [-26.808, 153.072],
  [-26.788, 153.068],
  [-26.768, 153.072],
  [-26.746, 153.082],
];

export const POSTCODE_4551_MARKERS: MapMarker[] = [
  { name: "Caloundra", lat: -26.803, lng: 153.121 },
  { name: "Kawana Waters", lat: -26.745, lng: 153.123 },
  { name: "Golden Beach", lat: -26.833, lng: 153.113 },
  { name: "Currimundi", lat: -26.758, lng: 153.108 },
  { name: "Moffat Beach", lat: -26.795, lng: 153.142 },
  { name: "Pelican Waters", lat: -26.828, lng: 153.098 },
  { name: "Caloundra West", lat: -26.788, lng: 153.088 },
  { name: "Little Mountain", lat: -26.752, lng: 153.092 },
];

export const POSTCODE_4551_CENTER: [number, number] = [-26.792, 153.118];
export const POSTCODE_4551_ZOOM = 12;

export const POSTCODE_4551_CAPTION =
  "BizWatch covers registered businesses across postcode 4551, including Caloundra, Kawana Waters, Golden Beach, Pelican Waters, Currimundi, Moffat Beach and surrounding suburbs.";
