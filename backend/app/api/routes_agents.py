from fastapi import APIRouter

from app.agents.supervisor_agent import run_sensor_anomaly_workflow
from app.demo_store import get_latest_trace, has_latest_trace

router = APIRouter(prefix="/agents", tags=["agents"])


@router.get("/trace")
def get_agent_trace(language: str = "en"):
    if not has_latest_trace():
        return run_sensor_anomaly_workflow(language=language)
    return get_latest_trace()
