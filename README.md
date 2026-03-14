# FieldLens

FieldLens is a hackathon-focused AI-powered inspection platform with:

- `apps/backend`: FastAPI API, AI orchestration, SSE, and voice WebSocket proxy
- `apps/web`: Next.js dashboard for live inspection monitoring and search
- `apps/mobile`: Expo React Native capture experience for inspectors
- `packages/shared`: shared TypeScript types used by web and mobile

## Quick start

1. Copy `.env.example` to `.env`.
2. Start Postgres with pgvector:

```bash
docker compose up db
```

3. Install JavaScript dependencies:

```bash
npm install
```

4. Create a Python virtual environment and install backend dependencies:

```bash
cd apps/backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

5. Run database migrations:

```bash
cd apps/backend
alembic upgrade head
```

6. Run the apps:

```bash
# backend
cd apps/backend
uvicorn app.main:app --reload

# web
npm run dev:web

# mobile
npm run dev:mobile
```

## Runtime modes

- `AUTH_MODE=jwt` enables FastAPI-issued access tokens via `POST /auth/login`.
- `AUTH_MODE=demo` keeps local token-only access available for quick scaffolding.
- `AI_MODE=bedrock` uses Amazon Nova via Bedrock; `AI_MODE=mock` stays available for local development only.
- `STORAGE_MODE=s3` returns presigned S3 uploads; `STORAGE_MODE=local` keeps backend uploads on disk for local work.

## Production contract

Hosted deployments are expected to use:

- Neon Postgres via `DATABASE_URL=postgresql+asyncpg://...`
- Amazon Bedrock in `us-east-1` with Nova model IDs from `.env.example`
- S3 media storage via `S3_BUCKET_NAME`
- JWT auth via `JWT_SECRET_KEY`
- Railway service env vars `NEXT_PUBLIC_API_BASE_URL` and `EXPO_PUBLIC_API_BASE_URL`

Use `Dockerfile.backend` and `Dockerfile.web` when creating separate Railway services for the API and dashboard. Use `apps/mobile/eas.json` to build an Android AAB for Play Internal Testing.
