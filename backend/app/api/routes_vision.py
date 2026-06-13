from fastapi import APIRouter

router = APIRouter(prefix="/vision", tags=["vision"])


@router.post("/analyze")
def analyze_leaf():
    return {"status": "queued"}
