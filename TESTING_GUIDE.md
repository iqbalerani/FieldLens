# FieldLens Testing Guide

> **Backend URL:** `https://backend-production-ac05.up.railway.app`
> **Web URL:** `https://fieldlensweb-production.up.railway.app`
> **Mobile URL:** `https://fieldlensmobile-production.up.railway.app` (hosted reference only; Expo Go does not use this)
> **Expo Go Startup:** run the mobile app locally with `EXPO_PUBLIC_API_BASE_URL=https://backend-production-ac05.up.railway.app npx expo start --lan --clear --port 8081`

---

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@fieldlens.local` | `FieldLensAdmin123!` |
| Supervisor | `supervisor@fieldlens.local` | `FieldLensSupervisor123!` |
| Inspector | `inspector@fieldlens.local` | `FieldLensInspector123!` |

---

## 1. Health Check

```bash
curl https://backend-production-ac05.up.railway.app/health
```

**Expected:**
```json
{
  "status": "ok",
  "environment": "production",
  "version": "1.2.0",
  "dependencies": {
    "database": "ok",
    "storage": "ok",
    "bedrock": "ok"
  }
}
```

| Check | Pass Criteria |
|-------|--------------|
| Overall status | `"ok"` (not `"degraded"`) |
| Database | `"ok"` |
| Storage (S3) | `"ok"` |
| Bedrock (AI) | `"ok"` |

---

## 2. Authentication

### 2.1 Login (Valid Credentials)

```bash
curl -X POST https://backend-production-ac05.up.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@fieldlens.local", "password": "FieldLensAdmin123!"}'
```

**Expected:** HTTP 200
```json
{
  "accessToken": "eyJhbG...",
  "tokenType": "bearer",
  "user": {
    "id": "uuid",
    "orgId": "uuid",
    "email": "admin@fieldlens.local",
    "name": "Admin User",
    "role": "ADMIN"
  }
}
```

Save the token for all subsequent requests:
```bash
TOKEN="paste-the-accessToken-here"
```

### 2.2 Login (Invalid Password)

```bash
curl -X POST https://backend-production-ac05.up.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@fieldlens.local", "password": "wrong"}'
```

**Expected:** HTTP 401
```json
{ "detail": "Invalid email or password" }
```

### 2.3 Protected Route Without Token

```bash
curl https://backend-production-ac05.up.railway.app/inspections
```

**Expected:** HTTP 401

### 2.4 Get Current User

```bash
curl https://backend-production-ac05.up.railway.app/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** HTTP 200 with user object (same as login response)

### 2.5 Test All Three Roles

Repeat login for each user. Verify:
- Admin: `role: "ADMIN"`
- Supervisor: `role: "SUPERVISOR"`
- Inspector: `role: "INSPECTOR"`

---

## 3. Inspections

### 3.1 List Inspections

```bash
curl https://backend-production-ac05.up.railway.app/inspections \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** HTTP 200 with array of inspections. Each item:
```json
{
  "id": "uuid",
  "siteName": "string",
  "inspectionType": "string",
  "inspectorName": "string",
  "status": "draft|uploading|submitted|processing|complete|failed",
  "createdAt": "ISO8601",
  "issueCount": 0,
  "criticalCount": 0
}
```

### 3.2 List with Filters

```bash
# Filter by status
curl "https://backend-production-ac05.up.railway.app/inspections?status=complete" \
  -H "Authorization: Bearer $TOKEN"

# Pagination
curl "https://backend-production-ac05.up.railway.app/inspections?limit=2&offset=0" \
  -H "Authorization: Bearer $TOKEN"
```

### 3.3 Create Inspection (Text Only)

```bash
curl -X POST https://backend-production-ac05.up.railway.app/inspections \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "siteName": "Test Building A",
    "inspectionType": "structural",
    "inspectorName": "Admin User",
    "textNotes": "Crack in load-bearing wall. Water stains on ceiling. Emergency exit sign missing.",
    "requestedMedia": []
  }'
