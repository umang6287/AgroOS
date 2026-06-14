from typing import Any


def make_envelope(
    *,
    agent: str,
    status: str = "completed",
    summary: str,
    confidence: float,
    latency_ms: int,
    estimated_cost_usd: float = 0.0,
    requires_human_review: bool = False,
    data: dict[str, Any] | None = None,
    explanation: list[str] | None = None,
    warnings: list[str] | None = None,
    source_ids: list[str] | None = None,
    next_agent: str | None = None,
) -> dict[str, Any]:
    return {
        "agent": agent,
        "status": status,
        "summary": summary,
        "confidence": confidence,
        "latencyMs": latency_ms,
        "estimatedCostUsd": estimated_cost_usd,
        "requiresHumanReview": requires_human_review,
        "explanation": explanation or [],
        "warnings": warnings or [],
        "sourceIds": source_ids or [],
        "nextAgent": next_agent,
        "data": data or {},
    }
