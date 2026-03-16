# FieldLens

**AI-powered field inspection and reporting platform** — built for the Amazon Nova AI Hackathon 2026.

FieldLens enables field workers to capture inspections from their mobile devices (photos, voice, text) and automatically generates structured reports visible in real time on a web dashboard. All AI processing runs exclusively through Amazon Bedrock using three Nova models.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              MOBILE APP  (React Native / Expo)           │
│     Camera  |  Voice  |  Text  |  Location              │
└────────────────────────┬────────────────────────────────┘
                         │  HTTPS / REST
                         ▼
┌─────────────────────────────────────────────────────────┐
│              BACKEND API  (FastAPI on Railway)           │
│  Auth (JWT) · Inspections · Reports · Search · Voice    │
│  Amazon Nova 2 Lite · Nova 2 Sonic · Nova Embeddings    │
└────────────────────────┬────────────────────────────────┘
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
    AWS S3 Media    Amazon Bedrock    Neon Postgres
    (us-east-1)     (us-east-1)      + pgvector
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              WEB DASHBOARD  (Next.js on Railway)         │
│   Live inspection feed · Semantic search · Analytics    │
└─────────────────────────────────────────────────────────┘
```

---

## Monorepo structure

| Path | Description |
|---|---|
| `apps/backend` | FastAPI API — AI orchestration, SSE, voice WebSocket proxy |
| `apps/web` | Next.js dashboard — live inspection monitoring and search |
| `apps/mobile` | Expo React Native — field capture experience |
| `packages/shared` | Shared TypeScript types used by web and mobile |

---

## Tech stack

| Layer | Technology |
|---|---|
| Mobile | Expo / React Native (TypeScript) |
| Web | Next.js 14 (TypeScript) |
| Backend | Python 3.12, FastAPI, SQLAlchemy, Alembic |
| AI | Amazon Nova 2 Lite (reports), Nova 2 Sonic (voice), Nova Embeddings (search) |
| Database | Neon Postgres + pgvector (semantic search) |
| Storage | Amazon S3 (media), local disk (dev) |
| Auth | JWT (production), demo token (local) |
| Deployment | Railway (backend + web), Expo EAS (mobile) |

---

## Local setup

### Prerequisites

- Node.js 20+, npm 10+
- Python 3.12+
- Docker (for the local Postgres instance)
- AWS credentials with Bedrock access in `us-east-1` (only needed if `AI_MODE=bedrock`)

### 1. Environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 2. Start Postgres with pgvector

```bash
docker compose up db
```

### 3. Install JavaScript dependencies

```bash
npm install
```

### 4. Install Python dependencies

```bash
cd apps/backend
python -m venv .venv
source .venv/bin/activate        # macOS/Linux
# .venv\Scripts\activate         # Windows
pip install -r requirements.txt
```

### 5. Run database migrations

```bash
cd apps/backend
alembic upgrade head
```

### 6. Run all apps

```bash
# Terminal 1 — backend
cd apps/backend
uvicorn app.main:app --reload

# Terminal 2 — web dashboard
npm run dev:web

# Terminal 3 — mobile (LAN, for Expo Go on same Wi-Fi)
npm run dev:mobile
```

### Mobile tips

- `npm run dev:mobile` starts Expo over LAN on port `8081`. Your phone and computer must be on the same Wi-Fi or hotspot.
- To target the deployed Railway backend instead of local:

```bash
# Kill any stale Expo sessions first
lsof -ti :8081 -ti :8082 | xargs kill

EXPO_PUBLIC_API_BASE_URL=https://backend-production-ac05.up.railway.app npm run dev:mobile
```

- If the Expo Go bundle host shows `*.exp.direct`, the app is using the tunnel path instead of LAN — reconnect on the same network.

---

## Runtime modes

| Variable | Values | Notes |
|---|---|---|
| `AUTH_MODE` | `jwt` / `demo` | `jwt` enables FastAPI-issued tokens via `POST /auth/login`; `demo` uses a local static token |
| `AI_MODE` | `bedrock` / `mock` | `mock` is safe for local dev without AWS credentials |
| `STORAGE_MODE` | `s3` / `local` | `local` stores uploads on disk |
| `RUN_MIGRATIONS_ON_STARTUP` | `true` / `false` | Runs `alembic upgrade head` before demo-user seeding on boot |

---

## Database and schema notes

- Hosted first boot requires either `alembic upgrade head` ahead of time or `RUN_MIGRATIONS_ON_STARTUP=true`.
- Starting against an empty database without migrations fails before `/health`:
  > `Database schema is not initialized; run Alembic or set RUN_MIGRATIONS_ON_STARTUP=true`
- For local schema tests, set `ENVIRONMENT=development` to avoid triggering the production runtime contract.

---

## Production deployment

Hosted deployments use:

| Resource | Config |
|---|---|
| Database | Neon Postgres via `DATABASE_URL=postgresql+asyncpg://...` |
| AI | Amazon Bedrock `us-east-1`, Nova model IDs from `.env.example` |
| Storage | S3 via `S3_BUCKET_NAME` |
| Auth | JWT via `JWT_SECRET_KEY` |
| Backend URL | `NEXT_PUBLIC_API_BASE_URL` and `EXPO_PUBLIC_API_BASE_URL` (Railway env vars) |

Use `Dockerfile.backend` and `Dockerfile.web` to create separate Railway services for the API and dashboard. Use `apps/mobile/eas.json` to build an Android AAB for Play Internal Testing.

---

## API overview

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/login` | Obtain JWT access token |
| `GET/POST` | `/inspections` | List and create inspections |
| `GET` | `/reports/{id}` | Fetch generated report |
| `GET` | `/stream/{id}` | SSE stream for live report generation |
| `POST` | `/search` | Semantic vector search across inspections |
| `WS` | `/voice/ws` | Voice WebSocket proxy (Nova 2 Sonic) |
| `GET` | `/analytics` | Inspection and issue analytics |
| `GET` | `/health` | Health check |
