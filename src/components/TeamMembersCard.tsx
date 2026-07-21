"use client";

import { useState } from "react";
import { FaIcon } from "@/components/FaIcon";
import { faUser } from "@/lib/icons";

type TeamMember = {
  id: string;
  name: string;
  phone: string;
  is_admin: number;
};

export function TeamMembersCard({
  businessName,
  initialMembers,
  maxMembers,
  canGrantAdmin = false,
}: {
  businessName: string;
  initialMembers: TeamMember[];
  maxMembers: number;
  canGrantAdmin?: boolean;
}) {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  // Default off — admin must be granted deliberately per person.
  const [isAdmin, setIsAdmin] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (adding) return;
    setAdding(true);
    setError("");
    setNotice("");

    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        phone,
        isAdmin: canGrantAdmin ? isAdmin : false,
      }),
    });

    const data = (await res.json()) as { error?: string; member?: TeamMember };
    setAdding(false);

    if (!res.ok || !data.member) {
      setError(data.error ?? "Could not add team member.");
      return;
    }

    setMembers((prev) =>
      [...prev, data.member as TeamMember].sort((a, b) =>
        a.name.localeCompare(b.name, "en-AU", { sensitivity: "base" }),
      ),
    );
    setName("");
    setPhone("");
    setIsAdmin(false);
    setNotice(
      `${data.member.name} added. They can now sign in with their own mobile number.`,
    );
  }

  async function handleToggleAdmin(member: TeamMember) {
    if (togglingId || !canGrantAdmin) return;
    const next = member.is_admin !== 1;
    setTogglingId(member.id);
    setError("");
    setNotice("");

    const res = await fetch(`/api/team/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAdmin: next }),
    });

    const data = (await res.json()) as { error?: string; member?: TeamMember };
    setTogglingId(null);

    if (!res.ok || !data.member) {
      setError(data.error ?? "Could not update admin access.");
      return;
    }

    setMembers((prev) =>
      prev.map((m) => (m.id === member.id ? { ...m, is_admin: data.member!.is_admin } : m)),
    );
    setNotice(
      next
        ? `${member.name} can now access the admin panel.`
        : `Admin access removed from ${member.name}.`,
    );
  }

  async function handleRemove(member: TeamMember) {
    if (removingId) return;
    if (
      !window.confirm(
        `Remove ${member.name} from ${businessName}? They will be signed out and can no longer sign in.`,
      )
    ) {
      return;
    }

    setRemovingId(member.id);
    setError("");
    setNotice("");

    const res = await fetch(`/api/team/${member.id}`, { method: "DELETE" });
    setRemovingId(null);

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Could not remove team member.");
      return;
    }

    setMembers((prev) => prev.filter((m) => m.id !== member.id));
    setNotice(`${member.name} removed.`);
  }

  return (
    <section className="card card-shadow space-y-4" aria-labelledby="team-members-heading">
      <div>
        <h2 id="team-members-heading" className="team-card-title">
          Team members
        </h2>
        <p className="form-hint">
          Add staff so they can sign in with their own mobile number. They can
          report and comment on behalf of {businessName}, shown as{" "}
          <strong>Name ({businessName})</strong>.
          {canGrantAdmin
            ? " You can also give individual team members admin access."
            : null}
        </p>
      </div>

      {members.length > 0 ? (
        <ul className="team-member-list">
          {members.map((member) => (
            <li key={member.id} className="team-member-row">
              <span className="team-member-avatar" aria-hidden="true">
                <FaIcon icon={faUser} />
              </span>
              <span className="team-member-info">
                <span className="team-member-name">
                  {member.name}{" "}
                  <span className="team-member-business">({businessName})</span>
                  {canGrantAdmin && member.is_admin === 1 ? (
                    <span className="team-member-admin-badge">Admin</span>
                  ) : null}
                </span>
                <span className="team-member-phone">{member.phone}</span>
              </span>
              <span className="team-member-actions">
                {canGrantAdmin ? (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => void handleToggleAdmin(member)}
                    disabled={togglingId === member.id}
                  >
                    {togglingId === member.id
                      ? "Updating…"
                      : member.is_admin === 1
                        ? "Remove admin"
                        : "Make admin"}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm team-member-remove"
                  onClick={() => void handleRemove(member)}
                  disabled={removingId === member.id}
                >
                  {removingId === member.id ? "Removing…" : "Remove"}
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="form-hint">No team members yet.</p>
      )}

      {members.length < maxMembers ? (
        <form onSubmit={(e) => void handleAdd(e)} className="team-add-form">
          <div className="team-add-fields">
            <div>
              <label htmlFor="team-member-name" className="form-label">
                Name
              </label>
              <input
                id="team-member-name"
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John"
                autoComplete="name"
                maxLength={100}
                required
              />
            </div>
            <div>
              <label htmlFor="team-member-phone" className="form-label">
                Mobile number
              </label>
              <input
                id="team-member-phone"
                className="input-field"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="04xx xxx xxx"
                required
              />
            </div>
          </div>
          {canGrantAdmin ? (
            <label className="profile-checkbox-label">
              <input
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
              />
              <span>Give this person admin access</span>
            </label>
          ) : null}
          <button type="submit" className="btn btn-secondary" disabled={adding}>
            {adding ? "Adding…" : "Add team member"}
          </button>
        </form>
      ) : (
        <p className="form-hint">
          You have reached the limit of {maxMembers} team members.
        </p>
      )}

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}

      {notice ? (
        <p className="form-hint" role="status">
          {notice}
        </p>
      ) : null}
    </section>
  );
}
