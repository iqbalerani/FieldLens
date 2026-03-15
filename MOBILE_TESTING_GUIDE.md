# FieldLens Mobile App — End-to-End Testing Guide

## Prerequisites

- Android or iOS phone with **Expo Go** installed
- Mac running Expo dev server
- Phone and Mac on the same Wi-Fi network or personal hotspot
- Backend deployed on Railway: `https://backend-production-ac05.up.railway.app`
- Use **one Expo session at a time** for this app. Do not keep `--lan` and `--tunnel` servers running together.

## Starting the Dev Server

```bash
cd apps/mobile
lsof -ti :8081 -ti :8082 | xargs kill
EXPO_PUBLIC_API_BASE_URL=https://backend-production-ac05.up.railway.app npx expo start --lan --clear --port 8081
```

Open Expo Go and scan the LAN QR code shown in the terminal.
When debugging Android startup, make sure the opened bundle host is your LAN/local server and not a `*.exp.direct` tunnel URL.

From the repo root, the equivalent command is:

```bash
EXPO_PUBLIC_API_BASE_URL=https://backend-production-ac05.up.railway.app npm run dev:mobile
```

If LAN is not possible, use tunnel mode only as a fallback:

```bash
EXPO_PUBLIC_API_BASE_URL=https://backend-production-ac05.up.railway.app npx expo start --tunnel --clear --port 8081
```

The Railway backend powers the API calls, but Expo Go must connect to your local Expo server for the QR code and bundle.
If you switch between LAN and tunnel, stop both old Expo sessions first and restart with only the mode you intend to use.

---

## Test Scenarios

### 1. Authentication

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1.1 | App loads | Login screen appears with FieldLens branding |
| 1.2 | Tap "Continue" with pre-filled credentials | Logs in, navigates to Home screen |
| 1.3 | Check Home screen | Shows "Field operations" header, list of existing inspections with status chips |
| 1.4 | Check bottom tabs | 4 tabs visible: Home, Capture, History, Settings |

**Test credentials:**
- Inspector: `inspector@fieldlens.local` / `FieldLensInspector123!`
- Admin: `admin@fieldlens.local` / `FieldLensAdmin123!`
- Supervisor: `supervisor@fieldlens.local` / `FieldLensSupervisor123!`

### 2. Create New Inspection (Full Flow)

#### Step 1/5 — Site Info
| Step | Action | Expected Result |
|------|--------|-----------------|
| 2.1 | Tap "Capture" tab (or "New inspection" button) | Shows New Inspection wizard, Step 1/5 |
| 2.2 | Enter site name (e.g., "Test Building A") | Text appears in field |
| 2.3 | Inspector name is pre-filled | Shows "Indigo Inspector" |
| 2.4 | Select inspection type | Tap a pill (Construction, Property, etc.) — orange highlight |
| 2.5 | Tap "Use current location" | Phone requests GPS permission, shows lat/lng |
| 2.6 | Tap "Next" | Advances to Step 2/5 |

#### Step 2/5 — Photos
| Step | Action | Expected Result |
|------|--------|-----------------|
| 2.7 | Tap "Capture photo" | Camera opens |
| 2.8 | Take a photo | Photo card appears with filename and size |
| 2.9 | Take 2-3 more photos | All listed with "X photos captured" counter |
| 2.10 | Tap X on a photo | Photo removed from list |
| 2.11 | Tap "Next" | Advances to Step 3/5 |

#### Step 3/5 — Voice Recording
| Step | Action | Expected Result |
|------|--------|-----------------|
| 2.12 | Tap "Record voice note" | Button turns red, timer starts |
| 2.13 | Speak: "I can see cracks in the east wall. Water damage on the ceiling near the stairwell." | Waveform animation shows, timer counts up |
| 2.14 | Tap "Stop" | Button shows "Transcribing..." then transcript appears |
| 2.15 | If transcript appears, tap "Use this transcript" | Transcript saved to draft |
| 2.16 | Alternatively, type text in the transcript box manually | Text saved |
| 2.17 | Tap "Next" | Advances to Step 4/5 |

**Note:** Voice transcription uses Nova Sonic via WebSocket. If the WebSocket fails, it falls back to a REST endpoint. If both fail, just type the transcript manually.

