"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { DashboardShell } from "../../../components/dashboard-shell";
import { InspectionCard } from "../../../components/inspection-card";
import { searchInspections } from "../../../lib/api";

export default function SearchPage() {
  const [query, setQuery] = useState("wall cracks");
  const searchMutation = useMutation({ mutationFn: searchInspections });

  return (
    <DashboardShell
      heading="Search by intent, not filenames."
      description="Semantic search uses stored embeddings to retrieve prior inspections from natural language prompts."
    >
      <section className="surface" style={{ marginTop: 18 }}>
        <div className="row-between">
          <div>
            <h2 className="panel-title">Semantic search</h2>
            <p className="panel-copy">Try phrases like “missing safety signage” or “warehouse damage near loading dock”.</p>
          </div>
        </div>
        <div className="stack" style={{ marginTop: 18 }}>
          <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} />
          <button className="button button-primary" onClick={() => searchMutation.mutate(query)}>
            Search inspection memory
          </button>
        </div>
      </section>

      <section className="surface" style={{ marginTop: 18 }}>
        <h2 className="panel-title">Results</h2>
        <div className="stack" style={{ marginTop: 18 }}>
          {(searchMutation.data ?? []).map((result) => (
            <div key={result.inspection.id}>
              <InspectionCard inspection={result.inspection} />
              <div className="muted" style={{ marginTop: 8 }}>
                Similarity score: {(result.similarityScore * 100).toFixed(1)}%
              </div>
            </div>
          ))}
          {!searchMutation.data?.length && <p className="muted">Run a search to see ranked inspections here.</p>}
        </div>
      </section>
    </DashboardShell>
  );
}

