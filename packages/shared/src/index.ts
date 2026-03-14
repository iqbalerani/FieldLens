export type InspectionStatus =
  | "draft"
  | "uploading"
  | "submitted"
  | "processing"
  | "complete"
  | "failed";

export type IssueSeverity = "CRITICAL" | "WARNING" | "INFO";
export type OverallStatus = "PASS" | "WARN" | "FAIL";
export type MediaKind = "photo" | "audio";

export interface InspectionIssue {
  id?: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  affectedArea: string;
  suggestedAction: string;
  photoReferenceIndex?: number | null;
}

export interface InspectionReport {
  summary: string;
  overallStatus: OverallStatus;
  confidenceScore: number;
  issues: InspectionIssue[];
  recommendations: string[];
  missingInfo: string[];
  comparisonWithPrior: string;
}

export interface InspectionMediaItem {
  id: string;
  type: MediaKind;
  s3Key: string;
  mimeType: string;
  sizeBytes: number;
  uploadUrl?: string | null;
  previewUrl?: string | null;
}

export interface InspectionSummary {
  id: string;
  orgId: string;
  siteId: string;
  siteName: string;
  inspectionType: string;
  inspectorName: string;
  status: InspectionStatus;
  createdAt: string;
  submittedAt?: string | null;
  processedAt?: string | null;
  summary?: string | null;
  overallStatus?: OverallStatus | null;
  issueCount: number;
  criticalCount: number;
  transcriptExcerpt?: string | null;
}

export interface InspectionDetail extends InspectionSummary {
  latitude?: number | null;
  longitude?: number | null;
  textNotes?: string | null;
  voiceTranscript?: string | null;
  report?: InspectionReport | null;
  media: InspectionMediaItem[];
}

export interface SearchResult {
  inspection: InspectionSummary;
  similarityScore: number;
}

export interface AnalyticsTrendPoint {
  date: string;
  totalInspections: number;
  criticalIssues: number;
  warningIssues: number;
  infoIssues: number;
}

export interface CreateInspectionPayload {
  siteName: string;
  inspectionType: string;
  inspectorName: string;
  latitude?: number | null;
  longitude?: number | null;
  textNotes?: string;
  requestedMedia?: Array<{
    type: MediaKind;
    mimeType: string;
    sizeBytes: number;
    fileName: string;
  }>;
}

export interface CreateInspectionResponse {
  inspectionId: string;
  uploadTargets: InspectionMediaItem[];
}

export interface RegisterInspectionMediaPayload {
  media: Array<{
    id: string;
    s3Key: string;
    mimeType: string;
    sizeBytes: number;
    type: MediaKind;
  }>;
  voiceTranscript?: string;
}

export interface SubmitInspectionResponse {
  inspectionId: string;
  status: InspectionStatus;
}

export interface CurrentUser {
  id: string;
  orgId: string;
  email: string;
  name: string;
  role: "ADMIN" | "SUPERVISOR" | "INSPECTOR";
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: "bearer";
  user: CurrentUser;
}
