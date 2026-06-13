from fastapi import FastAPI

from app.api import routes_agents, routes_evaluation, routes_farm, routes_health, routes_vision, routes_voice

app = FastAPI(title="AgriOS API")

app.include_router(routes_health.router)
app.include_router(routes_farm.router)
app.include_router(routes_agents.router)
app.include_router(routes_vision.router)
app.include_router(routes_voice.router)
app.include_router(routes_evaluation.router)
