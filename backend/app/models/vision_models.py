from pydantic import BaseModel


class VisionAnalysisRequest(BaseModel):
    imageId: str
    cropType: str = "mango"
    zoneId: str | None = None
    language: str = "en"
