import { REPORT_CATEGORIES } from "@/lib/types";
import { FaIcon } from "@/components/FaIcon";
import { INCIDENT_COLORS, INCIDENT_ICONS } from "@/lib/icons";

type ReportsMapLegendProps = {
  footnote?: string;
};

export function ReportsMapLegend({
  footnote = "Tap a marker for details",
}: ReportsMapLegendProps) {
  return (
    <div className="map-legend map-legend--panel">
      <p className="map-legend-title">Recent reports</p>
      <div className="map-legend-grid">
        {REPORT_CATEGORIES.map((category) => (
          <div key={category.id} className="map-legend-row">
            <span
              className="incident-legend-icon"
              style={{ color: INCIDENT_COLORS[category.id] }}
              aria-hidden="true"
            >
              <FaIcon icon={INCIDENT_ICONS[category.id]} />
            </span>
            <span>{category.label}</span>
          </div>
        ))}
      </div>
      {footnote ? <p className="map-legend-footnote">{footnote}</p> : null}
    </div>
  );
}
