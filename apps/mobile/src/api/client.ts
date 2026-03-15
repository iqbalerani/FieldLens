import * as FileSystem from "expo-file-system/legacy";
import type {
  CreateInspectionResponse,
  CurrentUser,
  InspectionDetail,
  InspectionStatus,
  InspectionSummary,
  LoginPayload,
  LoginResponse,
  RegisterInspectionMediaPayload,
} from "@fieldlens/shared";
import type { LocalPhoto } from "../store/appStore";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function apiRequest<T>(path: string, token?: string | null, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `API request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  getBaseUrl: () => API_BASE_URL,
  login: (body: LoginPayload) =>
    apiRequest<LoginResponse>("/auth/login", null, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
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
  uploadPhoto: async (token: string, inspectionId: string, mediaId: string, uploadUrl: string, photo: LocalPhoto) => {
    const isLocalUpload = uploadUrl.startsWith(API_BASE_URL);
    if (isLocalUpload) {
      const form = new FormData();
      form.append("file", {
        uri: photo.uri,
        name: photo.fileName,
        type: photo.mimeType,
      } as never);
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }
      return response.json();
    }

    const result = await FileSystem.uploadAsync(uploadUrl, photo.uri, {
      httpMethod: "PUT",
      headers: {
        "Content-Type": photo.mimeType,
      },
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    });
    if (result.status < 200 || result.status >= 300) {
      throw new Error(`Upload failed: ${result.status}`);
    }
    return { inspectionId, mediaId, s3Key: uploadUrl };
  },

  transcribeAudio: async (audioUri: string): Promise<string> => {
    const form = new FormData();
    form.append("file", {
      uri: audioUri,
      name: "voice.wav",
      type: "audio/wav",
    } as never);
    const response = await fetch(`${API_BASE_URL}/voice/transcribe`, {
      method: "POST",
      body: form,
    });
    if (!response.ok) {
      return "";
    }
    const data = await response.json() as { transcript?: string };
    return data.transcript ?? "";
  },

  readFileBase64: (uri: string) => FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 }),
};
