"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type Step = "phone" | "code";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });

    const data = (await res.json()) as {
      error?: string;
      businessName?: string;
      devCode?: string;
    };

    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Could not send code.");
      return;
    }

    setBusinessName(data.businessName ?? "");
    setDevCode(data.devCode ?? null);
    setStep("code");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code }),
    });

    const data = (await res.json()) as { error?: string };

    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Invalid code.");
      return;
    }

    router.push(next);
    router.refresh();
  }

  if (step === "code") {
    return (
      <form onSubmit={verifyCode} className="space-y-4" noValidate>
        <div className="rounded-md bg-blue-100 p-4 text-sm text-grey-950">
          A verification code was sent to <strong>{phone}</strong>
          {businessName ? (
            <>
              {" "}
              for <strong>{businessName}</strong>
            </>
          ) : null}
          .
        </div>

        {devCode ? (
          <div className="rounded-md bg-amber-100 p-3 text-sm text-grey-950">
            Development mode: your code is{" "}
            <strong className="font-mono text-lg">{devCode}</strong>
          </div>
        ) : null}

        <div>
          <label htmlFor="code" className="form-label">
            Verification code<span className="text-coral-600"> *</span>
          </label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="input-field text-center text-xl tracking-[0.4em]"
            placeholder="000000"
            autoComplete="one-time-code"
            aria-invalid={!!error}
            aria-describedby={error ? "code-error" : undefined}
            autoFocus
            required
          />
        </div>

        {error ? (
          <p id="code-error" className="form-error" role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" disabled={loading || code.length < 6} className="btn btn-primary w-full">
          {loading ? "Verifying…" : "Continue to dashboard"}
        </button>

        <button
          type="button"
          onClick={() => {
            setStep("phone");
            setCode("");
            setError("");
          }}
          className="w-full text-sm font-semibold text-navy-800 hover:underline"
        >
          Use a different number
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={requestCode} className="space-y-4" noValidate>
      <p className="supporting-text">
        Enter the mobile number registered to your approved business account.
      </p>

      <div>
        <label htmlFor="phone" className="form-label">
          Mobile number<span className="text-coral-600"> *</span>
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="input-field"
          placeholder="04XX XXX XXX"
          autoComplete="tel"
          aria-invalid={!!error}
          aria-describedby={error ? "phone-error" : "phone-hint"}
          required
        />
        <p id="phone-hint" className="form-hint">
          Australian mobile numbers only. A 6-digit code will be sent by SMS.
        </p>
      </div>

      {error ? (
        <p id="phone-error" className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={loading || !phone.trim()} className="btn btn-primary w-full">
        {loading ? "Sending code…" : "Send verification code"}
      </button>

      <p className="small-text text-center">
        Not registered?{" "}
        <Link href="/register" className="font-semibold text-navy-800 hover:underline">
          Register your business
        </Link>{" "}
        ·{" "}
        <Link href="/contact" className="font-semibold text-navy-800 hover:underline">
          Contact us
        </Link>
      </p>
    </form>
  );
}
