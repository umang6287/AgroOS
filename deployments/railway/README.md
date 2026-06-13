# Railway Deployment

Deploy the backend from the `backend/` directory.

Recommended settings:

- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Environment variables:
  - `OPENAI_API_KEY`
  - `DATABASE_URL`
  - `DEMO_MODE`
  - communication provider keys as needed
