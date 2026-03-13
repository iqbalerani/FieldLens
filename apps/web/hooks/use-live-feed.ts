"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getApiBaseUrl } from "../lib/api";
import { getStoredToken } from "../lib/auth";

export function useLiveFeed(orgId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!orgId) {
      return;
    }
    const url = new URL(`/stream/inspections/${orgId}`, getApiBaseUrl());
    url.searchParams.set("token", getStoredToken());
    const source = new EventSource(url.toString());
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: ["inspections"] });
      void queryClient.invalidateQueries({ queryKey: ["analytics"] });
    };
    source.addEventListener("inspection_submitted", refresh);
    source.addEventListener("processing_started", refresh);
    source.addEventListener("report_ready", refresh);
    return () => source.close();
  }, [orgId, queryClient]);
}
