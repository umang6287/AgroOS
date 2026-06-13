from fastapi import APIRouter

router = APIRouter(prefix="/agents", tags=["agents"])


@router.get("/trace")
def get_agent_trace():
    return {"trace": []}
