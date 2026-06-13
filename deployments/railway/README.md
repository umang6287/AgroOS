# Railway Deployment

Deploy the backend from the `backend/` directory.

Recommended settings:

- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Environment variables:
  - `DEMO_MODE`
  - `FRONTEND_URL`
  - `CORS_ORIGINS`

For the first smoke test, do not configure API keys. The only required endpoint is `GET /health`.
