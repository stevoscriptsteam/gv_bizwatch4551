"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { POSTCODE_4551_SUBURBS } from "@/lib/types";

export function ProfileForm({
  initialBusinessName,
  initialEmail,
  initialSuburb,
  initialContactListVisible,
}: {
  initialBusinessName: string;
  initialEmail: string;
  initialSuburb: string | null;
  initialContactListVisible: boolean;
}) {
  const router = useRouter();
  const [businessName, setBusinessName] = useState(initialBusinessName);
  const [email, setEmail] = useState(initialEmail);
  const [suburb, setSuburb] = useState(initialSuburb ?? POSTCODE_4551_SUBURBS[0]);
  const [contactListVisible, setContactListVisible] = useState(initialContactListVisible);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSaved(false);

    const res = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessName, email, suburb, contactListVisible }),
    });

    const data = (await res.json()) as { error?: string };
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Could not save profile.");
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="card card-shadow space-y-4">
      <div>
        <label htmlFor="profile-business-name" className="form-label">
          Business name<span className="text-coral-600"> *</span>
        </label>
        <input
          id="profile-business-name"
          className="input-field"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="profile-email" className="form-label">
          Business email<span className="text-coral-600"> *</span>
        </label>
        <input
          id="profile-email"
          type="email"
          className="input-field"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="profile-suburb" className="form-label">
          Suburb<span className="text-coral-600"> *</span>
        </label>
        <select
          id="profile-suburb"
          className="input-field select-field"
          value={suburb}
          onChange={(e) => setSuburb(e.target.value)}
          required
        >
          {POSTCODE_4551_SUBURBS.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="profile-contact-preference">
        <legend className="form-label">Member contact list</legend>
        <label className="profile-checkbox-label">
          <input
            type="checkbox"
            checked={contactListVisible}
            onChange={(e) => setContactListVisible(e.target.checked)}
          />
          <span>
            Show my business on the member contact list
          </span>
        </label>
        <p className="form-hint">
          Other approved businesses can see your business name, suburb and phone number
          when this is enabled. You can turn this off at any time.
        </p>
      </fieldset>

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      {saved ? (
        <p className="form-hint" role="status">
          Profile updated successfully.
        </p>
      ) : null}

      <button type="submit" disabled={loading} className="btn btn-primary">
        {loading ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
