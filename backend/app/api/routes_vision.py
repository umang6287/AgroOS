from fastapi import APIRouter, Body

from app.agents.supervisor_agent import run_vision_workflow
from app.models.vision_models import VisionAnalysisRequest

router = APIRouter(prefix="/vision", tags=["vision"])


@router.post("/analyze")
def analyze_leaf(request: VisionAnalysisRequest | None = Body(default=None)):
    request_model = (
        request
        if isinstance(request, VisionAnalysisRequest)
        else VisionAnalysisRequest(imageId="leaf-demo-tomato-001", cropType="mango", zoneId="zone-b")
    )
    image_context = request_model.model_dump() if hasattr(request_model, "model_dump") else request_model.dict()
    _, result = run_vision_workflow(image_context)
    return result
