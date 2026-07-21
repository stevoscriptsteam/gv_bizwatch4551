"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  REPORT_CATEGORIES,
  POSTCODE_4551_SUBURBS,
  formatReferenceNumber,
  getCategoryLabel,
  type ReportCategoryId,
  type ReportDraft,
} from "@/lib/types";
import {
  geolocationErrorMessage,
  resolveCurrentLocation,
} from "@/lib/geolocation";
import { matchSuburb } from "@/lib/zone-4551";
import { ZONE_OUTSIDE_MESSAGE } from "@/lib/addresses";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { ProgressStepper } from "@/components/ui/ProgressStepper";
import { FormSection, FormField } from "@/components/ui/FormSection";
import { ReportCategoryCard } from "@/components/ui/ReportCategoryCard";
import { ConfirmationPanel } from "@/components/ui/ConfirmationPanel";
import { EmergencyNotice } from "@/components/ui/EmergencyNotice";
import { EvidenceUpload, uploadReportAttachments } from "@/components/EvidenceUpload";
import { FaIcon } from "@/components/FaIcon";
import { faLocationCrosshairs } from "@/lib/icons";

const DRAFT_KEY = "bizwatch-report-draft";

const emptyDraft = (): ReportDraft => ({
  step: 1,
  category: "",
  summary: "",
  incidentDate: "",
  incidentTime: "",
  address: "",
  suburb: POSTCODE_4551_SUBURBS[0],
  latitude: null,
  longitude: null,
  locationNotes: "",
  peopleVehicles: "",
  evidenceNotes: "",
  contactPreference: "either",
  contactNotes: "",
  savedAt: new Date().toISOString(),
});

function normalizeDraft(parsed: Partial<ReportDraft> & { location?: string }): ReportDraft {
  const base = emptyDraft();
  return {
    ...base,
    ...parsed,
    address: parsed.address ?? parsed.location ?? "",
    latitude: parsed.latitude ?? null,
    longitude: parsed.longitude ?? null,
  };
}

