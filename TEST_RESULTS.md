# FieldLens Test Results

## Run Date / Environment
- Run completed: `2026-03-13 14:31:51 +05:00`
- Workspace: `C:\Users\DELL\Downloads\FieldLens`
- Mode: local demo smoke
- Environment used:
  - `AUTH_MODE=demo`
  - `AI_MODE=mock`
  - `STORAGE_MODE=local`
  - `DATABASE_URL=sqlite+aiosqlite:///./fieldlens.db`
  - `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`
  - `EXPO_PUBLIC_API_BASE_URL=http://localhost:8000`

## Commands Executed
1. `npm install`
2. `python -m pip install -r requirements.txt` in `apps/backend`
3. `python -m pytest tests -q` in `apps/backend`
4. Live backend API smoke via `curl.exe`
5. `npm run typecheck --workspace @fieldlens/shared`
6. `npm run typecheck --workspace @fieldlens/web`
7. `npm run build --workspace @fieldlens/web`
8. Web runtime checks with `curl.exe`, Playwright, and `next start`
9. `.\node_modules\.bin\tsc.cmd -p apps/mobile/tsconfig.json --noEmit`
10. `npx expo start --non-interactive --port 8081`
11. Metro verification with `curl.exe http://127.0.0.1:8081/status`

## Backend Startup Result
- Backend API was reachable on `http://localhost:8000`.
- `netstat` showed port `8000` listening with PID `6732`.
- A later explicit startup attempt failed because the port was already in use:

```text
ERROR:    [Errno 10048] error while attempting to bind on address ('0.0.0.0', 8000): [winerror 10048] only one usage of each socket address (protocol/network address/port) is normally permitted
```

- Practical outcome: backend runtime was available and usable for all live API tests.

## Backend Pytest Result
- Result: `PASS`
- Command: `python -m pytest tests -q`
- Output:

```text
..                                                                       [100%]
2 passed in 1.51s
```

## Curl / API Results
- Auth header used: `Authorization: Bearer demo-inspector`
- Created inspection ID: `f556b95d-7862-4da1-8a17-27a4e3faf11f`

| Endpoint | Method | Status | Result |
|---|---|---:|---|
| `/health` | `GET` | `200` | `{"status":"ok"}` |
| `/auth/me` | `GET` | `200` | Demo inspector profile returned |
| `/inspections` | `POST` | `200` | Inspection created successfully |
| `/inspections/{id}/media/complete` | `POST` | `200` | Transcript attached; inspection moved to `submitted` |
| `/inspections/{id}/submit` | `POST` | `200` | Background processing triggered |
| `/inspections/{id}/status` | `GET` | `200` | Final state reached `complete` |
| `/inspections` | `GET` | `200` | Inspection listed with summary and severity counts |
| `/inspections/{id}` | `GET` | `200` | Full report returned |
| `/search` | `POST` | `200` | Semantic result returned with similarity score |
| `/analytics/trends` | `GET` | `200` | Trend point returned |

### Key Response Excerpts
- `/auth/me`

```json
{"id":"8e04fd4a-3862-4b42-93af-d32383845279","org_id":"demo-org","email":"inspector@fieldlens.local","name":"Indigo Inspector","role":"INSPECTOR"}
```

- `/inspections/{id}/status`

```json
{"inspectionId":"f556b95d-7862-4da1-8a17-27a4e3faf11f","status":"complete"}
```

- `/inspections/{id}` summary

```json
{
  "summary": "Warehouse inspection for Warehouse North recorded by Indigo Inspector. 2 issue(s) identified from transcript and notes.",
  "overallStatus": "FAIL",
  "criticalCount": 1
}
```

- `/search`

```json
[{"inspection":{"id":"f556b95d-7862-4da1-8a17-27a4e3faf11f"},"similarityScore":0.1581}]
```

- `/analytics/trends`

```json
[{"date":"2026-03-13","totalInspections":1,"criticalIssues":1,"warningIssues":1,"infoIssues":0}]
```

## Web Results

### Shared Typecheck
- Result: `PASS`
- Command: `npm run typecheck --workspace @fieldlens/shared`

### Web Typecheck
- Result: `FAIL`
- Command: `npm run typecheck --workspace @fieldlens/web`
- Failure type: tooling/config
- Exact failing output:

