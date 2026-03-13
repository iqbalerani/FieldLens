import type {
  CreateInspectionResponse,
  CurrentUser,
  InspectionDetail,
  InspectionStatus,
  InspectionSummary,
  RegisterInspectionMediaPayload,
} from "@fieldlens/shared";
import type { LocalPhoto } from "../store/appStore";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function apiRequest<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  getBaseUrl: () => API_BASE_URL,
  me: (token: string) => apiRequest<CurrentUser>("/auth/me", token),
  listInspections: (token: string) => apiRequest<InspectionSummary[]>("/inspections", token),
  getInspection: (token: string, id: string) => apiRequest<InspectionDetail>(`/inspections/${id}`, token),
  getStatus: (token: string, id: string) => apiRequest<{ inspectionId: string; status: InspectionStatus }>(`/inspections/${id}/status`, token),
  createInspection: (token: string, body: Record<string, unknown>) =>
    apiRequest<CreateInspectionResponse>("/inspections", token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  completeMedia: (token: string, id: string, body: RegisterInspectionMediaPayload) =>
    apiRequest<InspectionDetail>(`/inspections/${id}/media/complete`, token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  submitInspection: (token: string, id: string) =>
    apiRequest<{ inspectionId: string; status: InspectionStatus }>(`/inspections/${id}/submit`, token, {
      method: "POST",
    }),
  uploadPhoto: async (token: string, inspectionId: string, mediaId: string, photo: LocalPhoto) => {
    const form = new FormData();
    form.append("file", {
      uri: photo.uri,
      name: photo.fileName,
      type: photo.mimeType,
    } as never);
    const response = await fetch(`${API_BASE_URL}/inspections/${inspectionId}/media/${mediaId}/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }
    return response.json();
  },

  /**
   * Upload a recorded audio file URI to the backend for transcription.
   * Falls back gracefully: if the endpoint is unavailable, returns empty string.
   */
  transcribeAudio: async (audioUri: string): Promise<string> => {
    try {
      const form = new FormData();
      form.append("file", {
        uri: audioUri,
        name: "voice.m4a",
        type: "audio/mp4",
      } as never);
      const response = await fetch(`${API_BASE_URL}/voice/transcribe`, {
        method: "POST",
        body: form,
      });
      if (!response.ok) return "";
      const data = await response.json() as { transcript?: string };
      return data.transcript ?? "";
    } catch {
      return "";
    }
  },
};

