"use client";

import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "../../../components/dashboard-shell";
import { TrendChart } from "../../../components/trend-chart";
import { fetchAnalytics } from "../../../lib/api";

export default function AnalyticsPage() {
  const analyticsQuery = useQuery({ queryKey: ["analytics"], queryFn: () => fetchAnalytics() });
  const analytics = analyticsQuery.data ?? [];

  let content = <TrendChart data={analytics} />;

  if (analyticsQuery.isPending) {
    content = <p className="muted">Loading trend data for the active workspace...</p>;
  } else if (analyticsQuery.isError) {
    const message = analyticsQuery.error instanceof Error ? analyticsQuery.error.message : "Trend data is unavailable right now.";
    content = <p className="muted" style={{ color: "#ff9d7a" }}>Unable to load analytics. {message}</p>;
  } else if (!analytics.length) {
    content = <p className="muted">No inspections have landed yet for this workspace, so there is no trendline to draw.</p>;
  }

  return (
    <DashboardShell
      heading="Patterns across the field, not just one report."
      description="Trend analytics help supervisors understand issue frequency and urgency over time."
    >
      <section className="surface" style={{ marginTop: 18 }}>
        <h2 className="panel-title">Issue trendline</h2>
        <p className="panel-copy">Daily inspection volume with issue severity breakdown for the active workspace.</p>
        <div style={{ marginTop: 18 }}>
          {content}
        </div>
      </section>
    </DashboardShell>
  );
}
