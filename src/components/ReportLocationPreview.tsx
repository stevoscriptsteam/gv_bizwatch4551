"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import type { Crime } from "@/lib/types";
import { getCrimeCoordinates } from "@/lib/incident-icons";
import { destroyLeafletMap } from "@/lib/leaflet-utils";

type ReportLocationPreviewProps = {
  crime: Crime;
  markerColor: string;
};

export function ReportLocationPreview({ crime, markerColor }: ReportLocationPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const [visible, setVisible] = useState(false);
  const coords = getCrimeCoordinates(crime);
  const lat = coords?.[0] ?? null;
  const lng = coords?.[1] ?? null;

  useEffect(() => {
    if (lat == null || lng == null || !containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "80px" },
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [lat, lng]);

  useEffect(() => {
    if (!visible || lat == null || lng == null || !containerRef.current || mapRef.current) {
      return;
    }

    let mounted = true;
    const viewCoords: [number, number] = [lat, lng];

    void import("leaflet").then((L) => {
      if (!mounted || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        scrollWheelZoom: false,
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        doubleClickZoom: false,
        touchZoom: false,
        boxZoom: false,
        keyboard: false,
        fadeAnimation: false,
        zoomAnimation: false,
      }).setView(viewCoords, 15);

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        { subdomains: "abcd", maxZoom: 19 },
      ).addTo(map);

      const icon = L.divIcon({
        className: "report-preview-marker-wrap",
        html: `<span class="report-preview-marker" style="--marker-color:${markerColor}"></span>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      L.marker(viewCoords, { icon }).addTo(map);
      mapRef.current = map;
    });

    return () => {
      mounted = false;
      destroyLeafletMap(mapRef.current);
      mapRef.current = null;
    };
  }, [visible, lat, lng, markerColor]);

  if (!coords) return null;

  const label = crime.address || crime.location;

  return (
    <div className="report-feed-card-map" aria-hidden={!visible}>
      <div
        ref={containerRef}
        className="report-feed-card-map-inner"
        role="img"
        aria-label={`Map preview near ${label}`}
      />
    </div>
  );
}