```

**Expected:** HTTP 200
```json
{
  "inspectionId": "uuid",
  "uploadTargets": []
}
```

Save the inspection ID:
```bash
INSPECTION_ID="paste-inspectionId-here"
```

### 3.4 Create Inspection (With Photo Upload)

```bash
curl -X POST https://backend-production-ac05.up.railway.app/inspections \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "siteName": "Photo Test Site",
    "inspectionType": "structural",
    "inspectorName": "Admin User",
    "textNotes": "Visible damage on north wall.",
    "requestedMedia": [
      {
        "type": "photo",
        "mimeType": "image/jpeg",
        "sizeBytes": 50000,
        "fileName": "wall-crack.jpg"
      }
    ]
  }'
```

**Expected:** HTTP 200 with `uploadTargets` containing a presigned S3 URL:
```json
{
  "inspectionId": "uuid",
  "uploadTargets": [
    {
      "id": "uuid",
      "type": "photo",
      "s3Key": "inspections/{id}/{uuid}-wall-crack.jpg",
      "uploadUrl": "https://fieldlens-media-prod.s3.amazonaws.com/...",
      "previewUrl": null
    }
  ]
}
```

Upload a photo to the presigned URL:
```bash
curl -X PUT "paste-uploadUrl-here" \
  -H "Content-Type: image/jpeg" \
  --data-binary @/path/to/photo.jpg
```

**Expected:** HTTP 200 (empty response from S3)

### 3.5 Submit Inspection

```bash
curl -X POST https://backend-production-ac05.up.railway.app/inspections/$INSPECTION_ID/submit \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** HTTP 200
```json
{
  "inspectionId": "uuid",
  "status": "submitted"
}
```

### 3.6 Poll Status Until Complete

```bash
# Run repeatedly every 3-5 seconds
curl https://backend-production-ac05.up.railway.app/inspections/$INSPECTION_ID/status \
  -H "Authorization: Bearer $TOKEN"
```

**Expected status transitions:**
```
submitted -> processing -> complete
```

| Status | Meaning |
|--------|---------|
| `submitted` | Queued for AI processing |
| `processing` | Nova Lite analyzing inspection |
| `complete` | AI report generated successfully |
| `failed` | Processing error (check logs) |

Typical processing time: **3-10 seconds** for text-only, **10-30 seconds** with photos.

### 3.7 View Inspection Detail (with AI Report)

```bash
curl https://backend-production-ac05.up.railway.app/inspections/$INSPECTION_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** HTTP 200 with full report:
```json
{
  "id": "uuid",
  "status": "complete",
  "siteName": "Test Building A",
  "report": {
    "summary": "The inspection identified several issues...",
    "overallStatus": "FAIL",
    "confidenceScore": 0.95,
    "issues": [
      {
        "title": "Crack in load-bearing wall",
        "description": "Structural crack observed...",
        "severity": "CRITICAL",
        "affectedArea": "load-bearing wall",
        "suggestedAction": "Engage structural engineer..."
      }
    ],
    "recommendations": ["..."],
    "missingInfo": ["..."],
    "comparisonWithPrior": ""
  }
}
```

| Report Field | Check |
|-------------|-------|
| `summary` | Non-empty string describing findings |
| `overallStatus` | `PASS`, `WARN`, or `FAIL` |
| `confidenceScore` | Number between 0.0 and 1.0 |
| `issues` | Array with `title`, `severity`, `description`, `affectedArea`, `suggestedAction` |
| `severity` values | Only `CRITICAL`, `WARNING`, or `INFO` |
| `recommendations` | Array of strings |

### 3.8 Submit Already-Complete Inspection

```bash
curl -X POST https://backend-production-ac05.up.railway.app/inspections/$INSPECTION_ID/submit \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** HTTP 400 (cannot resubmit)

### 3.9 Non-Existent Inspection

