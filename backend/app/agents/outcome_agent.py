from app.agents.envelope import make_envelope
from app.demo_store import server_now_iso


def run_outcome_agent(context):
    telemetry = context.get("telemetry", {})
    planner_data = context.get("planner", {}).get("data", {})
    baseline = planner_data.get("baselineMoisturePct", telemetry.get("soilMoisturePct", 21))
    follow_up = max(baseline + 13, 34)
    status = "successful" if follow_up >= 34 else "partial"
    outcome = {
        "outcomeId": "outcome-zone-b-001",
        "actionId": "act-irrigate-zone-b-001",
        "zoneId": "zone-b",
        "status": status,
        "metric": "soilMoisturePct",
        "beforeValue": baseline,
        "afterValue": follow_up,
        "targetValue": 34,
        "deltaPct": follow_up - baseline,
        "summary": f"Zone B moisture increased from {baseline}% to {follow_up}% after irrigation.",
        "verifiedAt": server_now_iso(),
        "warnings": ["fallback:simulated_outcome"],
    }

    return make_envelope(
        agent="outcome",
        summary="Stored Zone B moisture baseline and verified simulated follow-up telemetry.",
        confidence=0.92,
        latency_ms=105,
        data={"outcome": outcome},
        explanation=["Outcome Agent compared stored baseline against accelerated follow-up telemetry."],
        warnings=["fallback:simulated_outcome"],
        source_ids=[outcome["outcomeId"]],
        next_agent="evaluation",
    )
