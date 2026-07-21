"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import { destroyLeafletMap } from "@/lib/leaflet-utils";
import {
  POSTCODE_4551_CENTER,
  POSTCODE_4551_MARKERS,
  POSTCODE_4551_POLYGON,
  POSTCODE_4551_ZOOM,
} from "@/lib/map-4551";

const BRAND = {
  navy: "#0b3558",
  navyLight: "#164a70",
  teal: "#087f83",
  tealBright: "#07999a",
  tealSoft: "#ddf3f1",
  coral: "#e75b45",
};

function markerHtml(name: string, primary = false) {
  const safe = name.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `
    <div class="service-area-marker-inner${primary ? " service-area-marker-inner--primary" : ""}">
      <span class="service-area-marker-label">${safe}</span>
      <span class="service-area-marker-pin" aria-hidden="true"></span>
    </div>
  `;
}

export function ServiceAreaMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let mounted = true;

    void import("leaflet").then((L) => {
      if (!mounted || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        scrollWheelZoom: false,
        zoomControl: false,
        attributionControl: true,
        fadeAnimation: false,
        zoomAnimation: false,
      }).setView(POSTCODE_4551_CENTER, POSTCODE_4551_ZOOM);

      L.control.zoom({ position: "topright" }).addTo(map);

      // Clean, light base with less visual noise than default OSM
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        },
      ).addTo(map);

      // Soft outer boundary
      L.polygon(POSTCODE_4551_POLYGON, {
        color: BRAND.tealBright,
        weight: 1.5,
        opacity: 0.55,
        fillColor: BRAND.tealBright,
        fillOpacity: 0.06,
        dashArray: "7 5",
      }).addTo(map);

      // Main service area fill
      L.polygon(POSTCODE_4551_POLYGON, {
        color: BRAND.navy,
        weight: 2.5,
        opacity: 0.9,
        fillColor: BRAND.teal,
        fillOpacity: 0.28,
      }).addTo(map);

      for (const marker of POSTCODE_4551_MARKERS) {
        const primary = marker.name === "Caloundra";
        const icon = L.divIcon({
          className: "service-area-marker",
          html: markerHtml(marker.name, primary),
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        L.marker([marker.lat, marker.lng], { icon, zIndexOffset: primary ? 1000 : 0 }).addTo(
          map,
        );
      }

      map.fitBounds(L.polygon(POSTCODE_4551_POLYGON).getBounds(), {
        padding: [32, 32],
        maxZoom: 13,
        animate: false,
      });

      mapRef.current = map;
    });

    return () => {
      mounted = false;
      destroyLeafletMap(mapRef.current);
      mapRef.current = null;
    };
  }, []);

  return (
    <figure className="service-area-map-figure">
      <div className="service-area-map-frame">
        <div
          ref={containerRef}
          className="service-area-map"
          role="img"
          aria-label="Map showing the Biz Watchzone covering postcode 4551, Caloundra and surrounding suburbs"
        />
      </div>
      <div className="map-legend map-legend--panel">
        <p className="map-legend-title">Postcode 4551</p>
        <div className="map-legend-grid map-legend-grid--compact">
          <div className="map-legend-row">
            <span className="map-legend-swatch map-legend-swatch--area" aria-hidden="true" />
            <span>Biz Watchzone</span>
          </div>
          <div className="map-legend-row">
            <span className="map-legend-swatch map-legend-swatch--pin" aria-hidden="true" />
            <span>Key suburbs</span>
          </div>
        </div>
      </div>
    </figure>
  );
}