```bash
curl https://backend-production-ac05.up.railway.app/inspections/00000000-0000-0000-0000-000000000000 \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** HTTP 404

---

## 4. Search

### 4.1 Semantic Search

```bash
curl -X POST https://backend-production-ac05.up.railway.app/search \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "structural crack wall damage"}'
```

**Expected:** HTTP 200
```json
[
  {
    "inspection": { "id": "...", "siteName": "...", "status": "..." },
    "similarityScore": 0.8542
  }
]
```

> **Note:** If Nova Embed is not enabled in AWS Bedrock, search returns `[]` (empty array). This is expected behavior - the app gracefully degrades.

### 4.2 Empty Query

```bash
curl -X POST https://backend-production-ac05.up.railway.app/search \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": ""}'
```

**Expected:** HTTP 200 with empty results `[]`

---

## 5. Analytics

### 5.1 Trend Data

```bash
curl https://backend-production-ac05.up.railway.app/analytics/trends \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** HTTP 200
```json
[
  {
    "date": "2026-03-15",
    "totalInspections": 6,
    "criticalIssues": 1,
    "warningIssues": 0,
    "infoIssues": 3
  }
]
```

| Field | Check |
|-------|-------|
| `date` | `YYYY-MM-DD` format |
| `totalInspections` | Matches actual count for that day |
| Issue counts | Sum matches total issues across inspections |

---

## 6. PDF Report Export

```bash
curl https://backend-production-ac05.up.railway.app/reports/$INSPECTION_ID/pdf \
  -H "Authorization: Bearer $TOKEN" \
  -o report.pdf
```

**Expected:**
- HTTP 200
- Valid PDF file downloaded
- Content includes: site info, AI summary, issues with severity, recommendations
- Filename header: `fieldlens-report-{id}.pdf`

---

## 7. Voice Transcription

### 7.1 HTTP Transcribe Endpoint

```bash
curl -X POST https://backend-production-ac05.up.railway.app/voice/transcribe \
  -F "file=@/path/to/audio.wav"
```

**Expected:** HTTP 200
```json
{
  "transcript": "transcribed text here..."
}
```

### 7.2 WebSocket Voice Streaming

Connect to: `wss://backend-production-ac05.up.railway.app/ws/voice/{session-id}`

**Message flow:**
```json
// 1. Client sends start
{"type": "start", "contentType": "audio/wav"}

// 2. Server responds ready
{"type": "ready", "sessionId": "..."}

// 3. Client sends audio chunks
{"type": "audio_chunk", "content": "base64-encoded-audio"}

// 4. Client signals end
{"type": "end"}

// 5. Server responds with transcript
{"type": "completed", "text": "transcribed text..."}
```

---

## 8. Live Feed (Server-Sent Events)

### 8.1 Connect to SSE Stream

First, get your `orgId` from the login response, then:

```bash
curl -N https://backend-production-ac05.up.railway.app/stream/inspections/$ORG_ID?token=$TOKEN
```

**Expected:** Streaming response:
```
event: connected
data: {"type":"connected","orgId":"..."}
```

### 8.2 Test Live Updates

While the SSE stream is open in one terminal, submit a new inspection in another terminal. The stream should receive:

```
event: inspection_submitted
data: {"type":"inspection_submitted","inspectionId":"..."}

event: processing_started
data: {"type":"processing_started","inspectionId":"..."}

event: report_ready
data: {"type":"report_ready","inspectionId":"..."}
```

---

## 9. Web Frontend Testing

### 9.1 Login Page

1. Open `https://fieldlensweb-production.up.railway.app`
2. Should see login form
3. Enter: `admin@fieldlens.local` / `FieldLensAdmin123!`
4. Click Login
5. Should redirect to dashboard

| Check | Pass Criteria |
|-------|--------------|
| Page loads | Login form visible |
| Valid login | Redirects to dashboard |
| Invalid login | Shows error message |
| Empty fields | Shows validation error |

### 9.2 Dashboard

After login, verify:

| Check | Pass Criteria |
|-------|--------------|
| Metrics cards | Shows total inspections, critical issues, processing count |
| Recent inspections | Lists latest inspections with status chips |
| Live feed | Updates when new inspections are submitted |
| User info | Shows logged-in user name/email |

### 9.3 Inspections List

Navigate to `/inspections`:

| Check | Pass Criteria |
|-------|--------------|
| List loads | Shows all inspections |
| Status filter | Dropdown filters by status |
| Pagination | "Load more" or pagination works |
| Click inspection | Opens detail page |
| Status chips | Color-coded (green=complete, red=failed, yellow=processing) |

### 9.4 Inspection Detail

Click any completed inspection:

