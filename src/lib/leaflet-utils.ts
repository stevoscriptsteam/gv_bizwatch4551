import type { Map as LeafletMap } from "leaflet";

/** Stop animations and remove a Leaflet map without throwing during zoom transitions. */
export function destroyLeafletMap(map: LeafletMap | null | undefined) {
  if (!map) return;

  try {
    map.stop();
  } catch {
    // Map may already be partially torn down.
  }

  try {
    map.remove();
  } catch {
    // Ignore remove errors during React strict-mode double unmount.
  }
}
