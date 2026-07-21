"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { AddressSuggestion } from "@/lib/addresses";

type AddressAutocompleteProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: AddressSuggestion) => void;
  error?: string;
  required?: boolean;
};

export function AddressAutocomplete({
  id,
  value,
  onChange,
  onSelect,
  error,
  required,
}: AddressAutocompleteProps) {
  const listId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const fetchSuggestions = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/addresses/search?q=${encodeURIComponent(trimmed)}`);
      const data = (await res.json()) as { suggestions?: AddressSuggestion[] };
      const next = data.suggestions ?? [];
      setSuggestions(next);
      setOpen(next.length > 0);
      setActiveIndex(-1);
    } catch {
      setSuggestions([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchSuggestions(value);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [value, fetchSuggestions]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function pickSuggestion(suggestion: AddressSuggestion) {
    onSelect(suggestion);
    setSuggestions([]);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      pickSuggestion(suggestions[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapperRef} className="address-autocomplete">
      <input
        id={id}
        className="input-field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        aria-invalid={!!error}
        aria-autocomplete="list"
        aria-controls={open ? listId : undefined}
        aria-expanded={open}
        autoComplete="street-address"
        required={required}
        role="combobox"
      />

      {loading ? (
        <p className="form-hint mt-1">Searching addresses in 4551…</p>
      ) : null}

      {open && suggestions.length > 0 ? (
        <ul id={listId} className="address-autocomplete-list" role="listbox">
          {suggestions.map((suggestion, index) => (
            <li key={`${suggestion.address}-${suggestion.latitude}`} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={`address-autocomplete-option${index === activeIndex ? " is-active" : ""}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pickSuggestion(suggestion)}
              >
                <span className="address-autocomplete-option-main">{suggestion.address}</span>
                <span className="address-autocomplete-option-sub">
                  {[suggestion.suburb, "QLD 4551"].filter(Boolean).join(" ")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {!loading && value.trim().length >= 3 && suggestions.length === 0 && !open ? (
        <p className="form-hint mt-1">
          No numbered addresses found in postcode 4551. Include a street number (e.g. 11
          Bulcock Street), pick a suggestion, or use your current location.
        </p>
      ) : null}
    </div>
  );
}