| Check | Pass Criteria |
|-------|--------------|
| Header | Site name, inspector, date visible |
| Status badge | Shows current status |
| AI Report | Summary, overall status, confidence score displayed |
| Issues list | Each issue shows title, severity, description, affected area |
| Severity colors | CRITICAL=red, WARNING=yellow, INFO=blue |
| Recommendations | Listed if available |
| Media gallery | Photos displayed if uploaded |

### 9.5 Search Page

Navigate to `/search`:

| Check | Pass Criteria |
|-------|--------------|
| Search box | Accepts text input |
| Submit search | Returns results with similarity scores |
| Empty search | Shows no results gracefully |
| Click result | Navigates to inspection detail |

### 9.6 Analytics Page

Navigate to `/analytics`:

| Check | Pass Criteria |
|-------|--------------|
| Chart renders | Shows trend line/bar chart |
| Data points | Match actual inspection dates |
| Issue breakdown | Critical, warning, info counts visible |

---

## 10. Mobile App Testing

### 10.1 Login

1. Open the mobile app
2. Enter: `inspector@fieldlens.local` / `FieldLensInspector123!`
3. Tap Login
4. Should navigate to home screen

### 10.2 Home Screen

| Check | Pass Criteria |
|-------|--------------|
| Inspection list | Shows recent inspections |
| Status chips | Color-coded per status |
| New inspection button | Visible and tappable |
| Pull to refresh | Refreshes list |

### 10.3 New Inspection Wizard

**Step 1 - Site Info:**
| Check | Pass Criteria |
|-------|--------------|
| Site name field | Required, accepts text |
| Inspector name | Pre-filled or editable |
| Inspection type | Dropdown: Construction, Property, Warehouse, NGO, Other |
| GPS button | Requests location permission, fills lat/lon |
| Next button | Advances to step 2 |

**Step 2 - Photos:**
| Check | Pass Criteria |
|-------|--------------|
| Camera button | Opens camera |
| Photo capture | Photo appears in list |
| Delete photo | Removes from list |
| Multiple photos | Can add several |
| Next button | Advances to step 3 |

**Step 3 - Voice:**
| Check | Pass Criteria |
|-------|--------------|
| Mic button | Starts recording (request permission) |
| Recording indicator | Shows waveform / timer |
| Stop button | Stops recording, shows transcript |
| Transcript text | Displayed after processing |
| Next button | Advances to step 4 |

**Step 4 - Notes & Submit:**
| Check | Pass Criteria |
|-------|--------------|
| Text notes field | Optional, multiline |
| Submit button | Starts upload process |
| Progress indicator | Shows upload status |
| Completion | Navigates to status screen |

### 10.4 Submission Status Screen

| Check | Pass Criteria |
|-------|--------------|
| Status updates | Shows: uploading -> submitted -> processing -> complete |
| Report ready | Shows success message |
| View report | Can navigate to inspection detail |
| Failed | Shows error message |

### 10.5 Offline Mode

| Check | Pass Criteria |
|-------|--------------|
| Enable airplane mode | App still navigable |
| Create inspection | Saved locally |
| Submit offline | Added to pending queue |
| Pending count | Shows on home screen |
| Restore network | Auto-syncs pending inspections |

---

## 11. End-to-End Automated Test Script

Copy and run this full automated test:

