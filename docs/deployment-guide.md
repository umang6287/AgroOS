# Deployment Guide

Recommended deployment keeps the frontend and backend as separate services:

- Frontend: Vercel project rooted at `frontend/`
- Backend: Railway service rooted at `backend/`

The repository also includes root-level Railway files for the fallback case where
Railway is connected to the repository root.

## Frontend On Vercel

Project root:

```text
frontend
```

Build settings:

```text
Install command: npm install
Build command: npm run build
Output directory: .next
```

Required environment variables:

```text
NEXT_PUBLIC_API_BASE_URL=https://your-railway-backend-url
NEXT_PUBLIC_WS_URL=wss://your-railway-backend-url/ws/farm
```

Notes:

- Tailwind is part of the frontend build and should not be removed for Vercel.
- The command center can render local mock fallback data when the backend is
  temporarily unreachable.
- The backend health badge uses `NEXT_PUBLIC_API_BASE_URL/health`.
- The OpenAI configuration panel talks only to backend `/ai/config/*` routes; do
  not add OpenAI keys to Vercel environment variables.

## Backend On Railway

Preferred Railway root:

```text
backend
```

Start command:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

Required environment variables:

```text
FRONTEND_URL=https://your-vercel-frontend-url
CORS_ORIGINS=
DEMO_MODE=true
DATABASE_URL=sqlite:///./agrios.db
SIMULATION_TICK_SECONDS=60
SIMULATION_RETENTION_MINUTES=60
OPENAI_LIVE_ENABLED=true
AGRIOS_OPENAI_TIMEOUT_SECONDS=8
```

Optional provider variables should stay backend-only. Do not expose API keys,
communication credentials, or model provider secrets to the frontend.

Optional OpenAI variables:

```text
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.2
OPENAI_STT_MODEL=gpt-4o-mini-transcribe
OPENAI_TTS_MODEL=gpt-4o-mini-tts
OPENAI_TTS_VOICE=alloy
```

SQLite notes:

- The simulation engine writes recent ticks to `simulation_events`.
- `AGRIOS_SIMULATION_DB_PATH=/data/agrios.db` can be used when the host provides
  a persistent volume.
- Without a persistent volume, simulation history may reset on deploy or restart;
  the deterministic simulator will repopulate the current demo state.

## Local Development

Backend:

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Create `frontend/.env.local`:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/farm
```

Create or copy `backend/.env` when running the backend locally:

```text
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=
DEMO_MODE=true
DATABASE_URL=sqlite:///./agrios.db
SIMULATION_TICK_SECONDS=60
SIMULATION_RETENTION_MINUTES=60
OPENAI_API_KEY=
OPENAI_LIVE_ENABLED=true
```

## Smoke Checks

- `npm run build` from `frontend/`
- `python -c "import sys; sys.path.insert(0, 'backend'); import main; print('backend import ok')"`
- `GET /health` should return `{ "status": "ok", "service": "agrios-api" }`
- `GET /farm/state` should include `zones`, `robots`, `assets`, `latestTelemetry`, and `simulation`.
- `GET /simulation/status` should return `latestEventId` beginning with `evt-sim-`.
- `GET /ai/config/status` should return configuration metadata without an API key.
- `WS /ws/farm` should emit `simulation.tick` events.

Backend tests require dev dependencies:

```bash
python -m pip install -r backend/requirements-dev.txt
python -m pytest
```
