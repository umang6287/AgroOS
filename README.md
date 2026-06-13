# AgriOS Autonomous Farm

AgriOS is an AI-native farm operations system for monitoring farm telemetry, analyzing crop images, coordinating autonomous actions, communicating with farmers, verifying outcomes, and evaluating agent behavior.

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

Frontend:

```bash
cd frontend
npm install
npm run dev
```

