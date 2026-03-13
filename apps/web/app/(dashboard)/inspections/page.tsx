"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { DashboardShell } from "../../../components/dashboard-shell";
import { InspectionCard } from "../../../components/inspection-card";
import { fetchInspections } from "../../../lib/api";

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "complete", label: "Complete" },
  { value: "processing", label: "Processing" },
  { value: "submitted", label: "Submitted" },
  { value: "draft", label: "Draft" },
  { value: "failed", label: "Failed" },
];

export default function InspectionsPage() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);

  const offset = page * PAGE_SIZE;

  const inspectionsQuery = useQuery({
    queryKey: ["inspections", status, page],
    queryFn: () => fetchInspections({ status: status || undefined, limit: PAGE_SIZE, offset }),
  });

  const inspections = inspectionsQuery.data ?? [];
  const hasMore = inspections.length === PAGE_SIZE;

  function handleStatusChange(next: string) {
    setStatus(next);
    setPage(0);
  }

  return (
    <DashboardShell
      heading="Every visit, every finding, one ledger."
      description="A chronological archive of inspections with summaries, statuses, and ready access to the full AI report."
    >
      <section className="surface" style={{ marginTop: 18 }}>
        {/* Status filter pills */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
          <span style={{ fontWeight: 600, fontSize: 13, opacity: 0.7 }}>Filter:</span>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleStatusChange(opt.value)}
              style={{
                padding: "5px 14px",
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.15)",
                background: status === opt.value ? "#f08700" : "transparent",
                color: status === opt.value ? "#1a1208" : "inherit",
                fontWeight: 600,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <h2 className="panel-title">Inspections</h2>
        <p className="panel-copy">
          {status ? `Showing "${status}" inspections.` : "Sorted newest-first for operational triage."}
          {inspectionsQuery.isFetching ? "  Loading…" : ""}
        </p>

        <div className="stack" style={{ marginTop: 18 }}>
          {inspections.length === 0 && !inspectionsQuery.isFetching && (
            <p style={{ opacity: 0.5 }}>No inspections found.</p>
          )}
          {inspections.map((inspection) => (
            <InspectionCard key={inspection.id} inspection={inspection} />
          ))}
        </div>

        {/* Pagination */}
        <div style={{ display: "flex", gap: 12, marginTop: 24, alignItems: "center" }}>
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "transparent",
              cursor: page === 0 ? "not-allowed" : "pointer",
              opacity: page === 0 ? 0.4 : 1,
            }}
          >
            ← Prev
          </button>
          <span style={{ fontSize: 13, opacity: 0.6 }}>Page {page + 1}</span>
          <button
            disabled={!hasMore}
            onClick={() => setPage((p) => p + 1)}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "transparent",
              cursor: !hasMore ? "not-allowed" : "pointer",
              opacity: !hasMore ? 0.4 : 1,
            }}
          >
            Next →
          </button>
        </div>
      </section>
    </DashboardShell>
  );
}
