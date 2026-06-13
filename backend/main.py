import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import routes_agents, routes_evaluation, routes_farm, routes_health, routes_vision, routes_voice

app = FastAPI(title="AgriOS API")

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
extra_origins = os.getenv("CORS_ORIGINS", "")
allowed_origins = [frontend_url]
allowed_origins.extend(origin.strip() for origin in extra_origins.split(",") if origin.strip())

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes_health.router)
app.include_router(routes_farm.router)
app.include_router(routes_agents.router)
app.include_router(routes_vision.router)
app.include_router(routes_voice.router)
app.include_router(routes_evaluation.router)
