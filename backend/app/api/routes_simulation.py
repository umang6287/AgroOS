from fastapi import APIRouter, Query

from app.simulation.engine import get_recent_simulation_events, get_simulation_status, reset_simulation_events

router = APIRouter(prefix="/simulation", tags=["simulation"])


@router.get("/status")
def simulation_status():
    return get_simulation_status()


@router.get("/events")
def simulation_events(limit: int = Query(default=60, ge=1, le=240)):
    return {"events": get_recent_simulation_events(limit=limit)}


@router.post("/reset")
def reset_simulation():
    reset_simulation_events()
    return get_simulation_status()

