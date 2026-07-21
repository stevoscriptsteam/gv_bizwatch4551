"use client";

import { useState } from "react";
import Link from "next/link";
import { POSTCODE_4551_SUBURBS } from "@/lib/types";

export function RegisterForm() {
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [suburb, setSuburb] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessName, phone, email, suburb }),
    });

    const data = (await res.json()) as { error?: string };

    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Could not submit registration.");
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="card card-shadow" role="status" aria-live="polite">
        <p className="category-label text-teal-700">Registration received</p>
        <h2 className="card-heading mt-2">Thank you for registering</h2>
        <p className="supporting-text mt-3">
          Your application for <strong>{businessName}</strong> has been submitted. BizWatch
          4551 is a private service. Access is granted only after your business is
          reviewed and approved.
        </p>
        <p className="supporting-text mt-3">
          We will contact you at <strong>{email}</strong> once your registration has been
          approved. You can then sign in with your registered mobile number.
        </p>
        <Link href="/sign-in" className="btn btn-primary mt-6 inline-flex">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card card-shadow space-y-4" noValidate>
      <p className="supporting-text">
        Register your business to apply for access. Only registered businesses in postcode
        4551 can sign in, submit reports and receive local alerts.
      </p>

      <div>
        <label htmlFor="businessName" className="form-label">
          Business name<span className="text-coral-600"> *</span>
        </label>
        <input
          id="businessName"
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className="input-field"
          autoComplete="organization"
          required
        />
      </div>

      <div>
        <label htmlFor="register-phone" className="form-label">
          Mobile number<span className="text-coral-600"> *</span>
        </label>
        <input
          id="register-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="input-field"
          placeholder="04XX XXX XXX"
          autoComplete="tel"
          aria-describedby="register-phone-hint"
          required
        />
        <p id="register-phone-hint" className="form-hint">
          This number will be used to sign in once your registration is approved.
        </p>
      </div>

      <div>
        <label htmlFor="register-email" className="form-label">
          Business email<span className="text-coral-600"> *</span>
        </label>
        <input
          id="register-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
          autoComplete="email"
          required
        />
      </div>

      <div>
        <label htmlFor="suburb" className="form-label">
          Suburb<span className="text-coral-600"> *</span>
        </label>
        <select
          id="suburb"
          value={suburb}
          onChange={(e) => setSuburb(e.target.value)}
          className="input-field"
          required
        >
          <option value="">Select suburb</option>
          {POSTCODE_4551_SUBURBS.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading || !businessName.trim() || !phone.trim() || !email.trim() || !suburb}
        className="btn btn-primary w-full"
      >
        {loading ? "Submitting…" : "Submit registration"}
      </button>

      <p className="small-text text-center">
        Already approved?{" "}
        <Link href="/sign-in" className="font-semibold text-navy-800 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
