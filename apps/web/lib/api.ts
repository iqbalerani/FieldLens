import type {
  AnalyticsTrendPoint,
  CurrentUser,
  InspectionDetail,
  InspectionSummary,
  SearchResult,
} from "@fieldlens/shared";
import { getStoredToken } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getStoredToken()}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export function fetchCurrentUser() {
  return request<CurrentUser>("/auth/me");
}

export function fetchInspections(params?: { status?: string; limit?: number; offset?: number }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.limit !== undefined) qs.set("limit", String(params.limit));
  if (params?.offset !== undefined) qs.set("offset", String(params.offset));
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return request<InspectionSummary[]>(`/inspections${query}`);
}

export function fetchInspection(id: string) {
  return request<InspectionDetail>(`/inspections/${id}`);
}

export function fetchAnalytics() {
  return request<AnalyticsTrendPoint[]>("/analytics/trends");
}

export function searchInspections(query: string) {
  return request<SearchResult[]>("/search", {
    method: "POST",
    body: JSON.stringify({ query }),
  });
}

