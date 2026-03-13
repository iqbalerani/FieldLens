# FieldLens

FieldLens is a hackathon-focused AI-powered inspection platform with:

- `apps/backend`: FastAPI API, AI orchestration, SSE, and voice WebSocket proxy
- `apps/web`: Next.js dashboard for live inspection monitoring and search
- `apps/mobile`: Expo React Native capture experience for inspectors
- `packages/shared`: shared TypeScript types used by web and mobile

## Quick start

1. Copy `.env.example` to `.env`.
2. Start the backend dependencies:

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

5. Run the apps:

```bash
# backend
cd apps/backend
uvicorn app.main:app --reload

# web
npm run dev:web

# mobile
npm run dev:mobile
```

## Modes

- `AUTH_MODE=demo` lets the apps run locally without Cognito.
- `AI_MODE=mock` returns deterministic inspection reports for local development.
- `STORAGE_MODE=local` skips S3 presigned uploads and stores media metadata only.