#### Step 4/5 — Text Notes
| Step | Action | Expected Result |
|------|--------|-----------------|
| 2.18 | Type additional notes | Text appears in the input |
| 2.19 | Tap "Next" | Advances to Step 5/5 |

#### Step 5/5 — Review & Submit
| Step | Action | Expected Result |
|------|--------|-----------------|
| 2.20 | Review all fields | Site, Inspector, Type, GPS, Photos count, Transcript, Notes all shown |
| 2.21 | Tap "Submit inspection" | Shows SubmissionStatus screen |

### 3. Submission & AI Processing

| Step | Action | Expected Result |
|------|--------|-----------------|
| 3.1 | Observe status chip | Shows "submitted" initially |
| 3.2 | Tap "Refresh status" | Status updates (submitted -> processing -> complete) |
| 3.3 | Status reaches "complete" | Nova Lite AI has generated the report |
| 3.4 | Tap "Open inspection detail" | Shows full AI report |

### 4. Inspection Detail (AI Report)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 4.1 | Summary section | AI-generated summary of findings |
| 4.2 | Issues section | List of issues with severity chips (CRITICAL/WARNING/INFO) |
| 4.3 | Each issue shows | Title, description, severity badge |
| 4.4 | Overall status chip | PASS / WARN / FAIL with color coding |

### 5. History & Navigation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 5.1 | Tap "History" tab | Shows all past inspections |
| 5.2 | Tap any inspection | Opens detail view with report |
| 5.3 | Tap back arrow | Returns to list |

### 6. Settings

| Step | Action | Expected Result |
|------|--------|-----------------|
| 6.1 | Tap "Settings" tab | Shows settings screen |
| 6.2 | Logout | Returns to login screen |

### 7. Offline Mode

| Step | Action | Expected Result |
|------|--------|-----------------|
| 7.1 | Turn off WiFi/data | Phone goes offline |
| 7.2 | Create a new inspection and submit | Alert: "Saved offline — will sync when reconnected" |
| 7.3 | Turn WiFi/data back on | Pending inspection syncs automatically |

---

## What Backend Processes Happen During Submission

When you tap "Submit inspection", this is the full flow:

```
Mobile App                      Backend (Railway)                 AWS
─────────                       ─────────────────                 ───
POST /inspections            →  Creates inspection + S3 pre-signed URLs
                             ←  Returns inspectionId + uploadTargets

PUT to S3 pre-signed URL     →  ─────────────────────────────── → S3 upload
(for each photo)

POST /inspections/{id}/      →  Registers media S3 keys
     media/complete          ←  Returns updated inspection

POST /inspections/{id}/      →  Sets status=submitted
     submit                     Triggers background processing:
                                1. Find similar inspections (pgvector)
                                2. Call Nova Lite AI → generate report
                                3. Call Nova Embed → create embedding
                                4. Save issues to DB
                                5. Set status=complete
                             ←  Returns {status: "submitted"}

GET /inspections/{id}/status →  Poll for status updates
                             ←  {status: "complete"}

GET /inspections/{id}        →  Full detail with AI report
                             ←  Report with issues, severity, recommendations
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| App shows red error screen | Kill old Expo servers with `lsof -ti :8081 -ti :8082 | xargs kill`, start only `npx expo start --lan --clear --port 8081`, then reopen Expo Go from the LAN QR code |
| "Network request failed" | Check EXPO_PUBLIC_API_BASE_URL is set correctly |
| Camera doesn't open | Grant camera permission in phone settings |
| Voice recording fails | Grant microphone permission in phone settings |
| Inspection stays "failed" | Check Railway backend logs for the error |
| Photos don't upload | Check S3_BUCKET_NAME is `fieldlens-media-prod` in Railway |
| Login fails | Verify credentials, check backend health endpoint |

If the phone cannot stay on the same network as your Mac, retry with `--tunnel`, but expect slower and less reliable startup than LAN mode.
If Expo Go opens a bundle URL on `*.exp.direct`, you are using the tunnel path rather than the preferred LAN path.

---

## Quick Health Check

Before testing, verify backend is healthy:

```bash
curl https://backend-production-ac05.up.railway.app/health
```

Expected:
```json
{
  "status": "ok",
  "dependencies": {
    "database": "ok",
    "storage": "ok",
    "bedrock": "ok"
  }
}
```
