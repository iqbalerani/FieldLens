# FieldLens — Technical Architecture Document
### AI-Powered Field Inspection & Reporting Platform
**Amazon Nova AI Hackathon 2026**

> **Prepared by:** Iqbal Erani — Iqbal Augmented Intelligence (IAI)
> **Version:** v1.0 — March 11, 2026
> **Status:** Active Development
> **Deadline:** March 17, 2026

| Category | Build Time | Platforms | Nova Services |
|---|---|---|---|
| Multimodal Understanding | 5 Days Solo | Mobile + Web | Nova 2 Lite + Nova 2 Sonic + Nova Embeddings |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Amazon Nova & AWS Services Stack](#3-amazon-nova--aws-services-stack)
4. [Mobile Application — React Native](#4-mobile-application--react-native)
5. [Backend API — Python FastAPI on AWS](#5-backend-api--python-fastapi-on-aws)
6. [Database Architecture — Amazon RDS PostgreSQL](#6-database-architecture--amazon-rds-postgresql)
7. [Web Dashboard — Next.js](#7-web-dashboard--nextjs)
8. [Data Flows & Sequence Diagrams](#8-data-flows--sequence-diagrams)
9. [Security Architecture](#9-security-architecture)
10. [Deployment Architecture](#10-deployment-architecture)
11. [AWS Cost Estimate](#11-aws-cost-estimate-hackathon-period)
12. [Demo Script — 3 Minute Video](#12-demo-script--3-minute-video)
13. [Codebase Directory Structure](#13-codebase-directory-structure)
14. [Non-Functional Requirements](#14-non-functional-requirements)
15. [Appendix — Reference & Resources](#15-appendix--reference--resources)

---

## 1. Executive Summary

### 1.1 Project Overview

FieldLens is an AI-powered field inspection and reporting platform that transforms the way organizations conduct and document field operations. The platform enables field workers to capture inspections using their mobile devices — combining photos, voice notes, and written observations — while an AI backend automatically generates structured, actionable reports accessible in real time through a web dashboard.

FieldLens directly addresses a critical inefficiency in industries such as construction, real estate, NGO field operations, warehouse auditing, and infrastructure management: the manual, error-prone, and time-consuming process of creating inspection reports. Workers spend hours writing up findings after the fact, often with inconsistent quality and missing details.

### 1.2 Core Value Proposition

| Dimension | Traditional Approach | With FieldLens | Improvement |
|---|---|---|---|
| Report Creation Time | 2–4 hours manual writing | < 5 minutes automated | ~95% time savings |
| Report Consistency | Variable, subjective | Structured JSON output | Standardized |
| Evidence Capture | Text-only or loose photos | Multimodal: image + voice + text | Complete audit trail |
| Searchability | File folders, manual search | Semantic vector search | Instant retrieval |
| Real-time Visibility | Reports sent by WhatsApp/email | Live dashboard updates | Zero lag |
| Issue Detection | Human judgment only | AI severity classification | Consistent flagging |

### 1.3 Hackathon Alignment

FieldLens is purpose-built to satisfy the Amazon Nova AI Hackathon judging criteria. The application leverages three distinct Amazon Nova foundation models, is deployed entirely on AWS infrastructure, and demonstrates measurable enterprise and community impact.

| Judging Criterion | Weight | How FieldLens Scores |
|---|---|---|
| Technical Implementation | 60% | Three Nova services integrated in a coherent pipeline; multimodal reasoning, semantic embeddings, voice transcription; robust FastAPI backend; deployed on AWS |
| Enterprise / Community Impact | 20% | Serves construction, NGOs, healthcare field camps, property management globally; estimated 95% reduction in report writing time |
| Creativity & Innovation | 20% | Cross-modal semantic search across field inspections is genuinely novel; multi-surface product story (mobile field + web HQ) with natural use case split |

> ⚠️ **Note:** All AI processing is performed exclusively via Amazon Bedrock. No third-party AI providers are used, satisfying the hackathon requirement that the core solution uses Amazon Nova foundation models.

---

## 2. System Architecture Overview

### 2.1 High-Level Architecture

FieldLens is composed of three primary layers: a React Native mobile application for field data capture, a Python FastAPI backend deployed on AWS for AI processing and business logic, and a Next.js web dashboard for supervisory visibility and reporting. All AI capabilities are powered exclusively by Amazon Nova models accessed through Amazon Bedrock.

```
┌─────────────────────────────────────────────────────────┐
│              MOBILE APP  (React Native / Expo)           │
│   📷 Camera  |  🎙 Voice  |  📝 Text  |  📍 Location   │
└────────────────────────┬────────────────────────────────┘
                         │  HTTPS / REST API
                         ▼
┌─────────────────────────────────────────────────────────┐
│          BACKEND API  (FastAPI on AWS EC2 / Lambda)      │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────────┐ │
│  │  Ingest  │  │   Auth   │  │   Report Generator     │ │
│  │  Service │  │  (JWT)   │  │   (Nova 2 Lite)        │ │
│  └──────────┘  └──────────┘  └────────────────────────┘ │
│  ┌──────────┐  ┌────────────────────────────────────┐   │
│  │  Voice   │  │  Semantic Search (Nova Embeddings) │   │
│  │  (Sonic) │  │  + pgvector on RDS PostgreSQL      │   │
│  └──────────┘  └────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────┘
           ┌─────────────┼─────────────────┐
           ▼             ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌───────────────────┐
│  AWS S3      │  │  Amazon      │  │  Amazon RDS       │
│  (Media)     │  │  Bedrock     │  │  PostgreSQL       │
│              │  │  Nova 2 Lite │  │  + pgvector       │
│              │  │  Nova Sonic  │  │                   │
│              │  │  Nova Embed  │  │                   │
└──────────────┘  └──────────────┘  └───────────────────┘
                         ▲
                         │  HTTPS / REST API
┌─────────────────────────────────────────────────────────┐
│            WEB DASHBOARD  (Next.js on Vercel)            │
│   📊 Inspection Feed  |  🔍 Search  |  📄 PDF Export   │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Architectural Principles

- **Serverless-first on AWS:** Lambda for event-driven processing, EC2 for persistent API, S3 for all media storage
- **Nova-native:** Every AI capability runs exclusively through Amazon Bedrock — no OpenAI, no Anthropic, no Hugging Face
- **Stateless API design:** All state stored in RDS PostgreSQL; API servers are horizontally scalable
- **Event-driven media pipeline:** S3 upload triggers Lambda for immediate preprocessing before AI analysis
- **Mobile-first, dashboard-second:** The mobile app is the primary input surface; the web dashboard is the command centre
- **JWT authentication:** Stateless auth across mobile and web using AWS Cognito

---

## 3. Amazon Nova & AWS Services Stack

### 3.1 Amazon Nova Foundation Models

FieldLens uses three distinct Amazon Nova foundation models, all accessed via Amazon Bedrock. Each model serves a specific, well-defined role in the AI pipeline.

---

#### MODEL 1 — Amazon Nova 2 Lite
```
Bedrock Model ID:  amazon.nova-lite-v2:0
```

**Role in FieldLens:**
- Primary multimodal reasoning engine — receives images, voice transcripts, and text together in a single prompt
- Generates structured inspection reports as JSON (issues, severity, recommendations, follow-up items)
- Performs contextual comparison with prior inspection data retrieved from vector search
- Generates natural-language summaries for the web dashboard and email notifications

> *Why Nova 2 Lite:* Fast inference speed, cost-effective for high-frequency inspection submissions, strong multimodal understanding across images and text in a single context window.

---

#### MODEL 2 — Amazon Nova 2 Sonic
```
Bedrock Model ID:  amazon.nova-sonic-v2:0
```

**Role in FieldLens:**
- Real-time voice note transcription on the mobile app — field worker speaks, text appears in < 1 second
- Handles noisy field environments (construction sites, warehouses) with high accuracy
- Enables hands-free operation when inspectors are climbing ladders, handling equipment, or wearing gloves

> *Why Nova 2 Sonic:* Native speech-to-speech model with real-time streaming — the only Amazon Nova model purpose-built for conversational voice AI, giving FieldLens a genuine advantage on the Voice AI dimension.

---

#### MODEL 3 — Amazon Nova Multimodal Embeddings
```
Bedrock Model ID:  amazon.nova-embed-multimodal-v1:0
```

**Role in FieldLens:**
- Generates multimodal vector embeddings for every inspection (text + image combined into a single embedding vector)
- Powers semantic search on the web dashboard — users query in natural language and find semantically similar past inspections
- Enables RAG (Retrieval-Augmented Generation) by fetching relevant prior inspections as context for Nova 2 Lite reasoning

> *Why Nova Multimodal Embeddings:* The only embedding model that encodes images and text in the same vector space — critical for cross-modal search (e.g., find inspections similar to this photo without using text keywords).

---

### 3.2 AWS Infrastructure Services

| AWS Service | Purpose in FieldLens | Configuration | Why AWS |
|---|---|---|---|
| Amazon Bedrock | Managed API access to all Nova models | us-east-1 region; on-demand inference | Required by hackathon; managed, no GPU provisioning needed |
| AWS EC2 | Hosts the FastAPI backend API server | t3.medium; Ubuntu 24.04 LTS; Elastic IP | Persistent server for WebSocket support (Nova Sonic streaming) |
| AWS Lambda | S3 event trigger for preprocessing uploaded media | Python 3.12 runtime; 512MB memory; 30s timeout | Serverless, auto-scaling, cost-free at hackathon volume |
| Amazon S3 | Stores all media uploads: images, audio, PDF reports | Standard tier; versioning enabled; lifecycle rules | Durable, cheap, integrates natively with Lambda triggers |
| Amazon RDS | Primary relational database for all structured data | PostgreSQL 16 + pgvector extension; db.t3.micro | pgvector enables storing and querying embedding vectors natively |
| Amazon Cognito | User authentication and JWT token management | User Pool with email/password; hosted UI optional | Managed auth; works natively with React Native Amplify SDK |
| AWS CloudFront | CDN for serving the Next.js web dashboard and static assets | Distribution pointed at Vercel or S3 static site | Low-latency global delivery; HTTPS by default |
| Amazon CloudWatch | Logging, monitoring, and alerting for all backend services | Log groups per service; metric alarms for errors | Centralized observability; free tier covers hackathon needs |
| AWS IAM | Role-based access control between all AWS services | EC2 role with Bedrock + S3 + RDS access; least privilege | Secure service-to-service communication without keys |
| AWS API Gateway | Optional HTTP gateway in front of Lambda functions | HTTP API type; CORS configured | Managed routing, throttling, and usage plans |

---

## 4. Mobile Application — React Native

### 4.1 Technology Stack

| Layer | Technology |
|---|---|
| Framework | React Native with Expo SDK 50 |
| Language | TypeScript (strict mode) |
| Navigation | React Navigation v6 (Stack + Tab navigators) |
| State Management | Zustand (lightweight, no Redux boilerplate) |
| API Client | Axios with interceptors for JWT auth headers |
| Camera | expo-camera (photo capture + video preview) |
| Audio | expo-av (voice recording) + WebSocket (Nova Sonic streaming) |
| Image Handling | expo-image-manipulator (compression before upload) |
| Location | expo-location (GPS coordinates per inspection) |
| Auth | AWS Amplify Auth (Cognito integration) |
| UI Components | React Native Paper + custom components |
| Target Platforms | iOS 15+ and Android 11+ |

### 4.2 Application Screens & Navigation

| Screen | Route | Description |
|---|---|---|
| Splash / Login | `/auth/login` | AWS Cognito authentication; email + password; JWT stored in SecureStore |
| Dashboard (Home) | `/home` | Recent inspections list; quick-start new inspection CTA; sync status |
| New Inspection | `/inspection/new` | Step-by-step wizard: site info → photos → voice → text → submit |
| Camera Capture | `/inspection/camera` | Full-screen camera with multi-photo support; flash, zoom controls |
| Voice Recorder | `/inspection/voice` | Real-time recording with Nova Sonic waveform visualisation; transcript preview |
| Text Notes | `/inspection/notes` | Rich text input for additional context; auto-suggest from prior reports |
| Review & Submit | `/inspection/review` | Shows all captured media; allows removal/re-capture; submit button |
| Submission Status | `/inspection/status/:id` | Live progress: uploading → processing → report ready; AI status cards |
| Inspection Detail | `/inspection/:id` | Full AI-generated report; severity badges; photos; voice transcript |
| History | `/history` | Paginated list of past inspections; filter by date, status, severity |
| Profile / Settings | `/settings` | User profile; notification preferences; offline mode toggle |

### 4.3 New Inspection Wizard — Detailed Flow

1. **Step 1 — Site Information:** Inspector enters site name, location (auto-populated via GPS), inspection type (Construction / Property / Warehouse / NGO / Other), and inspector name.

2. **Step 2 — Photo Capture:** Opens full-screen camera. Inspector takes 1–10 photos. Each photo is compressed to < 1MB using expo-image-manipulator before being stored locally. Thumbnail strip shows captured photos with delete option.

3. **Step 3 — Voice Note:** Inspector presses and holds the record button. Audio streams in real time to the backend via WebSocket, which forwards it to Nova 2 Sonic. Transcription appears word-by-word on screen. Inspector can listen back and re-record.

4. **Step 4 — Text Notes:** Optional free-text field for additional context not captured in voice. Auto-complete suggests common inspection terms based on inspection type.

5. **Step 5 — Review:** Full summary of all captured data. Inspector can navigate back to any step. Estimated AI processing time shown.

6. **Step 6 — Submit:** All media uploaded to S3 via pre-signed URLs. Metadata (site info, location, timestamps) sent to FastAPI. Inspector sees live status updates via WebSocket.

### 4.4 Nova 2 Sonic Integration on Mobile

Voice capture on mobile uses a WebSocket connection to the FastAPI backend, which proxies the audio stream to Amazon Bedrock's Nova 2 Sonic streaming endpoint. This keeps AWS credentials server-side while delivering real-time transcription to the mobile client.

```
Voice Pipeline:
Mobile (expo-av) → WebSocket → FastAPI Backend → Amazon Bedrock (Nova 2 Sonic) → Transcript JSON → WebSocket → Mobile UI
```

**Key implementation details:**
- Audio format: PCM 16-bit, 16kHz mono (optimal for Nova 2 Sonic)
- Chunk size: 4096 bytes per WebSocket frame to minimise latency
- Backend forwards audio chunks to Bedrock using boto3 streaming invoke API
- Partial transcription results are streamed back to mobile as they arrive (word-by-word display)
- Final transcript is stored in the inspection record in RDS PostgreSQL

### 4.5 Offline Support Strategy

Field inspections often occur in low-connectivity environments. FieldLens handles this with a local-first approach on mobile.

- Inspection data (photos, voice recordings, text notes) is saved locally using expo-file-system and AsyncStorage as a draft
- A background sync service monitors network connectivity using `@react-native-netinfo/netinfo`
- When connectivity is restored, queued inspections are automatically uploaded in FIFO order
- Sync status is displayed prominently on the home screen with pending count badge
- Completed inspections are cached locally so field workers can review past reports offline

---

## 5. Backend API — Python FastAPI on AWS

### 5.1 Technology Stack

| Layer | Technology |
|---|---|
| Framework | FastAPI (Python 3.12) — async by default |
| Server | Uvicorn with Gunicorn workers; 4 workers on t3.medium EC2 |
| AWS SDK | boto3 (official AWS Python SDK) for all Bedrock, S3, Cognito calls |
| Database ORM | SQLAlchemy 2.0 (async) + Alembic for migrations |
| Authentication | python-jose for JWT validation; AWS Cognito as IdP |
| WebSockets | FastAPI native WebSocket support for Nova Sonic streaming |
| Task Queue | FastAPI BackgroundTasks for non-blocking AI processing |
| Validation | Pydantic v2 for request/response models |
| Testing | pytest + httpx for API testing |
| Containerisation | Docker; deployed on EC2 via docker-compose |
| Process Management | systemd service for auto-restart on EC2 |
| Environment | python-dotenv; secrets in AWS Secrets Manager |

### 5.2 API Endpoint Reference

| Method | Endpoint | Auth | Description | Nova Used |
|---|---|---|---|---|
| POST | `/auth/token` | None | Exchange Cognito auth code for JWT access token | None |
| GET | `/auth/me` | JWT | Return current user profile from Cognito | None |
| POST | `/inspections` | JWT | Create new inspection record; returns ID + S3 pre-signed URLs | None |
| GET | `/inspections` | JWT | List inspections with pagination and filters | None |
| GET | `/inspections/{id}` | JWT | Get full inspection detail including AI-generated report | None |
| POST | `/inspections/{id}/submit` | JWT | Trigger AI processing pipeline on uploaded media | Nova 2 Lite |
| GET | `/inspections/{id}/status` | JWT | SSE stream for real-time processing status updates | None |
| WS | `/ws/voice/{session_id}` | JWT | WebSocket endpoint for Nova 2 Sonic voice streaming | Nova 2 Sonic |
| POST | `/search` | JWT | Semantic search across all inspections using natural language | Nova Embeddings |
| GET | `/reports/{id}/pdf` | JWT | Generate and return PDF version of an inspection report | None |
| GET | `/analytics/trends` | JWT | Issue trends over time; severity breakdown; site comparisons | None |
| POST | `/webhooks/s3` | HMAC | Lambda webhook: S3 upload complete, trigger preprocessing | None |

### 5.3 AI Processing Pipeline — Detailed

The AI processing pipeline is the heart of FieldLens. It orchestrates all three Nova models in sequence to produce a comprehensive, structured inspection report.

---

#### STEP 1 — Media Ingestion & Preprocessing
- Lambda function triggered by S3 upload event
- Images are validated (JPEG/PNG, max 10MB), resized to 1024px longest edge for Bedrock
- Images converted to base64 for inclusion in Bedrock multimodal prompt
- Voice transcript is already available from Nova 2 Sonic real-time processing; stored in RDS

#### STEP 2 — Context Retrieval via Nova Embeddings (RAG)
- Combine voice transcript + first image as query for Nova Multimodal Embeddings API
- Generate 1536-dimensional embedding vector from query
- Run cosine similarity search using pgvector:
  ```sql
  SELECT * FROM inspections ORDER BY embedding <=> $1 LIMIT 3
  ```
- Top 3 similar past inspections retrieved and formatted as context for the reasoning step

#### STEP 3 — Multimodal Reasoning via Nova 2 Lite
- All images (base64), voice transcript, text notes, GPS location, and similar past inspections assembled into a single multimodal prompt
- Nova 2 Lite instructed to return ONLY valid JSON (no markdown, no preamble)
- Response schema: `{ summary, issues[], recommendations[], missing_info[], overall_status, confidence_score }`
- Each issue: `{ title, description, severity (CRITICAL/WARNING/INFO), affected_area, suggested_action }`

#### STEP 4 — Embedding & Indexing
- Once report is generated, call Nova Multimodal Embeddings with final report text + primary image
- Store embedding vector in RDS PostgreSQL inspections table via pgvector
- This makes the inspection immediately searchable by future semantic queries

#### STEP 5 — Storage & Notification
- Full report JSON stored in RDS PostgreSQL inspections table
- WebSocket notification sent to mobile client: status changes from `processing` to `complete`
- Web dashboard receives Server-Sent Event (SSE) with new inspection data for live feed update
- If any CRITICAL severity issues detected, Amazon SNS notification sent to supervisor email/SMS

---

### 5.4 Nova 2 Lite Prompt Template

```python
SYSTEM_PROMPT = """
You are FieldLens AI, an expert field inspection analyst. You analyze multimodal
inspection data (photos, voice transcripts, text notes) and produce structured,
professional inspection reports. You respond ONLY with valid JSON. Never include
markdown code fences, preamble, or explanation outside the JSON object.
"""

USER_PROMPT = """
INSPECTION METADATA:
- Site: {site_name} | Type: {inspection_type} | Inspector: {inspector_name}
- Date: {timestamp} | GPS: {latitude}, {longitude}

VOICE TRANSCRIPT:
{voice_transcript_text}

ADDITIONAL NOTES:
{text_notes}

SIMILAR PAST INSPECTIONS (for context):
{similar_inspections_json}

PHOTOS: {N} photos attached as base64 images below.

RESPONSE SCHEMA (return ONLY this JSON):
{
  "summary": string,
  "overall_status": "PASS" | "WARN" | "FAIL",
  "confidence_score": 0.0-1.0,
  "issues": [
    {
      "title": string,
      "description": string,
      "severity": "CRITICAL" | "WARNING" | "INFO",
      "affected_area": string,
      "suggested_action": string,
      "photo_reference_index": integer
    }
  ],
  "recommendations": [string],
  "missing_info": [string],
  "comparison_with_prior": string
}
"""
```

---

## 6. Database Architecture — Amazon RDS PostgreSQL

### 6.1 Database Overview

FieldLens uses Amazon RDS PostgreSQL 16 as its primary database. The pgvector extension is installed to enable native vector similarity search on inspection embeddings, eliminating the need for a separate dedicated vector database service.

### 6.2 Schema Design

| Table | Primary Columns | Purpose |
|---|---|---|
| `users` | id (UUID), cognito_sub, name, email, org_id, role, created_at | Stores user profiles synced from Cognito; supports multi-org |
| `organisations` | id (UUID), name, industry_type, settings (JSONB), created_at | Org-level grouping; each inspection belongs to an org |
| `sites` | id (UUID), org_id, name, address, latitude, longitude, type, created_at | Physical locations being inspected; reusable across inspections |
| `inspections` | id (UUID), site_id, user_id, status ENUM, embedding vector(1536), report JSONB, submitted_at, processed_at | Core table; stores full AI report as JSONB; embedding for vector search |
| `inspection_media` | id (UUID), inspection_id, type ENUM, s3_key, mime_type, size_bytes, created_at | Records for each uploaded file (photo, audio); S3 key reference |
| `inspection_issues` | id (UUID), inspection_id, title, severity ENUM, description, affected_area, resolved_at | Denormalised issues extracted from AI report for fast querying |
| `voice_transcripts` | id (UUID), inspection_id, transcript_text, language, word_count, sonic_session_id | Stores full transcript from Nova 2 Sonic processing |
| `search_queries` | id (UUID), user_id, query_text, query_embedding vector(1536), result_count, created_at | Audit log of semantic searches; analytics data |
| `notifications` | id (UUID), user_id, inspection_id, type, message, read_at, sent_at | In-app and SNS notification tracking |

### 6.3 pgvector Configuration

```sql
-- Install extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to inspections table
ALTER TABLE inspections ADD COLUMN embedding vector(1536);

-- Create IVFFlat index for fast approximate nearest-neighbour search
CREATE INDEX ON inspections USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Semantic search query
SELECT id, site_name, summary, overall_status,
       1 - (embedding <=> $query_vector) AS similarity_score
FROM inspections
WHERE org_id = $org_id
ORDER BY embedding <=> $query_vector
LIMIT 10;
```

> **Note:** IVFFlat index with 100 lists provides fast approximate nearest-neighbour search. For hackathon scale (< 10,000 inspections), exact search without an index is also acceptable.

---

## 7. Web Dashboard — Next.js

### 7.1 Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) with TypeScript |
| Styling | Tailwind CSS 3 + shadcn/ui component library |
| State Management | Zustand for client state; TanStack Query for server state |
| Real-time | Server-Sent Events (SSE) for live inspection feed updates |
| Charts | Recharts for trend analytics and severity dashboards |
| PDF Export | `@react-pdf/renderer` for client-side PDF generation |
| Maps | React Leaflet for site location visualisation |
| Auth | AWS Amplify Auth (same Cognito User Pool as mobile) |
| Deployment | Vercel (free tier; auto-deploys from GitHub main branch) |
| API Communication | Axios with JWT interceptor (mirrors mobile configuration) |

### 7.2 Dashboard Pages & Features

| Page | Route | Key Features |
|---|---|---|
| Login | `/login` | AWS Cognito hosted UI or custom form; JWT stored in httpOnly cookie |
| Overview Dashboard | `/dashboard` | KPI cards; live inspection feed; severity donut chart |
| Inspections List | `/inspections` | Paginated table with filters; bulk export; column sorting |
| Inspection Detail | `/inspections/[id]` | Full AI report view; issue cards; photo gallery; voice transcript; PDF export |
| Semantic Search | `/search` | Natural language search bar; results ranked by similarity |
| Sites Map | `/sites` | Interactive Leaflet map; pins coloured by last inspection status |
| Analytics | `/analytics` | Issue trends over time; most common issue types; inspector performance |
| Settings | `/settings` | Org settings; user management; notification preferences |

### 7.3 Real-Time Updates

The web dashboard maintains a live connection to the backend via Server-Sent Events (SSE). When a new inspection report is generated, the dashboard updates instantly without requiring a page refresh.

- SSE connection established on login to `/api/stream/inspections/{org_id}`
- Backend sends events for: `inspection_submitted`, `processing_started`, `report_ready`, `critical_issue_detected`
- TanStack Query cache updated on each event, triggering React re-renders automatically
- Connection re-established automatically on network drop using EventSource retry mechanism

---

## 8. Data Flows & Sequence Diagrams

### 8.1 Inspection Submission Flow

```
Mobile App          FastAPI Backend       AWS S3        Amazon Bedrock        Web Dashboard
    │                   │                  │                  │                    │
    │──POST /inspections→│                  │                  │                    │
    │←──inspection_id────│                  │                  │                    │
    │←──S3 presigned URLs│                  │                  │                    │
    │────────────────────────────PUT media──→│                  │                    │
    │──POST /submit──────→│                  │                  │                    │
    │                   │──invoke Lambda────→│                  │                    │
    │                   │  (preprocess)     │                  │                    │
    │                   │──Embeddings query──────────────────→ │Nova Embeddings     │
    │                   │←──vector results───────────────────  │                    │
    │                   │──Multimodal prompt─────────────────→ │Nova 2 Lite         │
    │                   │←──JSON report──────────────────────  │                    │
    │                   │──Index embedding───────────────────→ │Nova Embeddings     │
    │←──WS: report_ready─│                  │                  │                    │
    │                   │──SSE: report_ready─────────────────────────────────────→ │
    │                   │                  │                  │                    │
```

### 8.2 Semantic Search Flow

1. User types natural language query in web dashboard search bar (e.g., `cracked concrete foundations`)
2. `POST /search` request sent to FastAPI with query string
3. Backend calls Nova Multimodal Embeddings with query text (text-only embedding)
4. 1536-dimensional query vector used in pgvector cosine similarity search
5. Top 10 results returned with similarity scores, sorted by relevance
6. Web dashboard renders results with similarity percentage, inspection thumbnail, and key issues
7. User can click any result to open full inspection detail

### 8.3 Voice Transcription Flow

```
Mobile App          FastAPI Backend         Amazon Bedrock (Nova Sonic)
    │                   │                          │
    │──WS Connect───────→│                          │
    │──Audio chunk 1────→│──Forward chunk 1─────────→│
    │──Audio chunk 2────→│──Forward chunk 2─────────→│
    │──Audio chunk N────→│                          │
    │                   │←──Partial transcript──────│
    │←──Partial text─────│                          │
    │                   │←──Final transcript────────│
    │←──Complete text────│                          │
    │──WS Close─────────→│                          │
    │                   │──Store in RDS─────────────│
```

---

## 9. Security Architecture

### 9.1 Authentication & Authorisation

| Layer | Mechanism | Implementation |
|---|---|---|
| Identity Provider | Amazon Cognito User Pool | Hosted user directory; email/password auth; optional MFA |
| Token Type | JWT (JSON Web Token) | Cognito issues access_token (1hr) and refresh_token (30 days) |
| Mobile Auth | AWS Amplify Auth SDK | Stores tokens in expo-secure-store (hardware keychain) |
| Web Auth | AWS Amplify Auth SDK | Stores access_token in memory; refresh_token in httpOnly cookie |
| API Authentication | Bearer JWT in Authorization header | FastAPI dependency validates token against Cognito JWKS |
| API Authorisation | Role-based (ADMIN / SUPERVISOR / INSPECTOR) | Role stored in Cognito user attributes; checked per endpoint |
| Service-to-Service | AWS IAM roles on EC2 | EC2 instance role grants Bedrock + S3 + RDS access; no hardcoded keys |
| S3 Media Access | Pre-signed URLs (15-minute expiry) | Generated server-side; mobile uploads directly to S3 without proxy |

### 9.2 Data Security

- All data encrypted in transit: TLS 1.2+ for all HTTP connections; WSS for WebSocket
- All data encrypted at rest: RDS uses AES-256; S3 server-side encryption (SSE-S3) enabled
- Secrets management: Database credentials stored in AWS Secrets Manager (not in code or .env files)
- CORS policy: FastAPI restricts origins to mobile app domain and Vercel deployment URL
- Input validation: All API inputs validated with Pydantic v2; file type and size limits enforced on upload
- SQL injection prevention: SQLAlchemy ORM with parameterised queries; no raw SQL with user input
- Rate limiting: AWS API Gateway throttling; 100 req/min per user for AI endpoints

---

## 10. Deployment Architecture

### 10.1 Infrastructure Overview

| Component | Service | Configuration |
|---|---|---|
| Mobile App | Expo EAS Build | `expo build:android` for APK; TestFlight for iOS; or Expo Go for demo |
| Backend API | AWS EC2 t3.medium | Ubuntu 24.04 LTS; Docker + docker-compose; Elastic IP; systemd auto-restart |
| Web Dashboard | Vercel (free tier) | Next.js auto-deploy from GitHub; preview deploys per PR |
| Database | Amazon RDS PostgreSQL | db.t3.micro; automated backups enabled |
| Media Storage | Amazon S3 | Standard storage class; lifecycle rules: move to IA after 30 days |
| Serverless Functions | AWS Lambda | S3 event trigger for preprocessing; API Gateway for webhook endpoints |
| CDN | Amazon CloudFront | Distribution in front of S3 for static asset delivery |
| SSL Certificates | AWS Certificate Manager | Free TLS certificates for custom domains |
| Monitoring | Amazon CloudWatch | Logs, metrics, and alarms for EC2, Lambda, RDS, and Bedrock usage |

### 10.2 5-Day Deployment Timeline

| Day | Infrastructure Tasks | Development Tasks | Deliverable |
|---|---|---|---|
| Day 1 | AWS account setup; Bedrock access; S3 bucket; RDS provisioning; Cognito User Pool | FastAPI scaffold; React Native Expo init; Next.js scaffold; env config | All services running; hello-world API responding |
| Day 2 | EC2 instance launch; Docker setup; IAM roles; Lambda S3 trigger | Nova 2 Sonic voice pipeline; Nova 2 Lite report generation; S3 upload flow | End-to-end: capture → upload → AI report generated |
| Day 3 | RDS pgvector extension installed; CloudWatch logging enabled | Nova Embeddings integration; pgvector search; full mobile wizard | Semantic search working; mobile wizard complete |
| Day 4 | CloudFront distribution; API Gateway; Vercel deployment | Web dashboard: inspection feed, detail view, search, PDF export | Both surfaces fully functional and deployed |
| Day 5 | Final production config; CloudWatch alarms; rate limits | Demo video recording; Devpost submission; builder.aws.com blog post | Submission complete before deadline |

### 10.3 Docker Compose (Local Development)

```yaml
version: '3.8'
services:
  api:
    build: ./apps/backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://fieldlens:password@db:5432/fieldlens
      - AWS_REGION=us-east-1
    depends_on:
      - db

  db:
    image: pgvector/pgvector:pg16
    environment:
      - POSTGRES_USER=fieldlens
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=fieldlens
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## 11. AWS Cost Estimate (Hackathon Period)

> The $100 AWS promotional credit available to hackathon participants covers the full estimated cost.

| AWS Service | Usage | Free Tier | Est. Cost (5 days) | Notes |
|---|---|---|---|---|
| Amazon Bedrock (Nova 2 Lite) | ~500 API calls × avg 2,000 input tokens | Not in free tier | ~$3.00 | Input: $0.0003/1K tokens; Output: $0.0012/1K tokens |
| Amazon Bedrock (Nova 2 Sonic) | ~100 voice sessions × 30 seconds | Not in free tier | ~$1.50 | Billed per second of audio processed |
| Amazon Bedrock (Embeddings) | ~600 embedding calls | Not in free tier | ~$0.60 | $0.001 per 1K tokens |
| Amazon EC2 (t3.medium) | 120 hours | 750 hrs/month t2.micro | ~$0.00 | t3.micro eligible for free tier |
| Amazon RDS (db.t3.micro) | 120 hours | 750 hrs/month | ~$0.00 | Within free tier |
| Amazon S3 | ~500MB storage + 1,000 requests | 5GB + 20K GET | ~$0.00 | Within free tier |
| AWS Lambda | ~2,000 invocations | 1M invocations/month | ~$0.00 | Within free tier |
| Amazon Cognito | ~20 users | 50,000 MAU free | ~$0.00 | Within free tier |
| CloudWatch | Basic logging + metrics | Basic monitoring free | ~$0.00 | Basic tier covers hackathon |
| **TOTAL** | | | **~$5.10** | Well within $100 AWS credit |

---

## 12. Demo Script — 3 Minute Video

> **Hashtag to include:** `#AmazonNova`

| Timestamp | Scene | What to Show & Say |
|---|---|---|
| 0:00–0:20 | Problem Setup | Screen recording of a messy WhatsApp group with scattered construction site photos. Narrate: *"Field inspections today look like this — scattered photos, voice notes, and delayed reports. FieldLens changes that."* |
| 0:20–0:50 | Mobile — Photo Capture | Open FieldLens mobile app. Start new inspection. Fill in site name. Tap camera. Take 3 photos of a mock inspection site (cracks, signage, equipment). Show thumbnails appearing in strip. |
| 0:50–1:20 | Mobile — Voice Note (Nova Sonic) | Hold record button. Speak: *"There are visible cracks in the north wall, approximately 3 meters long. The safety signage near the entrance is missing. Equipment near Zone B appears to be unlabelled."* Show real-time word-by-word transcription appearing on screen. |
| 1:20–1:35 | Mobile — Submit | Tap Review, briefly show summary of captured data. Tap Submit. Show upload progress bar: *"Uploading media... Sending to AI..."* Show status card change to *"Processing"*. |
| 1:35–2:00 | Web — Live Report Appears (Nova 2 Lite) | Switch to web dashboard. Show inspection feed. New card appears live (SSE update). Click to open. Show AI-generated report: summary, 3 issues with CRITICAL/WARNING/INFO severity badges, recommendations list. |
| 2:00–2:25 | Web — Semantic Search (Nova Embeddings) | Type in search bar: *"inspections with wall cracks"*. Show results appearing ranked by similarity with percentage scores. Click a result — a different inspection from weeks ago surfaced by the AI. |
| 2:25–2:45 | Web — Analytics & PDF | Quick scroll through analytics chart. Click Export PDF. Show a clean formatted PDF report opening. Narrate: *"From field capture to shareable professional report in under 2 minutes."* |
| 2:45–3:00 | Closing Impact Statement | Return to splash screen. Show: *"Powered by Amazon Nova 2 Lite + Nova 2 Sonic + Nova Multimodal Embeddings via Amazon Bedrock. Built for construction, NGOs, real estate, and beyond."* |

---

## 13. Codebase Directory Structure

```
fieldlens/                              # Monorepo root
├── apps/
│   ├── mobile/                         # React Native Expo application
│   │   ├── src/
│   │   │   ├── screens/                # All screen components
│   │   │   │   ├── auth/
│   │   │   │   │   └── LoginScreen.tsx
│   │   │   │   ├── home/
│   │   │   │   │   └── HomeScreen.tsx
│   │   │   │   ├── inspection/
│   │   │   │   │   ├── NewInspectionWizard.tsx
│   │   │   │   │   ├── CameraScreen.tsx
│   │   │   │   │   ├── VoiceRecorderScreen.tsx
│   │   │   │   │   ├── TextNotesScreen.tsx
│   │   │   │   │   ├── ReviewScreen.tsx
│   │   │   │   │   ├── SubmissionStatusScreen.tsx
│   │   │   │   │   └── InspectionDetailScreen.tsx
│   │   │   │   └── settings/
│   │   │   │       └── SettingsScreen.tsx
│   │   │   ├── components/             # Reusable UI components
│   │   │   │   ├── CameraCapture.tsx
│   │   │   │   ├── VoiceRecorder.tsx
│   │   │   │   ├── IssueCard.tsx
│   │   │   │   ├── SeverityBadge.tsx
│   │   │   │   └── SyncStatusBar.tsx
│   │   │   ├── hooks/                  # Custom React hooks
│   │   │   │   ├── useNovaSonic.ts     # WebSocket + voice streaming
│   │   │   │   ├── useInspection.ts
│   │   │   │   └── useOfflineSync.ts
│   │   │   ├── store/                  # Zustand state stores
│   │   │   │   ├── authStore.ts
│   │   │   │   ├── inspectionStore.ts
│   │   │   │   └── syncStore.ts
│   │   │   ├── api/                    # Axios client + endpoints
│   │   │   │   ├── client.ts
│   │   │   │   ├── inspections.ts
│   │   │   │   └── websocket.ts
│   │   │   └── types/                  # TypeScript interfaces
│   │   │       ├── Inspection.ts
│   │   │       ├── Issue.ts
│   │   │       └── User.ts
│   │   ├── app.json
│   │   └── package.json
│   │
│   ├── web/                            # Next.js 14 web dashboard
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   └── login/page.tsx
│   │   │   └── (dashboard)/
│   │   │       ├── dashboard/page.tsx
│   │   │       ├── inspections/
│   │   │       │   ├── page.tsx
│   │   │       │   └── [id]/page.tsx
│   │   │       ├── search/page.tsx
│   │   │       ├── sites/page.tsx
│   │   │       ├── analytics/page.tsx
│   │   │       └── settings/page.tsx
│   │   ├── components/
│   │   │   ├── InspectionCard.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── ReportViewer.tsx
│   │   │   ├── PDFExport.tsx
│   │   │   ├── SeverityChart.tsx
│   │   │   └── LiveFeed.tsx
│   │   ├── hooks/
│   │   │   ├── useSSE.ts               # Server-Sent Events
│   │   │   ├── useSearch.ts
│   │   │   └── useInspections.ts
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   └── pdf.ts
│   │   └── package.json
│   │
│   └── backend/                        # Python FastAPI backend
│       ├── app/
│       │   ├── main.py                 # FastAPI app entry point
│       │   ├── routers/
│       │   │   ├── auth.py
│       │   │   ├── inspections.py
│       │   │   ├── search.py
│       │   │   ├── analytics.py
│       │   │   └── webhooks.py
│       │   ├── services/
│       │   │   ├── inspection_service.py
│       │   │   ├── nova_service.py     # Bedrock API abstraction
│       │   │   ├── embedding_service.py
│       │   │   └── search_service.py
│       │   ├── models/                 # SQLAlchemy ORM models
│       │   │   ├── inspection.py
│       │   │   ├── user.py
│       │   │   ├── site.py
│       │   │   └── issue.py
│       │   ├── schemas/                # Pydantic request/response schemas
│       │   │   ├── inspection.py
│       │   │   └── search.py
│       │   └── ai/                     # AI pipeline modules
│       │       ├── nova_lite.py        # Nova 2 Lite integration
│       │       ├── nova_sonic.py       # Nova 2 Sonic streaming
│       │       ├── nova_embeddings.py  # Multimodal Embeddings
│       │       └── pipeline.py         # Orchestration logic
│       ├── alembic/                    # Database migrations
│       ├── tests/                      # pytest test suite
│       ├── Dockerfile
│       └── requirements.txt
│
├── packages/
│   └── shared/                         # Shared TypeScript types
│       └── src/types/
│
├── infrastructure/                     # AWS CDK / shell scripts
│   ├── setup-ec2.sh
│   ├── setup-rds.sh
│   └── setup-s3.sh
│
├── docker-compose.yml                  # Local development environment
├── .github/
│   └── workflows/
│       ├── backend-deploy.yml          # Auto-deploy backend to EC2
│       └── web-deploy.yml              # Auto-deploy web to Vercel
└── README.md
```

---

## 14. Non-Functional Requirements

| Requirement | Target | Implementation | Monitoring |
|---|---|---|---|
| API Response Time | < 200ms for non-AI endpoints | In-memory DB connection pooling; indexes on frequently queried columns | CloudWatch API latency metric |
| AI Processing Time | < 30s per inspection | Async background task; user gets immediate confirmation; report via WebSocket | CloudWatch: `ai_processing_duration` |
| Voice Transcription Latency | < 1s first words appear | Nova Sonic streaming; 4KB audio chunks; partial results forwarded immediately | CloudWatch: `nova_sonic_latency` |
| Mobile App Load Time | < 2s cold start | Expo optimised bundle; lazy-loaded screens; minimal dependencies | Expo performance monitor |
| Database Query Time | < 50ms for standard queries | pgvector IVFFlat index; composite indexes on `user_id + created_at` | RDS Performance Insights |
| Vector Search Time | < 500ms for semantic search | IVFFlat approximate search; result cache for repeated queries | CloudWatch: `search_latency` |
| Availability | 99%+ during hackathon demo | EC2 t3.medium; systemd auto-restart; health check endpoint | CloudWatch alarm: EC2 status checks |
| Data Durability | No data loss | RDS automated backups; S3 11-nines durability | RDS backup compliance |

### 14.1 Scalability Notes

While FieldLens is built for hackathon demonstration, the architecture is designed to scale to production workloads with minimal changes.

- **Horizontal scaling:** FastAPI backend is stateless and can run behind an Application Load Balancer with multiple EC2 instances or as ECS Fargate tasks
- **Database scaling:** RDS read replicas for read-heavy search workloads; Aurora PostgreSQL supports auto-scaling
- **AI scaling:** Amazon Bedrock is managed and auto-scales; no capacity planning required for Nova models
- **Mobile scaling:** Expo EAS Build delivers native apps to iOS/Android; push notifications via Expo Notifications backed by APNs/FCM
- **Global deployment:** CloudFront CDN already in architecture; adding additional AWS regions for RDS and EC2 provides multi-region capability

---

## 15. Appendix — Reference & Resources

### 15.1 Amazon Nova Documentation

- **Amazon Nova Developer Guide:** https://nova.amazon.com/dev
- **Amazon Bedrock API Reference:** https://docs.aws.amazon.com/bedrock/
- **Nova 2 Sonic Service Card:** https://docs.aws.amazon.com/ai/responsible-ai/nova-2-sonic/overview.html
- **Nova Multimodal Embeddings Guide:** https://docs.aws.amazon.com/nova/latest/nova2-userguide/embeddings.html
- **Amazon Bedrock boto3 SDK:** https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/bedrock-runtime.html
- **Hackathon Page:** https://amazon-nova.devpost.com

### 15.2 Key Dependencies

| Package | Version | Purpose |
|---|---|---|
| `react-native` | 0.73+ | Core mobile framework |
| `expo` | SDK 50 | Managed workflow; camera, audio, location |
| `expo-av` | 13.x | Audio recording for voice notes |
| `expo-camera` | 14.x | Camera access and photo capture |
| `@aws-amplify/auth` | 6.x | Cognito authentication on mobile and web |
| `zustand` | 4.x | Lightweight state management |
| `fastapi` | 0.110+ | Python async API framework |
| `boto3` | 1.34+ | AWS SDK for Python (Bedrock, S3, Cognito) |
| `sqlalchemy` | 2.0+ | Async ORM for PostgreSQL |
| `alembic` | 1.13+ | Database migration management |
| `pgvector` | 0.6+ | PostgreSQL vector similarity extension |
| `python-jose` | 3.x | JWT validation for Cognito tokens |
| `next` | 14.x | React web framework with App Router |
| `tailwindcss` | 3.x | Utility-first CSS framework |
| `@tanstack/react-query` | 5.x | Server state management for web |
| `recharts` | 2.x | Charts and analytics visualisations |
| `@react-pdf/renderer` | 3.x | PDF report generation in browser |

### 15.3 Environment Variables

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_BEDROCK_ENDPOINT=https://bedrock-runtime.us-east-1.amazonaws.com

# Amazon Nova Model IDs
NOVA_LITE_MODEL_ID=amazon.nova-lite-v2:0
NOVA_SONIC_MODEL_ID=amazon.nova-sonic-v2:0
NOVA_EMBED_MODEL_ID=amazon.nova-embed-multimodal-v1:0

# Database
DATABASE_URL=postgresql+asyncpg://user:pass@rds-endpoint:5432/fieldlens

# AWS Services
S3_BUCKET_NAME=fieldlens-media-prod
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=<app_client_id>

# Application
FRONTEND_URL=https://fieldlens.vercel.app
JWT_SECRET=<stored in AWS Secrets Manager>
ENVIRONMENT=production
```

### 15.4 Hackathon Submission Checklist

- [ ] Project registered on amazon-nova.devpost.com
- [ ] AWS Promotional Credits requested (before March 13, 5pm PT)
- [ ] Code repository shared with `testing@devpost.com` and `Amazon-Nova-hackathon@amazon.com`
- [ ] Demo video uploaded to YouTube/Vimeo (unlisted or public) with `#AmazonNova`
- [ ] Video link added to Devpost submission form
- [ ] Text description written: summary, Nova usage, impact statement
- [ ] Category selected: Multimodal Understanding
- [ ] Submitter type selected: Professional Developer (Individual)
- [ ] Blog post published on builder.aws.com (for $200 AWS Credits bonus prize)
- [ ] Feedback survey completed (for $50 cash prize entry)
- [ ] Submitted before March 16, 2026 @ 5:00pm Pacific Time

---

*FieldLens — Built with Amazon Nova 2 Lite · Nova 2 Sonic · Nova Multimodal Embeddings*
*Iqbal Augmented Intelligence (IAI) · Amazon Nova AI Hackathon 2026*
