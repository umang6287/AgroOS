# AgriOS Autonomous Farm

AgriOS is an AI-native farm operations system. This repo is currently prepared for the first deployment smoke test only: a minimal Next.js frontend calls a minimal FastAPI backend `/health` endpoint.

## Repository Layout

- `frontend/`: Next.js command center and demo UI.
- `backend/`: FastAPI API, WebSocket stream, simulator, agents, services, and storage-ready models.
- `docs/`: API contracts, workflows, demo fallbacks, screenshots, diagrams, and deployment notes.
- `deployments/`: Vercel and Railway deployment instructions.
- `scripts/`: Local setup, demo asset seeding, and helper scripts.
- `Prompts/`: Agent and implementation prompts for parallel workstreams.

## Local Development

Backend:

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Health check:

```bash
curl http://localhost:8000/health
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Set the frontend backend URL in `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## Deployment Smoke Test

### Vercel Frontend

Deploy `frontend/` as the Vercel project root.

Environment variable:

```text
NEXT_PUBLIC_API_BASE_URL=https://your-railway-backend-url
```

Build settings:

```text
Build command: npm run build
Output: .next
Install command: npm install
```

### Railway Backend

Preferred setup: deploy `backend/` as the Railway service root.

Start command:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

Environment variables:

```text
FRONTEND_URL=https://your-vercel-frontend-url
CORS_ORIGINS=
DEMO_MODE=true
```

The backend also includes `backend/railway.json` with the same start command.

Fallback setup: if Railway is connected to the repository root instead of `backend/`, the root `railway.json`, `nixpacks.toml`, and `Procfile` tell Railway to install `backend/requirements.txt` and start the API from `backend/`.

## Scope

Do not treat the current app as the real AgriOS implementation. Farm simulator, agents, voice, vision, communication, memory, and evaluation are intentionally stubbed until the first deployment path is proven.
