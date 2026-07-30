"use client";

import { useEffect } from "react";
import { CHANGELOG } from "@/lib/changelog";
import { markUpdatesSeen } from "@/components/UpdatesMenuLink";
import { PageHeader } from "@/components/ui/PageHeader";

export function UpdatesClient() {
  useEffect(() => {
    markUpdatesSeen();
  }, []);

  return (
    <div className="container-content">
      <div className="container-reading">
        <PageHeader
          title="What's new"
          description="Release notes for BizWatch 4551. Check here after updates to see what changed."
        />

        {CHANGELOG.length === 0 ? (
          <p className="supporting-text mt-6">No update notes published yet.</p>
        ) : (
          <ol className="updates-list">
            {CHANGELOG.map((entry) => (
              <li key={entry.id} className="updates-entry">
                <p className="updates-entry-date">{entry.date}</p>
                <h2 className="updates-entry-title">{entry.title}</h2>
                <p className="updates-entry-summary">{entry.summary}</p>
                <ul className="updates-entry-changes">
                  {entry.changes.map((change) => (
                    <li key={change}>{change}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
