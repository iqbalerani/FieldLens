"use client";

import { Area, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AnalyticsTrendPoint } from "@fieldlens/shared";

const SERIES = {
  totalInspections: { label: "Inspections", color: "#f7f0df" },
  criticalIssues: { label: "Critical issues", color: "#ef6a5b" },
  warningIssues: { label: "Warning issues", color: "#f6b24b" },
  infoIssues: { label: "Info issues", color: "#7dcf9b" },
} as const;

function formatDate(value: string) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function TrendChart({ data }: { data: AnalyticsTrendPoint[] }) {
  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="infoFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#7dcf9b" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#7dcf9b" stopOpacity={0.03} />
            </linearGradient>
            <linearGradient id="warningFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#f6b24b" stopOpacity={0.32} />
              <stop offset="100%" stopColor="#f6b24b" stopOpacity={0.04} />
            </linearGradient>
            <linearGradient id="criticalFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#ef6a5b" stopOpacity={0.32} />
              <stop offset="100%" stopColor="#ef6a5b" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(245,235,216,0.08)" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#cdbfa5"
            tickFormatter={formatDate}
            tickLine={false}
          />
          <YAxis allowDecimals={false} stroke="#cdbfa5" tickLine={false} />
          <Tooltip
            labelFormatter={(value) => formatDate(String(value))}
            formatter={(value, name) => {
              const series = SERIES[name as keyof typeof SERIES];
              return [value, series?.label ?? name];
            }}
            contentStyle={{
              background: "rgba(20, 17, 15, 0.96)",
              border: "1px solid rgba(245, 235, 216, 0.18)",
              borderRadius: 16,
              color: "#f7f0df",
            }}
            itemStyle={{ color: "#f7f0df" }}
            labelStyle={{ color: "#ffcf88" }}
          />
          <Legend
            formatter={(value) => SERIES[value as keyof typeof SERIES]?.label ?? value}
            iconType="circle"
            wrapperStyle={{ color: "#cdbfa5", paddingTop: 8 }}
          />
          <Area
            type="monotone"
            dataKey="infoIssues"
            name="infoIssues"
            stroke={SERIES.infoIssues.color}
            fill="url(#infoFill)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="warningIssues"
            name="warningIssues"
            stroke={SERIES.warningIssues.color}
            fill="url(#warningFill)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="criticalIssues"
            name="criticalIssues"
            stroke={SERIES.criticalIssues.color}
            fill="url(#criticalFill)"
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="totalInspections"
            name="totalInspections"
            stroke={SERIES.totalInspections.color}
            strokeWidth={3}
            dot={{ r: 3, fill: SERIES.totalInspections.color, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
