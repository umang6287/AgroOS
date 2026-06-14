import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import (
    routes_agents,
    routes_ai_config,
    routes_auth,
    routes_communication,
    routes_evaluation,
    routes_farm,
    routes_health,
    routes_simulation,
    routes_vision,
    routes_voice,
)
from app.simulation.engine import start_simulation_loop, stop_simulation_loop
from app.websocket import farm_stream


@asynccontextmanager
async def lifespan(_app: FastAPI):
    start_simulation_loop()
    yield
    await stop_simulation_loop()


app = FastAPI(title="AgriOS API", lifespan=lifespan)

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
extra_origins = os.getenv("CORS_ORIGINS", "")
allowed_origins = [
    frontend_url,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]
allowed_origins.extend(origin.strip() for origin in extra_origins.split(",") if origin.strip())
allowed_origins = list(dict.fromkeys(allowed_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^(https://.*\.vercel\.app|http://localhost:\d+|http://127\.0\.0\.1:\d+)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes_health.router)
app.include_router(routes_auth.router)
app.include_router(routes_ai_config.router)
app.include_router(routes_farm.router)
app.include_router(routes_agents.router)
app.include_router(routes_communication.router)
app.include_router(routes_vision.router)
app.include_router(routes_voice.router)
app.include_router(routes_evaluation.router)
app.include_router(routes_simulation.router)
app.include_router(farm_stream.router)
