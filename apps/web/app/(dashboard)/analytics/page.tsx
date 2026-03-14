"use client";

import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "../../../components/dashboard-shell";
import { TrendChart } from "../../../components/trend-chart";
import { fetchAnalytics } from "../../../lib/api";

export default function AnalyticsPage() {
  const analyticsQuery = useQuery({ queryKey: ["analytics"], queryFn: () => fetchAnalytics() });

  return (
    <DashboardShell
      heading="Patterns across the field, not just one report."
      description="Trend analytics help supervisors understand issue frequency and urgency over time."
    >
      <section className="surface" style={{ marginTop: 18 }}>
        <h2 className="panel-title">Issue trendline</h2>
        <p className="panel-copy">Critical and warning counts per day for the active workspace.</p>
        <div style={{ marginTop: 18 }}>
          <TrendChart data={analyticsQuery.data ?? []} />
        </div>
      </section>
    </DashboardShell>
  );
}
