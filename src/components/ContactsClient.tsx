"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { BusinessContact } from "@/lib/types";
import { formatPhoneDisplay } from "@/lib/phone";
import { FaIcon } from "@/components/FaIcon";
import { faMagnifyingGlass } from "@/lib/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { EmergencyNotice } from "@/components/ui/EmergencyNotice";

export function ContactsClient() {
  const [contacts, setContacts] = useState<BusinessContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const refresh = useCallback(async () => {
    const res = await fetch("/api/contacts");
    if (res.ok) {
      const data = (await res.json()) as { contacts: BusinessContact[] };
      setContacts(data.contacts);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filteredContacts = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return contacts;

    return contacts.filter((contact) => {
      const business = contact.business_name.toLowerCase();
      const suburb = (contact.suburb ?? "").toLowerCase();
      const phone = formatPhoneDisplay(contact.phone).toLowerCase();
      const phoneDigits = contact.phone.replace(/\D/g, "");
      const queryDigits = trimmed.replace(/\D/g, "");

      return (
        business.includes(trimmed) ||
        suburb.includes(trimmed) ||
        phone.includes(trimmed) ||
        (queryDigits.length > 0 && phoneDigits.includes(queryDigits))
      );
    });
  }, [contacts, query]);

  return (
    <div className="container-content">
      <PageHeader
        title="Business contacts"
        description="Approved BizWatch members who have chosen to share their contact details with other businesses."
      />

      <EmergencyNotice />

      {loading ? (
        <p className="supporting-text mt-8">Loading contacts…</p>
      ) : contacts.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No contacts listed"
            description="No businesses are currently visible on the contact list. You can choose whether to appear in Edit profile."
            action={
              <Link href="/profile" className="btn btn-secondary">
                Edit profile
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <div className="contacts-search mt-8">
            <label htmlFor="contacts-search" className="sr-only">
              Search contacts
            </label>
            <span className="contacts-search-icon" aria-hidden="true">
              <FaIcon icon={faMagnifyingGlass} />
            </span>
            <input
              id="contacts-search"
              type="search"
              className="input-field"
              placeholder="Search by business, suburb or phone"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
            {query.trim() ? (
              <p className="contacts-search-meta" aria-live="polite">
                {filteredContacts.length} of {contacts.length} contacts
              </p>
            ) : null}
          </div>

          {filteredContacts.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="No matching contacts"
                description={`No businesses match “${query.trim()}”. Try a different name, suburb or phone number.`}
              />
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="contacts-table w-full min-w-[480px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-grey-200 bg-grey-100">
                    <th className="p-3 font-semibold" scope="col">
                      Business
                    </th>
                    <th className="p-3 font-semibold" scope="col">
                      Suburb
                    </th>
                    <th className="p-3 font-semibold" scope="col">
                      Phone
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map((contact) => (
                    <tr key={contact.id} className="border-b border-grey-200">
                      <td className="p-3 font-semibold text-navy-900">
                        {contact.business_name}
                      </td>
                      <td className="p-3 text-grey-700">{contact.suburb ?? "Not listed"}</td>
                      <td className="p-3">
                        <a
                          href={`tel:${contact.phone}`}
                          className="contacts-phone-link font-mono text-sm text-teal-700 hover:underline"
                        >
                          {formatPhoneDisplay(contact.phone)}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <p className="supporting-text mt-6">
        To hide your business from this list, go to{" "}
        <Link href="/profile" className="font-semibold text-navy-800 hover:underline">
          Edit profile
        </Link>
        .
      </p>
    </div>
  );
}
