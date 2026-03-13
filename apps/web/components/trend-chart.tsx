"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AnalyticsTrendPoint } from "@fieldlens/shared";

export function TrendChart({ data }: { data: AnalyticsTrendPoint[] }) {
  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="criticalFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#ef6a5b" stopOpacity={0.7} />
              <stop offset="100%" stopColor="#ef6a5b" stopOpacity={0.04} />
            </linearGradient>
            <linearGradient id="warningFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#f6b24b" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#f6b24b" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(245,235,216,0.08)" vertical={false} />
          <XAxis dataKey="date" stroke="#cdbfa5" />
          <YAxis stroke="#cdbfa5" />
          <Tooltip />
          <Area type="monotone" dataKey="criticalIssues" stroke="#ef6a5b" fill="url(#criticalFill)" strokeWidth={2} />
          <Area type="monotone" dataKey="warningIssues" stroke="#f6b24b" fill="url(#warningFill)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
