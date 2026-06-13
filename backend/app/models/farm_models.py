from pydantic import BaseModel


class FarmZone(BaseModel):
    id: str
    name: str
    crop_type: str
