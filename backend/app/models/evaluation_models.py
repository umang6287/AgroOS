from pydantic import BaseModel


class AgentScorecard(BaseModel):
    agent: str
    confidence: float
    latencyMs: int
    estimatedCostUsd: float
    qualityScore: float
    requiresHumanReview: bool
