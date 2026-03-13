"use client";

import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "../../../../components/dashboard-shell";
import { StatusBadge } from "../../../../components/status-badge";
import { fetchInspection } from "../../../../lib/api";

export default function InspectionDetailPage({ params }: { params: { id: string } }) {
  const inspectionQuery = useQuery({
    queryKey: ["inspection", params.id],
    queryFn: () => fetchInspection(params.id),
  });

  const inspection = inspectionQuery.data;

  return (
    <DashboardShell
      heading={inspection?.siteName ?? "Inspection detail"}
      description="Full AI report, transcript, and evidence summary for a single field submission."
    >
      {inspection && (
        <div className="detail-grid">
          <section className="surface">
            <div className="inspection-header">
              <div>
                <div className="muted">
                  {inspection.inspectionType} · {inspection.inspectorName}
                </div>
                <h2 className="panel-title" style={{ marginTop: 8 }}>
                  {inspection.report?.summary ?? inspection.summary ?? "Awaiting generated report"}
                </h2>
              </div>
              <StatusBadge status={inspection.report?.overallStatus ?? inspection.status} />
            </div>

            <div className="mini-grid" style={{ marginTop: 18 }}>
              <div className="meta-item">
                <strong>Transcript</strong>
                <p className="muted">{inspection.voiceTranscript ?? "No voice transcript captured."}</p>
              </div>
              <div className="meta-item">
                <strong>Notes</strong>
                <p className="muted">{inspection.textNotes ?? "No additional notes."}</p>
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <h3 className="panel-title" style={{ fontSize: "1.2rem" }}>
                Issues
              </h3>
              <div className="issue-list" style={{ marginTop: 14 }}>
                {inspection.report?.issues.map((issue) => (
                  <div key={`${issue.title}-${issue.affectedArea}`} className="issue-item">
                    <div className="inspection-header">
                      <strong>{issue.title}</strong>
                      <StatusBadge status={issue.severity} />
                    </div>
                    <p className="muted">{issue.description}</p>
                    <div className="muted">Affected area: {issue.affectedArea}</div>
                    <div>Action: {issue.suggestedAction}</div>
                  </div>
                )) ?? <p className="muted">No issues extracted yet.</p>}
              </div>
            </div>
          </section>

          <aside className="stack">
            <div className="surface">
              <h3 className="panel-title" style={{ fontSize: "1.2rem" }}>
                Recommendations
              </h3>
              <div className="meta-list" style={{ marginTop: 14 }}>
                {inspection.report?.recommendations.map((recommendation) => (
                  <div key={recommendation} className="meta-item">
                    {recommendation}
                  </div>
                )) ?? <div className="meta-item">Awaiting output.</div>}
              </div>
            </div>
            <div className="surface">
              <h3 className="panel-title" style={{ fontSize: "1.2rem" }}>
                Evidence
              </h3>
              <div className="meta-list" style={{ marginTop: 14 }}>
                {inspection.media.map((item) => (
                  <div key={item.id} className="meta-item">
                    <strong>{item.type.toUpperCase()}</strong>
                    <div className="muted">{item.mimeType}</div>
                    <div className="muted">{item.s3Key}</div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}
    </DashboardShell>
  );
}

