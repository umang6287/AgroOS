from pydantic import BaseModel


class AgentEnvelope(BaseModel):
    agent: str
    status: str
    summary: str = ""
    confidence: float = 0.0
    latencyMs: int = 0
    estimatedCostUsd: float = 0.0
    requiresHumanReview: bool = False
    data: dict = {}
