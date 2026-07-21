"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminAuditEntry } from "@/lib/admin";
import type { AdminComment, AdminReport } from "@/lib/admin-operations";
import type { Business } from "@/lib/types";
import { formatPhoneDisplay } from "@/lib/phone";
import { PageHeader } from "@/components/ui/PageHeader";

type AdminTab = "reports" | "comments" | "businesses" | "audit";

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

  const [newBusiness, setNewBusiness] = useState({
    businessName: "",
    phone: "",
    email: "",
    suburb: "",
  });
  const [addingBusiness, setAddingBusiness] = useState(false);

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

  const loadBusinesses = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/businesses");
    if (res.ok) {
      const data = (await res.json()) as { businesses: Business[] };
      setBusinesses(data.businesses);
    } else {
      setError("Could not load businesses.");
    }
    setLoading(false);
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

  useEffect(() => {
    if (tab === "reports") void loadReports();
    if (tab === "comments") void loadComments();
    if (tab === "businesses") void loadBusinesses();
    if (tab === "audit") void loadAuditLog();
  }, [tab, loadReports, loadComments, loadBusinesses, loadAuditLog]);

  async function toggleArchive(report: AdminReport) {
    const archived = !report.archived_at;
    const label = archived ? "archive" : "restore";
    if (!window.confirm(`${archived ? "Archive" : "Restore"} "${report.title}"?`)) return;

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

    const res = await fetch("/api/admin/businesses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: business.id, active }),
    });

    if (res.ok) {
      await loadBusinesses();
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

    const res = await fetch("/api/admin/businesses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newBusiness),
    });

    if (res.ok) {
      setNewBusiness({ businessName: "", phone: "", email: "", suburb: "" });
      await loadBusinesses();
    } else {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Could not add business.");
    }

    setAddingBusiness(false);
  }

  const tabs: { id: AdminTab; label: string }[] = [
    { id: "reports", label: "Reports" },
    { id: "comments", label: "Comments" },
    { id: "businesses", label: "Businesses" },
    { id: "audit", label: "Audit log" },
  ];

  return (
    <div className="container-content">
      <PageHeader
        title="Admin"
        description="Manage reports, moderate comments, and administer business accounts."
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
          </button>
        ))}
      </div>

      {error ? <p className="admin-error">{error}</p> : null}

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
                    <th>Business</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id}>
                      <td>{report.title}</td>
                      <td>{report.business_name}</td>
                      <td>{formatDate(report.created_at)}</td>
                      <td>
                        {report.archived_at ? (
                          <span className="admin-badge admin-badge--muted">Archived</span>
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
                  <th>Status</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((business) => (
                  <tr key={business.id}>
                    <td>{business.business_name}</td>
                    <td>{formatPhoneDisplay(business.phone)}</td>
                    <td>
                      {business.active === 1 ? (
                        <span className="admin-badge admin-badge--active">Active</span>
                      ) : (
                        <span className="admin-badge admin-badge--muted">Inactive</span>
                      )}
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
                        onClick={() => void toggleBusinessActive(business)}
                      >
                        {business.active === 1 ? "Deactivate" : "Activate"}
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
                ))}
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
