from fastapi import APIRouter

from app.demo_store import get_farm_state as get_demo_state

router = APIRouter(prefix="/farm", tags=["farm"])


@router.get("/state")
def get_farm_state():
    return get_demo_state()
