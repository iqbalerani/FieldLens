import Link from "next/link";
import type { InspectionSummary } from "@fieldlens/shared";
import { StatusBadge } from "./status-badge";

export function InspectionCard({ inspection }: { inspection: InspectionSummary }) {
  return (
    <Link href={`/inspections/${inspection.id}`} className="inspection-card">
      <div className="inspection-header">
        <div>
          <p className="muted" style={{ margin: 0 }}>
            {inspection.inspectionType} · {new Date(inspection.createdAt).toLocaleString()}
          </p>
          <h3 className="inspection-title">{inspection.siteName}</h3>
        </div>
        <StatusBadge status={inspection.overallStatus ?? inspection.status} />
      </div>
      <p className="muted">{inspection.summary ?? "Awaiting AI report. Media and transcript are staged for processing."}</p>
      <div className="row-between">
        <span>{inspection.inspectorName}</span>
        <span className="muted">
          {inspection.issueCount} issues · {inspection.criticalCount} critical
        </span>
      </div>
    </Link>
  );
}

