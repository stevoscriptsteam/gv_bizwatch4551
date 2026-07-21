import type { ReportCategoryId } from "@/lib/types";
import { FaIcon } from "@/components/FaIcon";
import { INCIDENT_ICONS } from "@/lib/icons";

export function ReportCategoryCard({
  id,
  label,
  description,
  selected,
  onSelect,
}: {
  id: ReportCategoryId;
  label: string;
  description: string;
  selected: boolean;
  onSelect: (id: ReportCategoryId) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      aria-pressed={selected}
      className={`card w-full text-left transition-colors ${
        selected ? "border-teal-600 ring-2 ring-teal-600/30" : "hover:border-grey-300"
      }`}
    >
      <span
        className="inline-flex h-8 w-8 items-center justify-center rounded-sm bg-teal-100 text-teal-700"
        aria-hidden="true"
      >
        <FaIcon icon={INCIDENT_ICONS[id]} className="h-4 w-4" />
      </span>
      <p className="card-heading mt-2">{label}</p>
      <p className="small-text mt-1">{description}</p>
    </button>
  );
}
