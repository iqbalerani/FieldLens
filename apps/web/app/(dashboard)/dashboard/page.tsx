"use client";

import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "../../../components/dashboard-shell";
import { InspectionCard } from "../../../components/inspection-card";
import { fetchAnalytics, fetchCurrentUser, fetchInspections } from "../../../lib/api";

export default function DashboardPage() {
  const userQuery = useQuery({ queryKey: ["current-user"], queryFn: () => fetchCurrentUser() });
  const inspectionsQuery = useQuery({ queryKey: ["inspections"], queryFn: () => fetchInspections() });
  const analyticsQuery = useQuery({ queryKey: ["analytics"], queryFn: () => fetchAnalytics() });

  const inspections = inspectionsQuery.data ?? [];
  const analytics = analyticsQuery.data ?? [];
  const totalInspections = inspections.length;
  const critical = inspections.reduce((count, item) => count + item.criticalCount, 0);
  const openReports = inspections.filter((item) => item.status !== "complete").length;
  const latestTrend = analytics.at(-1);

  return (
    <DashboardShell
      heading="Field reports, surfaced in real time."
      description="A warm, live operations view for supervisors tracking submissions, AI-generated findings, and what needs attention next."
    >
      <div className="metrics-grid" style={{ marginTop: 18 }}>
        <div className="surface metric-card">
          <div className="metric-label">Inspections logged</div>
          <div className="metric-value">{totalInspections}</div>
          <div className="metric-note">Across the active org workspace</div>
        </div>
        <div className="surface metric-card">
          <div className="metric-label">Critical issues</div>
          <div className="metric-value">{critical}</div>
          <div className="metric-note">Escalate these first</div>
        </div>
        <div className="surface metric-card">
          <div className="metric-label">Still processing</div>
          <div className="metric-value">{openReports}</div>
          <div className="metric-note">Live submissions in flight</div>
        </div>
        <div className="surface metric-card">
          <div className="metric-label">Latest trend</div>
          <div className="metric-value">{latestTrend?.totalInspections ?? 0}</div>
          <div className="metric-note">Inspections on most recent day</div>
        </div>
      </div>

      <div className="content-grid">
        <section className="surface">
          <div className="row-between">
            <div>
              <h2 className="panel-title">Live inspection feed</h2>
              <p className="panel-copy">Newest field activity and generated reports.</p>
            </div>
          </div>
          <div className="stack" style={{ marginTop: 18 }}>
            {inspections.map((inspection) => (
              <InspectionCard key={inspection.id} inspection={inspection} />
            ))}
            {!inspections.length && <p className="muted">No inspections have been created yet.</p>}
          </div>
        </section>

        <aside className="stack">
          <div className="surface">
            <h2 className="panel-title">Supervisor note</h2>
            <p className="panel-copy">
              Dashboard views listen for `inspection_submitted`, `processing_started`, and `report_ready` so the feed and analytics refresh without a page reload.
            </p>
          </div>
          <div className="surface">
            <h2 className="panel-title">Current operator</h2>
            <div className="meta-list" style={{ marginTop: 14 }}>
              <div className="meta-item">
                <strong>{userQuery.data?.name ?? "Loading..."}</strong>
                <div className="muted">{userQuery.data?.email ?? "demo"}</div>
              </div>
              <div className="meta-item">
                <strong>Role</strong>
                <div className="muted">{userQuery.data?.role ?? "SUPERVISOR"}</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}