```bash
#!/bin/bash
set -e
BASE="https://backend-production-ac05.up.railway.app"

echo "=== 1. Health Check ==="
curl -s $BASE/health | python3 -m json.tool

echo ""
echo "=== 2. Login ==="
LOGIN=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fieldlens.local","password":"FieldLensAdmin123!"}')
TOKEN=$(echo $LOGIN | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")
echo "Token: ${TOKEN:0:40}..."

echo ""
echo "=== 3. Get Current User ==="
curl -s $BASE/auth/me -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo ""
echo "=== 4. List Inspections ==="
curl -s "$BASE/inspections?limit=5" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo ""
echo "=== 5. Create Inspection ==="
CREATE=$(curl -s -X POST $BASE/inspections \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "siteName":"Automated Test Site",
    "inspectionType":"structural",
    "inspectorName":"Test Runner",
    "textNotes":"Crack in foundation wall. Rust on exposed rebar. Water pooling near drainage.",
    "requestedMedia":[]
  }')
IID=$(echo $CREATE | python3 -c "import sys,json; print(json.load(sys.stdin)['inspectionId'])")
echo "Inspection ID: $IID"

echo ""
echo "=== 6. Submit Inspection ==="
curl -s -X POST $BASE/inspections/$IID/submit \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo ""
echo "=== 7. Poll Until Complete ==="
for i in $(seq 1 20); do
  sleep 3
  STATUS=$(curl -s $BASE/inspections/$IID/status \
    -H "Authorization: Bearer $TOKEN" | \
    python3 -c "import sys,json; print(json.load(sys.stdin)['status'])")
  echo "  [${i}x3s] Status: $STATUS"
  if [ "$STATUS" = "complete" ] || [ "$STATUS" = "failed" ]; then
    break
  fi
done

echo ""
echo "=== 8. View Report ==="
curl -s $BASE/inspections/$IID \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo ""
echo "=== 9. Search ==="
curl -s -X POST $BASE/search \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"structural crack foundation"}' | python3 -m json.tool

echo ""
echo "=== 10. Analytics ==="
curl -s $BASE/analytics/trends \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

echo ""
echo "=== 11. Wrong Password (expect 401) ==="
curl -s -o /dev/null -w "HTTP %{http_code}" -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fieldlens.local","password":"wrong"}'
echo ""

echo ""
echo "=== 12. No Token (expect 401) ==="
curl -s -o /dev/null -w "HTTP %{http_code}" $BASE/inspections
echo ""

echo ""
echo "=== DONE ==="
```

---

## 12. Quick Reference: Status Flow

```
DRAFT ──> UPLOADING ──> SUBMITTED ──> PROCESSING ──> COMPLETE
  │           │             │
  │           │             └──────────────────────> FAILED
  │           └─ (media/complete)
  └─ (submit directly if no media)
```

---

## 13. Quick Reference: All Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/health` | No | System health check |
| `POST` | `/auth/login` | No | Login, get JWT token |
| `GET` | `/auth/me` | JWT | Get current user info |
| `POST` | `/inspections` | JWT | Create new inspection |
| `GET` | `/inspections` | JWT | List inspections (with filters) |
| `GET` | `/inspections/{id}` | JWT | Get inspection detail + report |
| `GET` | `/inspections/{id}/status` | JWT | Get processing status |
| `POST` | `/inspections/{id}/submit` | JWT | Submit for AI processing |
| `POST` | `/inspections/{id}/media/{mid}/upload` | JWT | Upload media file |
| `POST` | `/inspections/{id}/media/complete` | JWT | Register uploaded media |
| `POST` | `/search` | JWT | Semantic search inspections |
| `GET` | `/analytics/trends` | JWT | Get daily trend data |
| `GET` | `/reports/{id}/pdf` | JWT | Download PDF report |
| `POST` | `/voice/transcribe` | No | Transcribe audio file |
| `WS` | `/ws/voice/{sessionId}` | No | Stream voice for live transcription |
| `GET` | `/stream/inspections/{orgId}` | JWT | SSE live feed |

---

## 14. Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Health shows `"degraded"` | One or more dependencies failing | Check `dependencies` object for which one |
| Storage: `"error: 404"` | Wrong S3 bucket name | Update `S3_BUCKET_NAME` in Railway |
| Login returns 401 | Wrong password or user not seeded | Verify `SEED_DEFAULT_USERS=true` in Railway |
| Inspection stuck on `submitted` | Backend processing slow or errored | Check Railway logs for exceptions |
| Inspection goes to `failed` | AI processing error | Check Railway logs for `AIServiceError` |
| Search returns empty `[]` | Nova Embed not enabled in AWS | Enable Nova Multimodal Embeddings in Bedrock |
| Web shows blank page | Wrong `NEXT_PUBLIC_API_BASE_URL` | Update in Railway web service + redeploy |
| CORS errors in browser | Missing origin in CORS config | Check `CORS_ORIGINS_RAW` in backend variables |
| Presigned URL expired | URL older than 1 hour | Re-fetch inspection detail for fresh URLs |
