"use client";

import { useState } from "react";
import { POSTCODE_4551_SUBURBS, REPORT_CATEGORIES } from "@/lib/types";

type Prefs = {
  enabled: boolean;
  categories: string[];
  suburbs: string[];
};

function CheckboxGroup({
  legend,
  options,
  selected,
  onChange,
  disabled,
}: {
  legend: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
  disabled: boolean;
}) {
  const allSelected = selected.length === options.length;

  function toggle(value: string) {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value],
    );
  }

  return (
    <fieldset className="notify-group" disabled={disabled}>
      <legend className="sr-only">{legend}</legend>
      <div className="notify-group-header">
        <span className="form-label notify-group-legend" aria-hidden="true">
          {legend}
        </span>
        <button
          type="button"
          className="notify-group-toggle-all"
          onClick={() =>
            onChange(allSelected ? [] : options.map((o) => o.value))
          }
          disabled={disabled}
        >
          {allSelected ? "Clear all" : "Select all"}
        </button>
      </div>
      <div className="notify-options">
        {options.map((option) => (
          <label key={option.value} className="notify-option">
            <input
              type="checkbox"
              checked={selected.includes(option.value)}
              onChange={() => toggle(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function NotificationPrefsCard({
  initialPrefs,
  phone,
}: {
  initialPrefs: Prefs;
  phone: string;
}) {
  const [enabled, setEnabled] = useState(initialPrefs.enabled);
  const [categories, setCategories] = useState<string[]>(initialPrefs.categories);
  const [suburbs, setSuburbs] = useState<string[]>(initialPrefs.suburbs);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    setSaved(false);

    const res = await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled, categories, suburbs }),
    });

    const data = (await res.json()) as { error?: string };
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Could not save notification settings.");
      return;
    }

    setSaved(true);
  }

  return (
    <section
      className="card card-shadow space-y-4"
      aria-labelledby="notify-heading"
    >
      <div>
        <h2 id="notify-heading" className="team-card-title">
          SMS alert notifications
        </h2>
        <p className="form-hint">
          Get an SMS when another business reports an incident matching the
          types and suburbs you choose. Alerts are sent to{" "}
          <strong>{phone}</strong>.
        </p>
      </div>

      <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
        <label className="profile-checkbox-label">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => {
              const on = e.target.checked;
              setEnabled(on);
              setSaved(false);
              // Sensible defaults the first time alerts are switched on.
              if (on && categories.length === 0) {
                setCategories(REPORT_CATEGORIES.map((c) => c.id));
              }
              if (on && suburbs.length === 0) {
                setSuburbs([...POSTCODE_4551_SUBURBS]);
              }
            }}
          />
          <span>Send me SMS alerts for new reports</span>
        </label>

        {enabled ? (
          <>
            <CheckboxGroup
              legend="Incident types"
              options={REPORT_CATEGORIES.map((c) => ({
                value: c.id,
                label: c.label,
              }))}
              selected={categories}
              onChange={(next) => {
                setCategories(next);
                setSaved(false);
              }}
              disabled={saving}
            />

            <CheckboxGroup
              legend="Suburbs"
              options={POSTCODE_4551_SUBURBS.map((s) => ({
                value: s,
                label: s,
              }))}
              selected={suburbs}
              onChange={(next) => {
                setSuburbs(next);
                setSaved(false);
              }}
              disabled={saving}
            />

            <p className="form-hint">
              You will only be notified when a report matches one of your
              selected incident types <strong>and</strong> one of your selected
              suburbs.
            </p>
          </>
        ) : null}

        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}

        {saved ? (
          <p className="form-hint" role="status">
            Notification settings saved.
          </p>
        ) : null}

        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving ? "Saving…" : "Save notification settings"}
        </button>
      </form>
    </section>
  );
}
