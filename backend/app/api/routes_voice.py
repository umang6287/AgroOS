from fastapi import APIRouter

router = APIRouter(prefix="/voice", tags=["voice"])


@router.post("/ask")
def ask_farm_manager():
    return {"responseText": "AgriOS voice manager is ready."}
