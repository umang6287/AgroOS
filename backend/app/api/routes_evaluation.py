from fastapi import APIRouter

router = APIRouter(prefix="/evaluation", tags=["evaluation"])


@router.get("/scorecards")
def get_scorecards():
    return {"scorecards": []}
