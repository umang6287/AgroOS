from typing import Any

from pydantic import BaseModel, Field


class AgentEnvelope(BaseModel):
    agent: str
    status: str
    summary: str = ""
    confidence: float = 0.0
    latencyMs: int = 0
    estimatedCostUsd: float = 0.0
    requiresHumanReview: bool = False
    explanation: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    sourceIds: list[str] = Field(default_factory=list)
    nextAgent: str | None = None
    data: dict[str, Any] = Field(default_factory=dict)


class AgentTrace(BaseModel):
    runId: str
    workflow: str
    status: str
    startedAt: str
    completedAt: str | None = None
    trace: list[AgentEnvelope] = Field(default_factory=list)
