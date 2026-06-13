from fastapi import APIRouter

router = APIRouter(prefix="/farm", tags=["farm"])


@router.get("/state")
def get_farm_state():
    return {"farmId": "demo-farm", "zones": []}
