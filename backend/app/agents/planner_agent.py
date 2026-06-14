from app.agents.envelope import make_envelope
from app.agents.language import normalize_language, localized_text
from app.demo_store import server_now_iso
from app.services.openai_service import generate_agent_copy


def run_planner_agent(context):
    language = normalize_language(context.get("language"))
    now = server_now_iso()
    risk_data = context.get("risk", {}).get("data", {})
    sensor_data = context.get("sensor", {}).get("data", {})
    vision_data = context.get("vision", {}).get("data", {})
    autonomy_mode = context.get("autonomyMode", "auto_schedule_low_risk")
    zone_id = risk_data.get("zoneId", "zone-b")
    irrigation_priority = "critical" if risk_data.get("riskLevel") == "critical" else "high"

    actions = [
        {
            "id": "act-irrigate-zone-b-001",
            "type": "schedule_irrigation",
            "zoneId": zone_id,
            "priority": irrigation_priority,
            "status": "scheduled",
            "summary": "12 minute drip irrigation scheduled for Zone B.",
            "expectedOutcome": {
                "metric": "soilMoisturePct",
                "targetValue": 34,
                "verificationWindowMinutes": 10,
            },
            "createdAt": now,
        },
        {
            "id": "act-inspect-zone-b-001",
            "type": "robot_inspection",
            "zoneId": zone_id,
            "priority": "medium",
            "status": "active",
            "summary": "Robot R1 assigned to inspect Tree 23 and the Zone B drip line.",
            "createdAt": now,
        },
        {
            "id": "act-outcome-zone-b-001",
            "type": "verify_outcome",
            "zoneId": zone_id,
            "priority": "medium",
            "status": "pending_verification",
            "summary": "Outcome Agent will compare follow-up telemetry after irrigation.",
            "createdAt": now,
        },
    ]
    pending_approvals = []

    if vision_data:
        actions.append(
            {
                "id": "act-treatment-review-zone-b-001",
                "type": "treatment_review",
                "zoneId": zone_id,
                "priority": "high",
                "status": "needs_approval",
                "summary": "Possible fungal treatment is held for farmer approval before spraying.",
                "createdAt": now,
            }
        )
        pending_approvals.append(
            {
                "id": "approval-treatment-001",
                "title": "Fungal treatment review",
                "reason": "Vision Agent found possible early fungal marks. Spraying requires farmer approval.",
                "channel": "whatsapp",
            }
        )

    deterministic_explanation = [
        "Short irrigation is reversible and simulated in the demo.",
        "High-risk spray treatment is converted into a farmer approval request.",
    ]
    generated = generate_agent_copy(
        agent="planner",
        task="Write a concise plan summary for the farmer. Do not change actions or approval gates.",
        language=language,
        farm_context={
            "risk": risk_data,
            "sensor": sensor_data,
            "vision": vision_data,
            "autonomyMode": autonomy_mode,
            "actions": actions,
            "pendingApprovals": pending_approvals,
            "deterministicExplanation": deterministic_explanation,
        },
        fallback={
            "summary": localized_text(language, "planner_summary"),
            "message": localized_text(language, "planner_summary"),
            "explanation": deterministic_explanation,
        },
    )

    return make_envelope(
        agent="planner",
        summary=generated["summary"],
        confidence=0.94,
        latency_ms=260 + generated["latencyMs"],
        estimated_cost_usd=0.002 + generated["estimatedCostUsd"],
        data={
            "zoneId": zone_id,
            "autonomyMode": autonomy_mode,
            "actions": actions,
            "pendingApprovals": pending_approvals,
            "baselineMoisturePct": sensor_data.get("soilMoisturePct", 21),
            "language": language,
            "generatedMessage": generated["message"],
        },
        explanation=generated["explanation"],
        warnings=generated["warnings"],
        next_agent="robot",
    )