export function ReportFlow() {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<ReportDraft>(emptyDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [locating, setLocating] = useState(false);
  const [validatingLocation, setValidatingLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<ReportDraft> & { location?: string };
        setDraft(normalizeDraft(parsed));
        setStep(parsed.step || 1);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const saveDraft = useCallback((updated: ReportDraft) => {
    const withTime = { ...updated, savedAt: new Date().toISOString() };
    setDraft(withTime);
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(withTime));
    } catch {
      /* ignore */
    }
  }, []);

  function update(field: Partial<ReportDraft>) {
    saveDraft({ ...draft, ...field, step });
  }

  function validateStep(): boolean {
    const e: Record<string, string> = {};

    if (step === 1) {
      if (!draft.category) e.category = "Please select an incident category.";
      if (!draft.summary.trim()) e.summary = "Please provide a brief summary.";
      else if (draft.summary.length < 10)
        e.summary = "Summary should be at least 10 characters.";
    }
    if (step === 2) {
      if (!draft.address.trim()) e.address = "Please enter the street address.";
      if (!draft.suburb) e.suburb = "Please select a suburb.";
      if (!draft.incidentDate) e.incidentDate = "Please enter the date of the incident.";
    }
    if (step === 3) {
      /* all optional */
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function validateLocationInZone(current: ReportDraft): Promise<ReportDraft | null> {
    const res = await fetch("/api/addresses/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: current.address,
        suburb: current.suburb,
        latitude: current.latitude,
        longitude: current.longitude,
      }),
    });

    const data = (await res.json()) as {
      error?: string;
      location?: {
        address: string;
        suburb: string | null;
        latitude: number;
        longitude: number;
      };
    };

    if (!res.ok) {
      setErrors({ address: data.error ?? ZONE_OUTSIDE_MESSAGE });
      return null;
    }

    if (!data.location) return current;

    const matchedSuburb = matchSuburb(data.location.suburb) ?? current.suburb;
    return {
      ...current,
      address: data.location.address || current.address,
      suburb: matchedSuburb,
      latitude: data.location.latitude,
      longitude: data.location.longitude,
    };
  }

  async function goNext() {
    if (!validateStep()) return;

    if (step === 2) {
      setValidatingLocation(true);
      try {
        const validated = await validateLocationInZone(draft);
        if (!validated) return;

        const next = step + 1;
        saveDraft({ ...validated, step: next });
        setDraft({ ...validated, step: next });
        setStep(next);
        setErrors({});
        window.scrollTo({ top: 0, behavior: "smooth" });
      } finally {
        setValidatingLocation(false);
      }
      return;
    }

    const next = step + 1;
    saveDraft({ ...draft, step: next });
    setStep(next);
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function setIncidentNow() {
    const now = new Date();
    update({
      incidentDate: now.toISOString().slice(0, 10),
      incidentTime: now.toTimeString().slice(0, 5),
    });
  }

  function goBack() {
    const prev = step - 1;
    saveDraft({ ...draft, step: prev });
    setStep(prev);
    setErrors({});
  }

  // Not a hook — named to avoid the "use" prefix so lint treats it correctly.
  async function applyCurrentLocation() {
    setLocating(true);
    setLocationMessage("");
    setErrors({});

    try {
      const resolved = await resolveCurrentLocation();
      const matchedSuburb = matchSuburb(resolved.suburb);
      update({
        address: resolved.address,
        latitude: resolved.latitude,
        longitude: resolved.longitude,
        ...(matchedSuburb ? { suburb: matchedSuburb } : {}),
      });
      setLocationMessage(
        matchedSuburb
          ? "Current location applied."
          : "Current location applied. Please confirm the suburb below.",
      );
    } catch (error) {
      if (error instanceof GeolocationPositionError) {
        setLocationMessage(geolocationErrorMessage(error));
      } else if (error instanceof Error) {
        setLocationMessage(error.message);
      } else {
        setLocationMessage("Could not use your current location.");
      }
    } finally {
      setLocating(false);
    }
  }

  async function submit() {
    setLoading(true);
    setSubmitError("");

    const validated = await validateLocationInZone(draft);
    if (!validated) {
      setLoading(false);
      setStep(2);
      return;
    }

    if (validated !== draft) {
      saveDraft(validated);
      setDraft(validated);
    }

    const categoryLabel = getCategoryLabel(validated.category);
    const fullDescription = [
      validated.summary,
      validated.incidentDate && `Date: ${validated.incidentDate}`,
      validated.incidentTime && `Time: ${validated.incidentTime}`,
      validated.locationNotes && `Location notes: ${validated.locationNotes}`,
      validated.peopleVehicles && `People/vehicles: ${validated.peopleVehicles}`,
      validated.evidenceNotes && `Evidence: ${validated.evidenceNotes}`,
      `Contact preference: ${validated.contactPreference}`,
      validated.contactNotes && `Contact notes: ${validated.contactNotes}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const res = await fetch("/api/crimes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: validated.summary.slice(0, 120),
        description: fullDescription,
        crimeType: categoryLabel,
        categoryId: validated.category,
        address: validated.address,
        suburb: validated.suburb,
        latitude: validated.latitude,
        longitude: validated.longitude,
      }),
    });

    const data = (await res.json()) as { error?: string; crimeId?: string };
    setLoading(false);

    if (!res.ok) {
      setSubmitError(data.error ?? "Could not submit report. Please try again.");
      return;
    }

    const crimeId = data.crimeId ?? "";
    if (crimeId && pendingFiles.length > 0) {
      const uploadResult = await uploadReportAttachments(crimeId, pendingFiles);
      if (uploadResult.errors.length > 0 && uploadResult.uploaded === 0) {
        setSubmitError(
          `Report submitted but files could not be uploaded: ${uploadResult.errors.join(" ")}`,
        );
        setReference(formatReferenceNumber(crimeId));
        setStep(7);
        return;
      }
    }

    localStorage.removeItem(DRAFT_KEY);
    setReference(formatReferenceNumber(crimeId));
    setStep(7);
  }

  if (reference) {
    return (
      <div className="container-reading mx-auto">
        <ConfirmationPanel reference={reference}>
          <Link href="/dashboard" className="btn btn-primary">
            Go to dashboard
          </Link>
          <Link href="/reports" className="btn btn-secondary ml-3">
            View reports
          </Link>
        </ConfirmationPanel>
      </div>
    );
  }

  return (
    <div className="container-reading mx-auto">
      <EmergencyNotice />
      <ProgressStepper currentStep={step} />

      {step === 1 && (
        <FormSection
          title="Incident details"
          description="Select the category that best describes what happened and provide a brief summary."
        >
          <fieldset>
            <legend className="form-label mb-3">Incident category *</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {REPORT_CATEGORIES.map((cat) => (
                <ReportCategoryCard
                  key={cat.id}
                  id={cat.id}
                  label={cat.label}
                  description={cat.description}
                  selected={draft.category === cat.id}
                  onSelect={(id) => update({ category: id as ReportCategoryId })}
                />
              ))}
            </div>
            {errors.category ? (
              <p className="form-error mt-2" role="alert">
                {errors.category}
              </p>
            ) : null}
          </fieldset>

          <FormField
            label="Brief summary"
            htmlFor="summary"
            required
            hint='Example: "Customer left without paying for goods worth approximately $200."'
            error={errors.summary}
          >
            <textarea
              id="summary"
              className="input-field"
              value={draft.summary}
              onChange={(e) => update({ summary: e.target.value })}
              aria-invalid={!!errors.summary}
              maxLength={500}
              required
            />
            <p className="form-hint">{draft.summary.length}/500 characters</p>
          </FormField>
        </FormSection>
      )}

      {step === 2 && (
        <FormSection
          title="Location and time"
          description="Enter the street address where the incident occurred, or use your current location."
        >
          <FormField
            label="Street address"
            htmlFor="address"
            required
            hint='Type a street number and name to search postcode 4551. Example: "11 Bulcock Street".'
            error={errors.address}
          >
            <AddressAutocomplete
              id="address"
              value={draft.address}
              onChange={(address) =>
                update({
                  address,
                  latitude: null,
                  longitude: null,
                })
              }
              onSelect={(suggestion) => {
                const matchedSuburb = matchSuburb(suggestion.suburb);
                update({
                  address: suggestion.address,
                  latitude: suggestion.latitude,
                  longitude: suggestion.longitude,
                  ...(matchedSuburb ? { suburb: matchedSuburb } : {}),
                });
                setLocationMessage("");
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next.address;
                  return next;
                });
              }}
              error={errors.address}
              required
            />
          </FormField>

          <div>
            <button
              type="button"
              onClick={() => void applyCurrentLocation()}
              disabled={locating}
              className="btn btn-secondary btn-location"
            >
              <FaIcon icon={faLocationCrosshairs} className="btn-location-icon" aria-hidden />
              {locating ? "Getting location…" : "Use my current location"}
            </button>
            {locationMessage ? (
              <p className={`form-hint mt-2${locationMessage.includes("denied") || locationMessage.includes("Could not") ? " form-error" : ""}`}>
                {locationMessage}
              </p>
            ) : null}
            {draft.latitude != null && draft.longitude != null ? (
              <p className="form-hint mt-2">
                Location pinned ({draft.latitude.toFixed(5)}, {draft.longitude.toFixed(5)})
              </p>
            ) : null}
          </div>

          <FormField label="Suburb" htmlFor="suburb" required error={errors.suburb}>
            <select
              id="suburb"
              className="input-field select-field"
              value={draft.suburb}
              onChange={(e) => update({ suburb: e.target.value })}
              required
            >
              {POSTCODE_4551_SUBURBS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </FormField>

          <div>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <span className="form-label mb-0">Date and time of incident *</span>
              <button type="button" onClick={setIncidentNow} className="btn btn-secondary btn-sm">
                Right now
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Date" htmlFor="incidentDate" required error={errors.incidentDate}>
                <input
                  id="incidentDate"
                  type="date"
                  className="input-field"
                  value={draft.incidentDate}
                  onChange={(e) => update({ incidentDate: e.target.value })}
                  required
                />
              </FormField>
              <FormField label="Approximate time" htmlFor="incidentTime" optional hint="Optional but helpful.">
                <input
                  id="incidentTime"
                  type="time"
                  className="input-field"
                  value={draft.incidentTime}
                  onChange={(e) => update({ incidentTime: e.target.value })}
                />
              </FormField>
            </div>
          </div>

          <FormField
            label="Additional location notes"
            htmlFor="locationNotes"
            optional
            hint="Any details that may help identify the area without using exact addresses."
          >
            <textarea
              id="locationNotes"
              className="input-field"
              value={draft.locationNotes}
              onChange={(e) => update({ locationNotes: e.target.value })}
            />
          </FormField>
        </FormSection>
      )}

      {step === 3 && (
        <FormSection
          title="People or vehicles involved"
          description="Describe anyone or any vehicles involved. Only include details you are comfortable sharing."
        >
          <FormField
            label="Description"
            htmlFor="peopleVehicles"
            optional
            hint='Example: "Male, approx. 30 years, blue hoodie. White ute, QLD plates."'
          >
            <textarea
              id="peopleVehicles"
              className="input-field min-h-[160px]"
              value={draft.peopleVehicles}
              onChange={(e) => update({ peopleVehicles: e.target.value })}
            />
          </FormField>
          <p className="small-text">
            Do not include names unless necessary. BizWatch does not publish personal
            identifying details in local alerts.
          </p>
        </FormSection>
      )}

      {step === 4 && (
        <FormSection
          title="Evidence and attachments"
          description="Describe any photographs, CCTV footage or other evidence you have available."
        >
          <FormField
            label="Evidence details"
            htmlFor="evidenceNotes"
            optional
            hint="Describe any photographs, CCTV footage or other evidence you have available."
          >
            <textarea
              id="evidenceNotes"
              className="input-field min-h-[160px]"
              value={draft.evidenceNotes}
              onChange={(e) => update({ evidenceNotes: e.target.value })}
              placeholder="Example: CCTV camera at front entrance, footage available for 30 days."
            />
          </FormField>
          <EvidenceUpload
            files={pendingFiles}
            onChange={(files) => {
              setPendingFiles(files);
              setFileError("");
            }}
            error={fileError}
          />
          <p className="small-text mt-3">
            Evidence files are stored securely and are only visible to you and BizWatch
            coordinators — not other businesses in the feed.
          </p>
        </FormSection>
      )}

      {step === 5 && (
        <FormSection
          title="Contact preferences"
          description="Let us know how you prefer to be contacted if we need more information."
        >
          <fieldset>
            <legend className="form-label mb-3">Preferred contact method</legend>
            <div className="space-y-2">
              {(
                [
                  ["phone", "Phone"],
                  ["email", "Email"],
                  ["either", "Either phone or email"],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="contactPreference"
                    value={value}
                    checked={draft.contactPreference === value}
                    onChange={() => update({ contactPreference: value })}
                    className="h-5 w-5 accent-navy-900"
                  />
                  <span className="text-[15px]">{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <FormField
            label="Additional contact notes"
            htmlFor="contactNotes"
            optional
            hint="Best times to call, alternative contact, etc."
          >
            <textarea
              id="contactNotes"
              className="input-field"
              value={draft.contactNotes}
              onChange={(e) => update({ contactNotes: e.target.value })}
            />
          </FormField>
        </FormSection>
      )}

      {step === 6 && (
        <FormSection title="Review and submit" description="Please check your report before submitting.">
          <dl className="card space-y-3 text-sm">
            <div>
              <dt className="font-semibold text-grey-700">Category</dt>
              <dd>{getCategoryLabel(draft.category)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-grey-700">Summary</dt>
              <dd>{draft.summary}</dd>
            </div>
            <div>
              <dt className="font-semibold text-grey-700">Address</dt>
              <dd>
                {draft.address}, {draft.suburb}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-grey-700">Date and time</dt>
              <dd>
                {draft.incidentDate}
                {draft.incidentTime ? ` at ${draft.incidentTime}` : ""}
              </dd>
            </div>
            {draft.peopleVehicles ? (
              <div>
                <dt className="font-semibold text-grey-700">People or vehicles</dt>
                <dd>{draft.peopleVehicles}</dd>
              </div>
            ) : null}
            {draft.evidenceNotes ? (
              <div>
                <dt className="font-semibold text-grey-700">Evidence</dt>
                <dd>{draft.evidenceNotes}</dd>
              </div>
            ) : null}
            {pendingFiles.length > 0 ? (
              <div>
                <dt className="font-semibold text-grey-700">Attachments</dt>
                <dd>
                  {pendingFiles.length} file{pendingFiles.length === 1 ? "" : "s"} ready to
                  upload
                </dd>
              </div>
            ) : null}
          </dl>

          <p className="small-text mt-4">
            By submitting, you confirm this information is accurate to the best of your
            knowledge. BizWatch reports are not monitored as an emergency service.
          </p>

          {submitError ? (
            <p className="form-error mt-3" role="alert">
              {submitError}
            </p>
          ) : null}
        </FormSection>
      )}

      {step < 7 && (
        <div className="mt-8 flex flex-wrap gap-3 border-t border-grey-200 pt-6">
          {step > 1 ? (
            <button type="button" onClick={goBack} className="btn btn-secondary">
              Back
            </button>
          ) : null}
          {step < 6 ? (
            <button
              type="button"
              onClick={() => void goNext()}
              disabled={validatingLocation}
              className="btn btn-primary"
            >
              {validatingLocation ? "Checking location…" : "Continue"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void submit()}
              disabled={loading}
              className="btn btn-report"
            >
              {loading ? "Submitting…" : "Submit report"}
            </button>
          )}
          <p className="w-full small-text">
            Your progress is saved automatically. Last saved:{" "}
            {new Date(draft.savedAt).toLocaleString("en-AU")}
          </p>
        </div>
      )}
    </div>
  );
}
