"use client";

import { useEffect, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import type { Crime } from "@/lib/types";
import { formatReferenceNumber, formatReporterLabel } from "@/lib/types";
import {
  POSTCODE_4551_CENTER,
  POSTCODE_4551_POLYGON,
  POSTCODE_4551_ZOOM,
} from "@/lib/map-4551";
import {
  getCategoryId,
  getCrimeCoordinates,
  incidentMarkerHtml,
} from "@/lib/incident-icons";
import { destroyLeafletMap } from "@/lib/leaflet-utils";
import { ReportsMapLegend } from "@/components/ReportsMapLegend";

type ReportsMapProps = {
  crimes: Crime[];
};

type LeafletModule = typeof import("leaflet");

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function ReportsMap({ crimes }: ReportsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersLayerRef = useRef<LayerGroup | null>(null);
  const leafletRef = useRef<LeafletModule | null>(null);
  const didInitialFitRef = useRef(false);
  const markerSignatureRef = useRef<string>("");
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    let mounted = true;

    void import("leaflet").then((L) => {
      if (!mounted || !containerRef.current || mapRef.current) return;

      leafletRef.current = L;

      const map = L.map(containerRef.current, {
        scrollWheelZoom: false,
        zoomControl: true,
        attributionControl: true,
        fadeAnimation: false,
        zoomAnimation: false,
      }).setView(POSTCODE_4551_CENTER, POSTCODE_4551_ZOOM);

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        },
      ).addTo(map);

      L.polygon(POSTCODE_4551_POLYGON, {
        color: "#07999a",
        weight: 1,
        opacity: 0.4,
        fillColor: "#087f83",
        fillOpacity: 0.06,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setMapReady(true);
    });

    return () => {
      mounted = false;
      didInitialFitRef.current = false;
      markerSignatureRef.current = "";
      setMapReady(false);
      destroyLeafletMap(mapRef.current);
      mapRef.current = null;
      markersLayerRef.current = null;
      leafletRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;
    const L = leafletRef.current;
    if (!mapReady || !map || !markersLayer || !L) return;

    const mappable = crimes
      .map((crime) => {
        const coords = getCrimeCoordinates(crime);
        if (!coords) return null;
        return { crime, coords };
      })
      .filter(Boolean) as { crime: Crime; coords: [number, number] }[];

    const markerSignature = mappable
      .map(
        ({ crime, coords }) =>
          `${crime.id}:${coords[0]}:${coords[1]}:${crime.title}:${crime.crime_type}:${crime.address ?? ""}:${crime.location}`,
      )
      .join("|");

    if (markerSignatureRef.current !== markerSignature) {
      markerSignatureRef.current = markerSignature;
      markersLayer.clearLayers();

      for (const { crime, coords } of mappable) {
        const categoryId = getCategoryId(crime.category_id, crime.crime_type);
        const icon = L.divIcon({
          className: "incident-marker-wrap",
          html: incidentMarkerHtml(categoryId),
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const displayAddress = crime.address || crime.location;
        const reporter = formatReporterLabel(crime);
        L.marker(coords, { icon })
          .addTo(markersLayer)
          .bindPopup(
            `<div class="incident-popup">
              <p class="incident-popup-category">${escapeHtml(crime.crime_type)}</p>
              <p class="incident-popup-title">${escapeHtml(crime.title)}</p>
              <p class="incident-popup-address">${escapeHtml(displayAddress)}</p>
              <p class="incident-popup-meta">Reported by ${escapeHtml(reporter)}</p>
              <p class="incident-popup-meta">${formatDate(crime.created_at)} · ${formatReferenceNumber(crime.id)}</p>
              <a href="/reports?id=${encodeURIComponent(crime.id)}" class="incident-popup-link">View report</a>
            </div>`,
          );
      }
    }

    // Fit once on first load only. Later crime refreshes / engagement updates
    // must not yank the viewport back while the user is panning or viewing a popup.
    if (didInitialFitRef.current) return;

    const fitOptions = { animate: false, padding: [24, 24] as [number, number] };

    if (mappable.length > 0) {
      const bounds = L.latLngBounds(mappable.map(({ coords }) => coords));
      map.fitBounds(bounds.pad(0.15), { ...fitOptions, maxZoom: 14 });
      didInitialFitRef.current = true;
    } else {
      map.fitBounds(L.polygon(POSTCODE_4551_POLYGON).getBounds(), {
        ...fitOptions,
        maxZoom: 13,
      });
      didInitialFitRef.current = true;
    }
  }, [crimes, mapReady]);

  const mappableCount = crimes.filter((crime) => getCrimeCoordinates(crime)).length;

  return (
    <div className="reports-map-section">
      <div className="service-area-map-frame">
        <div
          ref={containerRef}
          className="service-area-map reports-map"
          role="img"
          aria-label={`Map showing ${mappableCount} recent reports across postcode 4551`}
        />
      </div>
      <ReportsMapLegend />
      {mappableCount === 0 ? (
        <p className="small-text mt-2">
          No mapped reports yet. New reports with an address will appear here.
        </p>
      ) : null}
    </div>
  );
}
