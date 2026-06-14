from fastapi import APIRouter

from app.agents.supervisor_agent import run_sensor_anomaly_workflow
from app.demo_store import (
    get_conversation_evaluations,
    get_scorecards as get_demo_scorecards,
    has_latest_trace,
)

router = APIRouter(prefix="/evaluation", tags=["evaluation"])


@router.get("/scorecards")
def get_scorecards():
    if not has_latest_trace():
        run_sensor_anomaly_workflow()
    return get_demo_scorecards()


@router.get("/conversation-runs")
def get_conversation_runs(limit: int = 50):
    return get_conversation_evaluations(limit=max(1, min(limit, 200)))
