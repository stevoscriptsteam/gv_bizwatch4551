"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminAuditEntry } from "@/lib/admin";
import type { AdminComment, AdminReport } from "@/lib/admin-operations";
import type { Business } from "@/lib/types";
import { formatReporterLabel, getReferralSourceLabel } from "@/lib/types";
import { formatPhoneDisplay } from "@/lib/phone";
import { PageHeader } from "@/components/ui/PageHeader";

type AdminTab = "reports" | "comments" | "requests" | "businesses" | "audit";

type AdminClientProps = {
  isMaster: boolean;
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function AdminClient({ isMaster }: AdminClientProps) {
  const [tab, setTab] = useState<AdminTab>("reports");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [reports, setReports] = useState<AdminReport[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [auditLog, setAuditLog] = useState<AdminAuditEntry[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  const [newBusiness, setNewBusiness] = useState({
    businessName: "",
    phone: "",
    email: "",
    suburb: "",
    message: "",
  });
  const [addingBusiness, setAddingBusiness] = useState(false);
  const [actingBusinessId, setActingBusinessId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    const param = showArchived ? "archived=1" : "archived=0";
    const res = await fetch(`/api/admin/reports?${param}`);
    if (res.ok) {
      const data = (await res.json()) as { reports: AdminReport[] };
      setReports(data.reports);
    } else {
      setError("Could not load reports.");
    }
    setLoading(false);
  }, [showArchived]);

  const loadComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/comments");
    if (res.ok) {
      const data = (await res.json()) as { comments: AdminComment[] };
      setComments(data.comments);
    } else {
      setError("Could not load comments.");
    }
    setLoading(false);
  }, []);

  const loadBusinesses = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) {
      setLoading(true);
      setError(null);
    }
    const res = await fetch("/api/admin/businesses");
    if (res.ok) {
      const data = (await res.json()) as { businesses: Business[] };
      setBusinesses(data.businesses);
      setPendingCount(data.businesses.filter((b) => b.active !== 1).length);
    } else if (!opts?.quiet) {
      setError("Could not load businesses.");
    }
    if (!opts?.quiet) setLoading(false);
  }, []);

  const loadAuditLog = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/audit-log");
    if (res.ok) {
      const data = (await res.json()) as { entries: AdminAuditEntry[] };
      setAuditLog(data.entries);
    } else {
      setError("Could not load audit log.");
    }
    setLoading(false);
  }, []);

  // Keep the Requests badge count fresh even when that tab is not open.
  useEffect(() => {
    void loadBusinesses({ quiet: true });
  }, [loadBusinesses]);

  useEffect(() => {
    if (tab === "reports") void loadReports();
    if (tab === "comments") void loadComments();
    if (tab === "requests" || tab === "businesses") void loadBusinesses();
    if (tab === "audit") void loadAuditLog();
  }, [tab, loadReports, loadComments, loadBusinesses, loadAuditLog]);

  async function toggleArchive(report: AdminReport) {
    const archived = !report.archived_at;
    const label = archived ? "archive" : "restore";
    const confirmMessage = archived
      ? `Archive "${report.title}"?`
      : report.archive_reason === "community_flags"
        ? `Restore "${report.title}" to the public feed? It was auto-archived after community flags.`
        : `Restore "${report.title}"?`;
    if (!window.confirm(confirmMessage)) return;

    const res = await fetch(`/api/admin/reports/${report.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived }),
    });

    if (res.ok) {
      await loadReports();
    } else {
      setError(`Could not ${label} report.`);
    }
  }

  async function removeComment(comment: AdminComment) {
    if (!window.confirm("Remove this comment from public view?")) return;

    const res = await fetch(
      `/api/admin/comments/${comment.id}?type=${comment.type}`,
      { method: "DELETE" },
    );

    if (res.ok) {
      await loadComments();
    } else {
      setError("Could not remove comment.");
    }
  }

  async function acceptRequest(business: Business) {
    if (
      !window.confirm(
        `Accept registration for ${business.business_name}? They will receive an SMS and can then sign in.`,
      )
    ) {
      return;
    }

    setActingBusinessId(business.id);
    setError(null);
    setNotice(null);

    const res = await fetch("/api/admin/businesses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: business.id, active: true }),
    });

    const data = (await res.json()) as { error?: string; smsSent?: boolean };
    setActingBusinessId(null);

    if (res.ok) {
      await loadBusinesses({ quiet: true });
      setNotice(
        data.smsSent
          ? `${business.business_name} accepted and notified by SMS.`
          : `${business.business_name} accepted, but the SMS could not be sent.`,
      );
    } else {
      setError(data.error ?? "Could not accept registration.");
    }
  }

  async function toggleBusinessActive(business: Business) {
    const active = business.active !== 1;
    const label = active ? "activate" : "deactivate";
    if (
      !window.confirm(
        `${active ? "Activate" : "Deactivate"} ${business.business_name}?`,
      )
    ) {
      return;
    }

    setActingBusinessId(business.id);
    const res = await fetch("/api/admin/businesses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: business.id, active }),
    });
    setActingBusinessId(null);

    if (res.ok) {
      await loadBusinesses({ quiet: tab !== "businesses" && tab !== "requests" });
    } else {
      setError(`Could not ${label} business.`);
    }
  }

  async function toggleBusinessAdmin(business: Business) {
    const isAdmin = business.is_admin !== 1;
    if (!window.confirm(`${isAdmin ? "Grant admin access to" : "Remove admin access from"} ${business.business_name}?`)) {
      return;
    }

    const res = await fetch(`/api/admin/businesses/${business.id}/admin`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAdmin }),
    });

    if (res.ok) {
      await loadBusinesses();
    } else {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Could not update admin access.");
    }
  }

  async function handleAddBusiness(event: React.FormEvent) {
    event.preventDefault();
    setAddingBusiness(true);
    setError(null);
    setNotice(null);

    const res = await fetch("/api/admin/businesses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newBusiness),
    });

    const data = (await res.json()) as {
      error?: string;
      smsSent?: boolean;
      smsError?: string;
    };

    if (res.ok) {
      setNewBusiness({
        businessName: "",
        phone: "",
        email: "",
        suburb: "",
        message: "",
      });
      await loadBusinesses();
      setNotice(
        data.smsSent
          ? "Business added and registration SMS sent."
          : `Business added, but SMS was not sent${data.smsError ? `: ${data.smsError}` : "."}`,
      );
    } else {
      setError(data.error ?? "Could not add business.");
    }

    setAddingBusiness(false);
  }

  const pendingRequests = businesses.filter((business) => business.active !== 1);
  const activeBusinesses = businesses.filter((business) => business.active === 1);

  const tabs: { id: AdminTab; label: string; badge?: number }[] = [
    { id: "reports", label: "Reports" },
    { id: "comments", label: "Comments" },
    { id: "requests", label: "Requests", badge: pendingCount },
    { id: "businesses", label: "Businesses" },
    { id: "audit", label: "Audit log" },
  ];

  return (
    <div className="container-content">
      <PageHeader
        title="Admin"
        description="Manage reports, moderate comments, review registration requests, and administer business accounts."
      />

      <div className="admin-tabs" role="tablist" aria-label="Admin sections">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={`admin-tab${tab === item.id ? " admin-tab--active" : ""}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
            {item.badge && item.badge > 0 ? (
              <span className="admin-tab-badge" aria-label={`${item.badge} pending`}>
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {error ? <p className="admin-error">{error}</p> : null}
      {notice ? <p className="admin-notice">{notice}</p> : null}

      {loading ? <p className="supporting-text mt-6">Loading…</p> : null}

      {tab === "reports" && !loading ? (
        <section className="admin-panel mt-6" aria-label="Reports">
          <div className="admin-panel-toolbar">
            <label className="admin-checkbox">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
              />
              Show archived only
            </label>
          </div>

          {reports.length === 0 ? (
            <p className="supporting-text">No reports in this view.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Reported by</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id}>
                      <td>{report.title}</td>
                      <td>{formatReporterLabel(report)}</td>
                      <td>{formatDate(report.created_at)}</td>
                      <td>
                        {report.archived_at ? (
                          report.archive_reason === "community_flags" ? (
                            <span className="admin-badge admin-badge--flagged">
                              Flagged ({report.flag_count ?? 0})
                            </span>
                          ) : (
                            <span className="admin-badge admin-badge--muted">Archived</span>
                          )
                        ) : (report.flag_count ?? 0) > 0 ? (
                          <span className="admin-badge admin-badge--flagged">
                            Live · {report.flag_count} flag{(report.flag_count ?? 0) === 1 ? "" : "s"}
                          </span>
                        ) : (
                          <span className="admin-badge admin-badge--active">Live</span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => void toggleArchive(report)}
                        >
                          {report.archived_at ? "Restore" : "Archive"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {tab === "comments" && !loading ? (
        <section className="admin-panel mt-6" aria-label="Comments">
          {comments.length === 0 ? (
            <p className="supporting-text">No comments to moderate.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Author</th>
                    <th>On</th>
                    <th>Comment</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {comments.map((comment) => (
                    <tr key={`${comment.type}-${comment.id}`}>
                      <td>{comment.type === "report" ? "Report" : "Article"}</td>
                      <td>{comment.business_name}</td>
                      <td>{comment.parent_title}</td>
                      <td className="admin-table-excerpt">{comment.body}</td>
                      <td>{formatDate(comment.created_at)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm admin-btn-danger"
                          onClick={() => void removeComment(comment)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {tab === "requests" && !loading ? (
        <section className="admin-panel mt-6" aria-label="Registration requests">
          {pendingRequests.length === 0 ? (
            <p className="supporting-text">No registration requests waiting for review.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Business</th>
                    <th>Contact</th>
                    <th>Suburb</th>
                    <th>How they found us</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRequests.map((business) => (
                    <tr key={business.id}>
                      <td>{business.business_name}</td>
                      <td>
                        <div>{formatPhoneDisplay(business.phone)}</div>
                        <div className="admin-table-excerpt">{business.email}</div>
                      </td>
                      <td>{business.suburb || "—"}</td>
                      <td>
                        {getReferralSourceLabel(
                          business.referral_source,
                          business.referral_other,
                        )}
                      </td>
                      <td>{formatDate(business.created_at)}</td>
                      <td className="admin-actions-cell">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={actingBusinessId === business.id}
                          onClick={() => void acceptRequest(business)}
                        >
                          {actingBusinessId === business.id ? "Accepting…" : "Accept"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {tab === "businesses" && !loading ? (
        <section className="admin-panel mt-6" aria-label="Businesses">
          <form className="admin-form" onSubmit={handleAddBusiness}>
            <h3 className="admin-form-title">Add business</h3>
            <div className="admin-form-grid">
              <label>
                Business name
                <input
                  type="text"
                  required
                  value={newBusiness.businessName}
                  onChange={(e) =>
                    setNewBusiness((prev) => ({
                      ...prev,
                      businessName: e.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Mobile
                <input
                  type="tel"
                  required
                  value={newBusiness.phone}
                  onChange={(e) =>
                    setNewBusiness((prev) => ({ ...prev, phone: e.target.value }))
                  }
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  required
                  value={newBusiness.email}
                  onChange={(e) =>
                    setNewBusiness((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </label>
              <label>
                Suburb
                <input
                  type="text"
                  value={newBusiness.suburb}
                  onChange={(e) =>
                    setNewBusiness((prev) => ({ ...prev, suburb: e.target.value }))
                  }
                />
              </label>
            </div>
            <label className="admin-form-message">
              SMS reference message
              <textarea
                required
                maxLength={300}
                rows={3}
                value={newBusiness.message}
                onChange={(e) =>
                  setNewBusiness((prev) => ({ ...prev, message: e.target.value }))
                }
                placeholder="e.g. Welcome to BizWatch — you can now sign in with this mobile number."
              />
              <span className="admin-form-hint">
                Sent by SMS with the registration notice. Shown as “Reference: …”
              </span>
            </label>
            <button
              type="submit"
              className="btn btn-secondary btn-sm"
              disabled={addingBusiness}
            >
              {addingBusiness ? "Adding…" : "Add business"}
            </button>
          </form>

          <div className="admin-table-wrap mt-6">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Phone</th>
                  <th>How they found us</th>
                  <th>Status</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeBusinesses.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <p className="supporting-text">No active businesses yet.</p>
                    </td>
                  </tr>
                ) : (
                  activeBusinesses.map((business) => (
                    <tr key={business.id}>
                      <td>{business.business_name}</td>
                      <td>{formatPhoneDisplay(business.phone)}</td>
                      <td>
                        {getReferralSourceLabel(
                          business.referral_source,
                          business.referral_other,
                        )}
                      </td>
                      <td>
                        <span className="admin-badge admin-badge--active">Active</span>
                      </td>
                      <td>
                        {business.is_admin === 1 ? (
                          <span className="admin-badge admin-badge--admin">Admin</span>
                        ) : (
                          <span className="admin-badge admin-badge--muted">Member</span>
                        )}
                      </td>
                      <td className="admin-actions-cell">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          disabled={actingBusinessId === business.id}
                          onClick={() => void toggleBusinessActive(business)}
                        >
                          Deactivate
                        </button>
                        {isMaster ? (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => void toggleBusinessAdmin(business)}
                          >
                            {business.is_admin === 1 ? "Remove admin" : "Make admin"}
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {tab === "audit" && !loading ? (
        <section className="admin-panel mt-6" aria-label="Audit log">
          {auditLog.length === 0 ? (
            <p className="supporting-text">No admin actions logged yet.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Admin</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLog.map((entry) => (
                    <tr key={entry.id}>
                      <td>{formatDate(entry.created_at)}</td>
                      <td>{entry.admin_business_name ?? entry.admin_business_id}</td>
                      <td>{entry.action.replace(/_/g, " ")}</td>
                      <td>
                        {entry.entity_type} · {entry.entity_id.slice(0, 8)}…
                      </td>
                      <td className="admin-table-excerpt">
                        {entry.details ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