```text
error TS6053: File 'C:/Users/DELL/Downloads/FieldLens/apps/web/.next/types/app/(auth)/login/page.ts' not found.
error TS6053: File 'C:/Users/DELL/Downloads/FieldLens/apps/web/.next/types/app/(dashboard)/analytics/page.ts' not found.
error TS6053: File 'C:/Users/DELL/Downloads/FieldLens/apps/web/.next/types/app/(dashboard)/dashboard/page.ts' not found.
error TS6053: File 'C:/Users/DELL/Downloads/FieldLens/apps/web/.next/types/app/(dashboard)/inspections/[id]/page.ts' not found.
error TS6053: File 'C:/Users/DELL/Downloads/FieldLens/apps/web/.next/types/app/(dashboard)/inspections/page.ts' not found.
error TS6053: File 'C:/Users/DELL/Downloads/FieldLens/apps/web/.next/types/app/(dashboard)/search/page.ts' not found.
error TS6053: File 'C:/Users/DELL/Downloads/FieldLens/apps/web/.next/types/app/layout.ts' not found.
error TS6053: File 'C:/Users/DELL/Downloads/FieldLens/apps/web/.next/types/app/page.ts' not found.
error TS6053: File 'C:/Users/DELL/Downloads/FieldLens/apps/web/.next/types/link.d.ts' not found.
```

### Web Production Build
- Result: `PASS`
- Command: `npm run build --workspace @fieldlens/web`
- Next.js built successfully and emitted routes for `/login`, `/dashboard`, `/inspections`, `/search`, and `/analytics`.

### Web Runtime / Browser Smoke
- Result: `PARTIAL / UNSTABLE`
- Observations:
  - Port `3000` was listening, but `curl.exe -I http://127.0.0.1:3000/login` timed out.
  - A separate process on port `3001` returned `HTTP/1.1 200 OK` for `HEAD /login`.
  - Playwright timed out trying to load `/login` on both `3000` and `3001`.
  - A direct production start attempt on `3002` failed even though a prior build had succeeded.

- Evidence:

```text
HTTP/1.1 200 OK
X-Powered-By: Next.js
Content-Type: text/html; charset=utf-8
```

- Playwright failure:

```text
TimeoutError: page.goto: Timeout 10000ms exceeded.
- navigating to "http://127.0.0.1:3001/login", waiting until "domcontentloaded"
```

- `next start` failure:

```text
Error: Could not find a production build in the '.next' directory. Try building your app with 'next build' before starting the production server.
```

- Interpretation:
  - The app builds successfully, but the local dev/runtime startup path is inconsistent and needs follow-up.
  - This looks more like runtime/process/config drift than a compile failure in the application code itself.

## Mobile Results

### Mobile Typecheck
- Result: `PASS`
- Command: `.\node_modules\.bin\tsc.cmd -p apps/mobile/tsconfig.json --noEmit`

### Expo / Metro Smoke
- Result: `PASS`
- Command: `npx expo start --non-interactive --port 8081`
- The Expo command timed out because it is a long-lived dev server, but Metro came up successfully.
- Evidence:
  - `netstat` showed port `8081` listening with PID `21640`
  - `curl.exe http://127.0.0.1:8081/status` returned:

```text
packager-status:running
```

- Additional headers confirmed Expo/Metro ownership of the port:

```text
expo-protocol-version: 0
X-React-Native-Project-Root: C:\Users\DELL\Downloads\FieldLens\apps\mobile
```

## Failures, Warnings, and Blockers
- `apps/web` standalone typecheck is failing because `tsconfig.json` includes `.next/types/**/*.ts`, but several referenced generated files are missing.
- Web dev/runtime behavior is unstable:
  - `3000` listened but did not respond cleanly.
  - `3001` served `HEAD` responses but browser automation still timed out.
  - `next start` on `3002` could not find `BUILD_ID` inside `.next`.
- Backend runtime was already alive during testing, which caused a later explicit startup attempt to fail on port bind. This did not block API validation.
- Optional live checks were not completed:
  - SSE event stream validation
  - WebSocket transcript echo validation

## Overall Pass / Fail Summary
- Backend startup availability: `PASS`
- Backend pytest suite: `PASS`
- Backend curl/API smoke: `PASS`
- Shared typecheck: `PASS`
- Web typecheck: `FAIL`
- Web production build: `PASS`
- Web runtime/browser smoke: `PARTIAL / FAIL`
- Mobile typecheck: `PASS`
- Mobile Expo smoke: `PASS`

## Final Assessment
- Overall status: `PARTIAL PASS`
- The backend and mobile smoke path are healthy enough for local demo/testing.
- The web app compiles and builds, but its local runtime/startup behavior is inconsistent and is the main blocker before calling the full application run fully green.
